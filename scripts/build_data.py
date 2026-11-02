"""Normalise et fusionne les sources → data/sessions.json, venues.json, sports.json, meta.json.

Entrées :
- data/raw/programme.sessions.json  (parse_programme.py, S1)
- data/raw/tickets.parsed.json      (parse_tickets.py, S2 — plan A/B/C)
- data/raw/manifest.json            (fetch_sources.py : hash des sources)
- data/seed/*.json                  (venues, sports, sources, overrides)

Règles (SCRAPING.md §5) : sites résolus par alias ; jointure billetterie code → site+jour
→ aucune ; gratuité **uniquement** depuis overrides.json avec une source URL ; `hasFinal`
par regex ; événements Fan depuis la billetterie. Rien n'est inventé : inconnu = null.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path

from pydantic import TypeAdapter, ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parent))
from models import Meta, Session, Sport, Venue  # noqa: E402
from translate_events import translate  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
SEED = DATA / "seed"

CODE_PREFIX = re.compile(r"^(BS5|RU7|BK3|[A-Z]{3})(\d{2,3})$")
FINAL = re.compile(
    r"(?<!semi-)(?<!semi )\b(final|finals|gold medal|final block|final rounds)\b", re.I)
DAY1 = date(2026, 11, 1)
CLUSTER_OF = {"dakar": "dakar", "diamniadio": "diamniadio", "saly": "saly"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def is_url(v) -> bool:
    return isinstance(v, str) and re.match(r"^https?://\S+$", v) is not None


# ------------------------------------------------------------------ sites

def norm(name: str) -> tuple[str, str | None]:
    """Clé de comparaison (sans casse, accents, apostrophes) + hall entre parenthèses."""
    hall = None
    m = re.match(r"^(.*?)\s*\((.*)\)\s*$", name)
    if m:
        name, hall = m[1], m[2].strip()
    s = unicodedata.normalize("NFKD", name.replace("œ", "oe").replace("Œ", "Oe"))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"['’`]", "", s.casefold())
    return re.sub(r"\s+", " ", s).strip(), hall


class VenueIndex:
    def __init__(self, venues: list[dict]):
        self.by_key: dict[str, str] = {}
        for v in venues:
            for a in [v["name"], *v["aliases"]]:
                self.by_key[norm(a)[0]] = v["id"]

    def resolve(self, name: str | None) -> tuple[str | None, str | None]:
        if not name:
            return None, None
        key, hall = norm(name)
        return self.by_key.get(key), hall


def cluster_of(raw: str) -> str | None:
    """« Saly Beach West » dans la colonne Cluster du PDF → saly."""
    key = norm(raw)[0]
    for k, v in CLUSTER_OF.items():
        if key == k or key.startswith(k + " "):
            return v
    return None


# ------------------------------------------------------------------ overrides

def free_rule(overrides: dict, prefix: str, warnings: list[str]) -> tuple[bool | None, str | None]:
    for rule in overrides.get("free", []):
        if rule["match"].get("codePrefix") != prefix:
            continue
        if not is_url(rule.get("source")):
            msg = (f"gratuité {prefix}* non appliquée : source non vérifiée "
                   f"({rule.get('source')!r}) dans overrides.json")
            if msg not in warnings:
                warnings.append(msg)
            return None, None
        return (True if rule.get("isFree") is True else None), rule["source"]
    return None, None


def fixes_for(overrides: dict, code: str) -> list[dict]:
    out = []
    for f in overrides.get("eventFixes", []):
        if f.get("sessionId") == code or (
                f.get("sessionIdPrefix") and code.startswith(f["sessionIdPrefix"])):
            out.append(f)
    return out


def apply_fixes(code: str, raw: list[str], fixes: list[dict], warnings: list[str]) -> list[str]:
    """Traduit les épreuves en appliquant les corrections documentées. `raw` reste intouché."""
    src = list(raw)
    display_as = None
    for f in fixes:
        action = f["action"]
        if action == "dedupe":
            seen, deduped = set(), []
            for e in src:
                if e not in seen:
                    seen.add(e)
                    deduped.append(e)
            src = deduped
        elif action.startswith("replace:"):
            old, new = (x.strip() for x in action[len("replace:"):].split("=>"))
            src = [re.sub(rf"^{re.escape(old)}(?=\s)", new, e) for e in src]
        elif action.startswith("display-as:"):
            display_as = action.split(":", 1)[1].strip().strip("'\"")
        elif action == "flag-only":
            warnings.append(f"{code} : {f['issue']} (non corrigé, à vérifier)")
    events = [translate(e) for e in src]
    if display_as:
        events = [re.sub(r"^Simple femmes et hommes", display_as, e) for e in events]
    return events


# ------------------------------------------------------------------ billetterie

def overlaps(a_start: str, a_end: str, b_start: str | None, b_end: str | None) -> bool:
    """Chevauchement session [a] / billet [b]. Billet sans fin = valable jusqu'au soir."""
    if not b_start:
        return True  # billet sans horaire : même site + même jour suffit
    if not b_end:
        return b_start < a_end[11:16]
    return a_start[11:16] < b_end and b_start < a_end[11:16]


