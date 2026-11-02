"""Contrôles de cohérence (SCRAPING.md §6). Exit 1 si une ERREUR ; les avertissements passent.

Écrit data/validation-report.md et affiche 10 sessions tirées au hasard à vérifier à la
main contre le PDF (avec le numéro de page).

Usage : python scripts/validate.py [--seed N]
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

import pdfplumber
from pydantic import TypeAdapter, ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parent))
from models import Meta, Session, Sport, Venue  # noqa: E402
from parse_programme import parse_day_header  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
REPORT = DATA / "validation-report.md"

CODE = re.compile(r"^(BS5|RU7|BK3|[A-Z]{3})(\d{2,3})$")
TIME_RANGE = re.compile(r"\d{2}:\d{2}\s*-\s*\d{2}:\d{2}")
FIRST_DAY, LAST_DAY = date(2026, 10, 30), date(2026, 11, 13)
MAX_HOURS = 12


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def pdf_counts(pdf_path: Path) -> dict[int, int]:
    """Méthode indépendante : compte les `HH:MM - HH:MM` du texte brut, par jour."""
    counts: Counter = Counter()
    day = None
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for line in (page.extract_text() or "").splitlines():
                dh = parse_day_header(line)
                if dh:
                    day = dh[0]
                n = len(TIME_RANGE.findall(line))
                if n:
                    counts[day] += n
    return dict(counts)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=None, help="graine du tirage (défaut : aléatoire)")
    args = ap.parse_args()

    errors: list[str] = []
    warnings: list[str] = []

    sessions = load(DATA / "sessions.json")
    venues = load(DATA / "venues.json")
    sports = load(DATA / "sports.json")
    meta = load(DATA / "meta.json")
    programme = load(RAW / "programme.sessions.json")
    raw_by_code = {s["code"]: s for s in programme["sessions"]}

    # 0. Schéma (miroir pydantic du zod)
    for label, adapter, payload in (
        ("sessions.json", TypeAdapter(list[Session]), sessions),
        ("venues.json", TypeAdapter(list[Venue]), venues),
        ("sports.json", TypeAdapter(list[Sport]), sports),
        ("meta.json", TypeAdapter(Meta), meta),
    ):
        try:
            adapter.validate_python(payload)
        except ValidationError as exc:
            errors.append(f"schéma {label} : {exc.error_count()} erreur(s) — {str(exc)[:500]}")

    sport_sessions = [s for s in sessions if s["kind"] == "sport"]
    venue_by_id = {v["id"]: v for v in venues}
    prefixes = {s["codePrefix"]: s["id"] for s in sports}

    # 1. Compte par jour : PDF (texte brut) = sessions.json
    pdf_path = RAW / "programmePdf.pdf"
    per_day_pdf = pdf_counts(pdf_path) if pdf_path.exists() else None
    per_day_json = Counter(s["day"] for s in sport_sessions)
    if per_day_pdf is None:
        errors.append("data/raw/programmePdf.pdf absent : impossible de recompter (lancer fetch_sources.py)")
    else:
        for d in sorted(set(per_day_pdf) | set(per_day_json), key=lambda x: (x is None, x)):
            if per_day_pdf.get(d, 0) != per_day_json.get(d, 0):
                errors.append(f"jour {d} : {per_day_pdf.get(d, 0)} horaires dans le PDF, "
                              f"{per_day_json.get(d, 0)} sessions dans sessions.json")

    # 2. Codes uniques, préfixes connus, numéros croissants par sport
    ids = Counter(s["id"] for s in sessions)
    for k, n in ids.items():
        if n > 1:
            errors.append(f"code en double : {k} ×{n}")
    series: dict[tuple[str, int], list[tuple[str, int, str]]] = defaultdict(list)
    for s in sport_sessions:
        m = CODE.match(s["id"])
        if not m:
            errors.append(f"code au format inattendu : {s['id']}")
            continue
        if m[1] not in prefixes:
            errors.append(f"préfixe inconnu : {s['id']} ({m[1]})")
        elif prefixes[m[1]] != s["sportId"]:
            errors.append(f"{s['id']} : sportId {s['sportId']} ≠ préfixe {m[1]}")
        # une série = même préfixe et même nombre de chiffres (GAR100… ≠ GAR01…)
        series[(m[1], len(m[2]))].append((s["start"], int(m[2]), s["id"]))
    multi_series = defaultdict(list)
    for (prefix, width), items in series.items():
        multi_series[prefix].append(width)
        items.sort()
        nums = [n for _, n, _ in items]
        if nums != sorted(nums):
            bad = [c for (_, n, c), prev in zip(items[1:], nums) if n < prev]
            errors.append(f"numéros non croissants dans le temps pour {prefix} : {bad}")
    for prefix, widths in multi_series.items():
        if len(widths) > 1:
            first = {w: min(it[0] for it in series[(prefix, w)])[:10] for w in widths}
            warnings.append(f"{prefix} : deux séries de numérotation "
                            + ", ".join(f"{w} chiffres (dès le {d})" for w, d in sorted(first.items())))

    # 3. Sites résolus, secteur cohérent avec le site
    for s in sessions:
        v = venue_by_id.get(s["venueId"])
        if v is None:
            errors.append(f"{s['id']} : site inconnu {s['venueId']}")
            continue
        raw = raw_by_code.get(s["id"])
        if raw:
            c = raw["cluster"].split()[0].lower()
            if c != v["cluster"]:
                errors.append(f"{s['id']} : secteur PDF {raw['cluster']!r} ≠ {v['cluster']} ({v['id']})")

    # 4/5. Dates dans la fenêtre, start < end, durée < 12 h
    for s in sessions:
        st = datetime.fromisoformat(s["start"])
        if not (FIRST_DAY <= st.date() <= LAST_DAY):
            errors.append(f"{s['id']} : date hors JOJ {st.date()}")
        if st.utcoffset().total_seconds() != 0:
            errors.append(f"{s['id']} : offset ≠ +00:00")
        if s["end"] is None:
            if s["kind"] == "sport" and not s["scheduleConflict"]:
                errors.append(f"{s['id']} : session sportive sans heure de fin")
            en = None
        else:
            en = datetime.fromisoformat(s["end"])
        if en is None:
            pass
        elif not st < en:
            errors.append(f"{s['id']} : début {s['start']} ≥ fin {s['end']}")
        elif (en - st).total_seconds() >= MAX_HOURS * 3600:
            errors.append(f"{s['id']} : durée ≥ {MAX_HOURS} h")
        expected_day = (st.date() - date(2026, 11, 1)).days + 1
        if s["day"] != expected_day:
            errors.append(f"{s['id']} : day={s['day']} mais date {st.date()} (attendu {expected_day})")

    # 5b. Horaires corrigés par la billetterie : le PDF d'origine doit être conservé tel quel
    for s in sport_sessions:
        c = s["scheduleConflict"]
        raw = raw_by_code.get(s["id"])
        if c and raw:
            if (c["pdfStart"], c["pdfEnd"]) != (raw["start"], raw["end"]):
                errors.append(f"{s['id']} : scheduleConflict ne reprend pas l'horaire du PDF")
            if s["start"] != c["ticketStart"] or s["start"][:10] != raw["start"][:10]:
                errors.append(f"{s['id']} : début affiché ≠ billetterie, ou changement de jour")
        elif raw and (s["start"], s["end"]) != (raw["start"], raw["end"]):
            errors.append(f"{s['id']} : horaire modifié sans scheduleConflict")

    # 6. Aucune session sportive sans épreuve ; traductions cohérentes
    for s in sport_sessions:
        if not s["eventsRaw"]:
            errors.append(f"{s['id']} : aucune épreuve")
        if len(s["events"]) > len(s["eventsRaw"]):
            errors.append(f"{s['id']} : plus d'épreuves traduites que de lignes source")

    # 7. Gratuité : jamais false, toujours sourcée
    for s in sessions:
        if s["isFree"] is False:
            errors.append(f"{s['id']} : isFree=false (interdit, utiliser null)")
        if s["isFree"] is True and not s["freeSource"]:
            errors.append(f"{s['id']} : gratuit sans source")

    # ---------------- avertissements (rapport)
    anomalies = [(s["code"], a) for s in programme["sessions"] for a in s["anomalies"]]
    parser_warn = [(s["code"], w) for s in programme["sessions"] for w in s["warnings"]]
    untranslated = [(s["id"], raw) for s in sport_sessions
                    for raw, fr in zip(s["eventsRaw"], s["events"]) if raw == fr]
    judo_space = [(s["id"], e) for s in sport_sessions for e in s["eventsRaw"]
                  if re.match(r"^(Men|Women) - \d+kg", e)]
    no_ticket = [s["id"] for s in sessions if s["ticketMatch"] == "none"]
    shared = defaultdict(list)
    for s in sessions:
        if s["ticketMatch"] == "venue-day":
            shared[(s["venueId"], s["start"][:10])].append(s["id"])
    no_access = [v["id"] for v in venues if not v["accessNote"]]
    no_gps = [v["id"] for v in venues if v["lat"] is None or v["lng"] is None]
    warnings.extend(meta.get("warnings", []))
    # garde-fou billetterie (fetch_sources.py) : relevé rejeté, ancien tickets.json conservé
    guard_file = RAW / "tickets.guard.json"
    guard = load(guard_file) if guard_file.exists() else None
    if guard:
        warnings.insert(0, "garde-fou billetterie : relevé du " + guard["checkedAt"] +
                        " rejeté, dernier tickets.json valide conservé — " + " ; ".join(guard["reasons"]))

    # ---------------- tirage
    rng_seed = args.seed if args.seed is not None else random.randrange(10**6)
    sample = random.Random(rng_seed).sample(sport_sessions, k=min(10, len(sport_sessions)))

    # ---------------- rapport
    L = [f"# Rapport de validation — {datetime.now().astimezone().isoformat(timespec='minutes')}", ""]
    L.append(f"**{'❌ ÉCHEC' if errors else '✅ OK'}** — {len(errors)} erreur(s), "
             f"{len(warnings)} avertissement(s). Données générées le {meta['generatedAt']}.")
    L += ["", "## Compteurs", "",
          f"- Sessions : {len(sessions)} ({len(sport_sessions)} sportives, "
          f"{len(sessions) - len(sport_sessions)} Fan)",
          f"- Billetterie : code {sum(s['ticketMatch'] == 'code' for s in sessions)} · "
          f"site+jour {sum(s['ticketMatch'] == 'venue-day' for s in sessions)} · "
          f"aucun {len(no_ticket)}",
          f"- Gratuites : {sum(s['isFree'] is True for s in sessions)} · "
          f"Finales : {sum(s['hasFinal'] for s in sessions)}", "",
          "| Jour | PDF (texte brut) | sessions.json |", "|---|---|---|"]
    for d in sorted(per_day_json):
        L.append(f"| {d} | {per_day_pdf.get(d, '—') if per_day_pdf else '—'} | {per_day_json[d]} |")
    if guard:
        L += ["", "## ⛔ Garde-fou billetterie", "",
              f"Relevé du {guard['checkedAt']} **rejeté** : {guard['received']} sessions reçues "
              f"(dernier relevé valide : {guard['previous']}). Le site garde les statuts du dernier "
              "relevé valide ; l'Action est marquée en échec pour qu'on regarde.", ""]
        L += [f"- {r}" for r in guard["reasons"]]
    L += ["", "## Erreurs", ""] + ([f"- {e}" for e in errors] or ["Aucune."])
    L += ["", "## Avertissements", ""] + ([f"- {w}" for w in warnings] or ["Aucun."])
    L += ["", "## Anomalies de la source (S1)", "",
          "Texte source gardé tel quel dans `eventsRaw` ; corrections éventuelles dans "
          "`data/seed/overrides.json`.", ""]
    L += [f"- `{c}` : {a}" for c, a in anomalies]
    L += [f"- `{c}` : « {e} » — espace entre le tiret et le poids (catégorie -55 kg ?) : "
          "affiché « 55 kg », non corrigé" for c, e in judo_space]
    if parser_warn:
        L += ["", "## Alertes du parser", ""] + [f"- `{c}` : {w}" for c, w in parser_warn]
    L += ["", "## Épreuves gardées en anglais", ""]
    L += [f"- `{c}` : {e}" for c, e in untranslated] or ["Aucune."]
    L += ["", f"## Sessions sans lien billetterie ({len(no_ticket)})", "",
          ", ".join(f"`{c}`" for c in no_ticket) or "Aucune."]
    L += ["", "## Billets groupés (jointure site + jour)", ""]
    L += [f"- {d} · {v} : {', '.join(ids)}" for (v, d), ids in sorted(shared.items(), key=lambda x: x[0][1])] or ["Aucun."]
    L += ["", "## Sites", "",
          f"- Sans note d'accès ({len(no_access)}) : {', '.join(no_access) or '—'}",
          f"- Sans coordonnées GPS vérifiées ({len(no_gps)}) : {', '.join(no_gps) or '—'}"]
    L += ["", f"## Contrôle humain — 10 sessions tirées au hasard (graine {rng_seed})", "",
          "À comparer ligne à ligne avec le PDF (numéro de page indiqué).", ""]
    for s in sample:
        raw = raw_by_code[s["id"]]
        L.append(f"- [ ] **{s['id']}** — p. {raw['page']} — jour {s['day']} "
                 f"{raw['start'][11:16]}–{raw['end'][11:16]} — {raw['venue']} — "
                 + " / ".join(s["eventsRaw"]))
    REPORT.write_text("\n".join(L) + "\n", encoding="utf-8")

    # ---------------- console
    print(f"{'❌ ÉCHEC' if errors else '✅ OK'} : {len(errors)} erreur(s), {len(warnings)} avertissement(s)")
    for e in errors:
        print(f"  ERREUR  {e}")
    for w in warnings:
        print(f"  ⚠️  {w}")
    print(f"\nÀ vérifier contre le PDF (graine {rng_seed}) :")
    for s in sample:
        raw = raw_by_code[s["id"]]
        print(f"  p.{raw['page']}  {s['id']:<6} J{s['day']:<3} {raw['start'][11:16]}–{raw['end'][11:16]}  "
              f"{raw['venue']:<24} {' / '.join(s['eventsRaw'])[:90]}")
    print(f"→ {REPORT.relative_to(ROOT)}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