def day_number(d: str) -> int:
    return (date.fromisoformat(d) - DAY1).days + 1


# ------------------------------------------------------------------ main

def main() -> int:
    warnings: list[str] = []
    sources = load(SEED / "sources.json")
    overrides = load(SEED / "overrides.json")
    seed_venues = load(SEED / "venues.json")
    seed_sports = load(SEED / "sports.json")
    programme = load(RAW / "programme.sessions.json")
    tickets_path = RAW / "tickets.parsed.json"
    tickets = load(tickets_path) if tickets_path.exists() else {"plan": "C", "items": []}
    manifest = load(RAW / "manifest.json") if (RAW / "manifest.json").exists() else {}

    pdf_url = sources["programmePdf"]["fileUrl"]
    venues_idx = VenueIndex(seed_venues)
    sport_by_prefix = {s["codePrefix"]: s for s in seed_sports}
    venue_by_id = {v["id"]: v for v in seed_venues}

    # -- billetterie : index par code, et par site + jour pour la jointure de secours
    tickets_by_code: dict[str, dict] = {}
    unmatched_tickets: list[dict] = []
    pdf_codes = {s["code"] for s in programme["sessions"]}
    for t in tickets["items"]:
        vid, _ = venues_idx.resolve(t.get("venue"))
        t = {**t, "venueId": vid}
        if t["code"] in pdf_codes:
            tickets_by_code[t["code"]] = t
        else:
            unmatched_tickets.append(t)

    sessions: list[dict] = []
    unresolved: set[str] = set()
    time_conflicts: list[str] = []
    errors: list[str] = []

    for s in programme["sessions"]:
        code = s["code"]
        prefix = CODE_PREFIX.match(code)[1]
        sport = sport_by_prefix.get(prefix)
        venue_id, hall = venues_idx.resolve(s["venue"])
        if venue_id is None:
            unresolved.add(s["venue"])
            continue
        pdf_cluster = cluster_of(s["cluster"])
        if pdf_cluster != venue_by_id[venue_id]["cluster"]:
            warnings.append(f"{code} : secteur PDF {s['cluster']!r} ≠ secteur du site {venue_id}")

        is_free, free_src = free_rule(overrides, prefix, warnings)
        events = apply_fixes(code, s["eventsRaw"], fixes_for(overrides, code), warnings)

        ticket_url, match, status = None, "none", "unknown"
        start, end, conflict = s["start"], s["end"], None
        if code in tickets_by_code:
            t = tickets_by_code[code]
            ticket_url, match, status = t["url"], "code", t["status"]
            t["_used"] = True
            if t.get("date") and t["date"] != s["date"]:
                errors.append(f"{code} : le {s['date']} dans le PDF, le {t['date']} sur la billetterie "
                              "(changement de jour : à trancher dans overrides.json)")
            elif t.get("start") and t["start"] != s["start"][11:16]:
                # Billetterie plus récente que le PDF : on affiche son début. Elle ne publie
                # pas de fin → end = null plutôt qu'une fin recalculée.
                time_conflicts.append(
                    f"{code} : {s['start'][11:16]} dans le PDF, {t['start']} sur la billetterie")
                conflict = {"pdfStart": start, "pdfEnd": end,
                            "ticketStart": f"{t['date']}T{t['start']}:00+00:00"}
                start, end = conflict["ticketStart"], None
            _, ticket_hall = venues_idx.resolve(t.get("venue"))
            hall = hall or ticket_hall
        else:
            for t in unmatched_tickets:
                # billet groupé (SBWxx) : même site, même jour, créneau qui chevauche,
                # et un des sports listés sur le billet quand la billetterie les donne
                if (t["venueId"] == venue_id and t.get("date") == s["date"]
                        and (not t.get("sports") or prefix in t["sports"])
                        and overlaps(s["start"], s["end"], t.get("start"), t.get("end"))):
                    ticket_url, match, status = t["url"], "venue-day", t["status"]
                    t["_used"] = True
                    break

        sessions.append({
            "id": code,
            "kind": "sport",
            "sportId": sport["id"] if sport else None,
            "title": None,
            "venueId": venue_id,
            "hall": hall,
            "start": start,
            "end": end,
            "day": s["day"],
            "events": events,
            "eventsRaw": s["eventsRaw"],
            "hasFinal": any(FINAL.search(e) for e in s["eventsRaw"]),
            "isFree": is_free,
            "freeSource": free_src,
            "ticketUrl": ticket_url,
            "ticketMatch": match,
            "ticketStatus": status,
            "sourceUrl": pdf_url,
            "scheduleConflict": conflict,
        })

    # -- événements Fan (Pass Fan Zone CTOxx, Festival Corniche CORxx) : billetterie seulement
    fan_by_prefix = {f["codePrefix"]: f for f in overrides.get("fanEvents", []) if "codePrefix" in f}
    fan_by_code = {f["code"]: f for f in overrides.get("fanEvents", []) if "code" in f}
    orphan_tickets: list[str] = []
    for t in unmatched_tickets:
        prefix = CODE_PREFIX.match(t["code"])[1]
        rule = fan_by_code.get(t["code"]) or fan_by_prefix.get(prefix)
        if not rule:
            if not t.get("_used"):
                orphan_tickets.append(
                    f"{t['code']} ({t.get('title') or '?'}, {t.get('date')} {t.get('start')}, "
                    f"{t.get('venue')})")
            continue
        if not (t.get("date") and t.get("start")):
            warnings.append(f"billet Fan {t['code']} sans date/heure : ignoré")
            continue
        start = f"{t['date']}T{t['start']}:00+00:00"
        end = f"{t['date']}T{t['end']}:00+00:00" if t.get("end") else None
        sessions.append({
            "id": t["code"], "kind": "fan", "sportId": None,
            "title": rule["title"], "venueId": rule["venueId"], "hall": None,
            "start": start, "end": end, "day": day_number(t["date"]),
            "events": [], "eventsRaw": [], "hasFinal": False,
            "isFree": True if rule.get("isFree") is True and is_url(rule.get("source")) else None,
            "freeSource": rule["source"] if is_url(rule.get("source")) else None,
            "ticketUrl": t.get("url"), "ticketMatch": "code", "ticketStatus": t["status"],
            "sourceUrl": sources["tickets"]["programmeUrl"],
            "scheduleConflict": None,
        })

    if errors:
        print("❌ " + "\n❌ ".join(errors), file=sys.stderr)
        return 1
    if unresolved:
        print("❌ Sites non résolus (ajouter l'alias dans data/seed/venues.json) :", file=sys.stderr)
        for v in sorted(unresolved):
            print(f"   - {v!r}", file=sys.stderr)
        return 1

    sessions.sort(key=lambda x: (x["start"], x["id"]))
    venues_out = [{k: v for k, v in ven.items() if not k.startswith("_")} for ven in seed_venues]
    sports_out = seed_sports

    # -- meta
    meta_sources = []
    for sid, m in sorted(manifest.items()):
        meta_sources.append({"id": sid, "url": m["url"], "sha256": m["sha256"],
                             "fetchedAt": m["fetchedAt"]})
    if tickets.get("sha256"):
        meta_sources.append({"id": "S2", "url": sources["tickets"]["programmeUrl"],
                             "sha256": tickets["sha256"], "fetchedAt": tickets["fetchedAt"]})
    if time_conflicts:
        warnings.append(f"{len(time_conflicts)} horaire(s) de la billetterie affiché(s) à la place "
                        "du PDF (fin inconnue, mention dans l'UI) : "
                        + " ; ".join(time_conflicts))
    if orphan_tickets:
        warnings.append("billets sans session dans le PDF : " + " ; ".join(orphan_tickets))
    if tickets["plan"] != "C" and not any(t.get("url") for t in tickets["items"]):
        warnings.append("billetterie : aucun lien d'achat (tickets.purchaseUrlTemplate non renseigné) "
                        "— l'UI renvoie vers la page programme avec le code")
    if tickets["plan"] != "C" and all(t.get("status") == "unknown" for t in tickets["items"]):
        warnings.append("billetterie : statuts non interprétés (tickets.statusMap non renseigné)")
    if tickets["plan"] == "C":
        warnings.append("billetterie : plan C (aucun fichier data/raw/tickets.json|html) — "
                        "pas de lien profond")
    meta = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sources": meta_sources,
        "counts": {"sessions": len(sessions), "venues": len(venues_out), "sports": len(sports_out)},
        "warnings": warnings,
    }

    # -- validation de schéma avant écriture (le miroir pydantic du zod)
    try:
        TypeAdapter(list[Session]).validate_python(sessions)
        TypeAdapter(list[Venue]).validate_python(venues_out)
        TypeAdapter(list[Sport]).validate_python(sports_out)
        Meta.model_validate(meta)
    except ValidationError as exc:
        print(f"❌ Schéma invalide :\n{exc}", file=sys.stderr)
        return 1

    dump(DATA / "sessions.json", sessions)
    dump(DATA / "venues.json", venues_out)
    dump(DATA / "sports.json", sports_out)
    dump(DATA / "meta.json", meta)

    by_match = {k: sum(1 for s in sessions if s["ticketMatch"] == k) for k in ("code", "venue-day", "none")}
    print(f"Billetterie : plan {tickets['plan']}")
    print(f"{len(sessions)} sessions ({sum(s['kind'] == 'fan' for s in sessions)} Fan) · "
          f"{len(venues_out)} sites · {len(sports_out)} sports")
    print(f"Liens billetterie : code {by_match['code']} · site+jour {by_match['venue-day']} · "
          f"aucun {by_match['none']}")
    print(f"Gratuites : {sum(s['isFree'] is True for s in sessions)} · "
          f"Finales : {sum(s['hasFinal'] for s in sessions)}")
    for w in warnings:
        print(f"  ⚠️  {w}")
    print("→ data/sessions.json, venues.json, sports.json, meta.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
