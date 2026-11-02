"""Télécharge les sources marquées `ci-daily` dans data/seed/sources.json vers data/raw/.

Règles (CLAUDE.md §4, SCRAPING.md) :
- User-Agent honnête lu dans sources.json ;
- 1 requête par seconde maximum, timeouts, pas de retry agressif ;
- billetterie (S2) : UNE requête POST vers l'endpoint JSON public décrit dans
  sources.json (`tickets.api`), sans retry, sans en-tête imitant un navigateur, sans cookie.
  Tout échec (HTTP, challenge anti-bot, JSON invalide ou vide) est silencieux : on garde le
  dernier data/raw/tickets.json valide. Voir SCRAPING.md §4.
- garde-fou billetterie (`check_tickets`) : un JSON valide mais suspect (sessions en chute de
  plus de 10 %, ou discipline disparue) n'est PAS enregistré ; les raisons vont dans
  data/raw/tickets.guard.json, que validate.py reporte et qui fait échouer l'Action.

Usage :
    python scripts/fetch_sources.py                 # toutes les sources ci-daily
    python scripts/fetch_sources.py --only S1       # une source (id ou clé)
    python scripts/fetch_sources.py --unchanged     # exit 0 si aucun hash n'a changé
                                                    # depuis data/meta.json, exit 10 sinon
                                                    # (exit 1 = erreur de téléchargement)

Sortie : data/raw/<clé>.pdf, data/raw/tickets.json + data/raw/manifest.json
(url, sha256, fetchedAt, taille).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "data" / "seed" / "sources.json"
RAW = ROOT / "data" / "raw"
META = ROOT / "data" / "meta.json"
MANIFEST = RAW / "manifest.json"
TICKETS_GUARD = RAW / "tickets.guard.json"  # raisons d'un relevé rejeté (non versionné)
MAX_DROP = 0.10

MIN_INTERVAL_S = 1.0
TIMEOUT = httpx.Timeout(30.0, connect=10.0)
MAX_ATTEMPTS = 2  # un seul nouvel essai, après une pause
RETRY_PAUSE_S = 10.0
EXIT_CHANGED = 10  # distinct de 1 (erreur) pour que la CI ne confonde pas les deux


def load_sources() -> tuple[str, dict[str, dict]]:
    data = json.loads(SEED.read_text(encoding="utf-8"))
    user_agent = data.pop("userAgent")
    return user_agent, {k: v for k, v in data.items() if isinstance(v, dict)}


def select(sources: dict[str, dict], only: list[str] | None) -> dict[str, dict]:
    daily = {k: v for k, v in sources.items() if v.get("refresh") == "ci-daily"}
    if not only:
        return daily
    wanted = {o.lower() for o in only}
    picked = {k: v for k, v in daily.items() if k.lower() in wanted or v["id"].lower() in wanted}
    unknown = wanted - {k.lower() for k in picked} - {v["id"].lower() for v in picked.values()}
    if unknown:
        sys.exit(f"--only : source inconnue ou pas ci-daily : {', '.join(sorted(unknown))}")
    return picked


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def target_path(key: str, url: str) -> Path:
    ext = Path(url.split("?")[0]).suffix or ".bin"
    return RAW / f"{key}{ext}"


def download(client: httpx.Client, url: str, dest: Path) -> None:
    last_exc: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with client.stream("GET", url) as r:
                r.raise_for_status()
                tmp = dest.with_suffix(dest.suffix + ".part")
                with tmp.open("wb") as f:
                    for chunk in r.iter_bytes():
                        f.write(chunk)
            tmp.replace(dest)
            return
        except (httpx.HTTPError, OSError) as exc:
            last_exc = exc
            # 4xx : inutile d'insister (URL morte, accès refusé) → on signale.
            if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code < 500:
                break
            if attempt < MAX_ATTEMPTS:
                print(f"  échec ({exc}), nouvel essai dans {RETRY_PAUSE_S:.0f}s", file=sys.stderr)
                time.sleep(RETRY_PAUSE_S)
    raise RuntimeError(f"téléchargement impossible : {url} ({last_exc})")


class TicketsUnavailable(Exception):
    """La billetterie n'a pas renvoyé un JSON exploitable (on garde le fichier précédent)."""


def fetch_tickets(client: httpx.Client, api: dict) -> bytes:
    """Une seule requête, pas de retry. Renvoie le JSON (indenté, pour des diffs git lisibles)."""
    form = api["form"]
    fields = [(k, (None, str(v))) for k, v in form.items() if not isinstance(v, list)]
    fields += [(k, (None, str(x))) for k, vs in form.items() if isinstance(vs, list) for x in vs]
    try:
        r = client.request(api.get("method", "POST"), api["url"], files=fields)
    except httpx.HTTPError as exc:
        raise TicketsUnavailable(f"réseau : {exc}") from exc
    ctype = r.headers.get("content-type", "")
    if r.status_code != 200:
        raise TicketsUnavailable(f"HTTP {r.status_code} ({ctype or 'sans content-type'})")
    if "json" not in ctype:
        raise TicketsUnavailable(f"réponse non JSON ({ctype or '?'}) : challenge anti-bot probable")
    try:
        data = r.json()
    except ValueError as exc:
        raise TicketsUnavailable("JSON illisible") from exc
    games = data.get("gameInfo") if isinstance(data, dict) else None
    if not isinstance(games, list) or not games or not all(isinstance(g, dict) and g.get("subTitle") for g in games):
        raise TicketsUnavailable("JSON sans liste gameInfo exploitable")
    return (json.dumps(data, ensure_ascii=False, indent=1) + "\n").encode("utf-8")


def _closing(g: dict) -> datetime | None:
    """Clôture de la vente (heure de Dakar = UTC) : la billetterie retire la session après."""
    raw = g.get("closingTime_Senegal") or g.get("playDateTime_Senegal")
    try:
        return datetime.strptime(raw, "%d.%m.%Y, %H:%M").replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _prefix(g: dict) -> str:
    """Discipline = préfixe du code de session (BDM05 → BDM ; SBW regroupe les sports de Saly)."""
    code = (g.get("subTitle") or "").split(" ")[0]
    return code[:3]


def check_tickets(old: list[dict], new: list[dict], now: datetime) -> list[str]:
    """Raisons de rejeter un relevé valide mais suspect ; [] si tout va bien.

    On compare au relevé précédent restreint aux sessions qui devraient ENCORE être en vente
    (clôture pas encore passée) : la disparition normale des sessions passées et des
    disciplines terminées ne déclenche donc rien.
    """
    expected = [g for g in old if (_closing(g) or now) > now]
    if not expected:
        return []
    reasons = []
    drop = (len(expected) - len(new)) / len(expected)
    if drop > MAX_DROP:
        reasons.append(
            f"sessions en baisse de {round(drop * 100)} % : {len(new)} reçues, {len(expected)} attendues "
            f"(sessions encore en vente dans le dernier relevé valide), seuil {round(MAX_DROP * 100)} %")
    gone = sorted({_prefix(g) for g in expected} - {_prefix(g) for g in new})
    if gone:
        reasons.append(f"discipline(s) sans aucune session alors qu'encore en vente hier : {', '.join(gone)}")
    return reasons


def previous_hashes() -> dict[str, str]:
    if not META.exists():
        return {}
    meta = json.loads(META.read_text(encoding="utf-8"))
    return {s["id"]: s["sha256"] for s in meta.get("sources", [])}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="+", help="ids (S1) ou clés (programmePdf) à télécharger")
    ap.add_argument("--unchanged", action="store_true",
                    help="exit 0 si aucun hash n'a changé depuis data/meta.json, exit 10 sinon")
    args = ap.parse_args()

    user_agent, sources = load_sources()
    if "A_REMPLIR" in user_agent:
        print("⚠️  userAgent sans contact (A_REMPLIR dans data/seed/sources.json) — à compléter.",
              file=sys.stderr)
    todo = select(sources, args.only)
    RAW.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    before = previous_hashes()
    changed: list[str] = []
    TICKETS_GUARD.unlink(missing_ok=True)  # l'état du garde-fou ne vaut que pour ce relevé

    headers = {"User-Agent": user_agent}
    last_request = 0.0
    try:
        client = httpx.Client(headers=headers, timeout=TIMEOUT, follow_redirects=True)
    except Exception as exc:  # pragma: no cover
        print(f"❌ {exc}", file=sys.stderr)
        return 1
    with client:
        for key, src in todo.items():
            wait = MIN_INTERVAL_S - (time.monotonic() - last_request)
            if wait > 0:
                time.sleep(wait)
            api = src.get("api")
            url = api["url"] if api else src["fileUrl"]
            dest = RAW / api["saveAs"] if api else target_path(key, url)
            print(f"[{src['id']}] {url}")
            last_request = time.monotonic()
            if api:
                try:
                    body = fetch_tickets(client, api)
                except TicketsUnavailable as exc:
                    kept = "on garde le dernier fichier" if dest.exists() else "aucun fichier précédent"
                    print(f"  ⚠️  billetterie indisponible ({exc}) : {kept}.", file=sys.stderr)
                    continue
                if dest.exists():
                    old = json.loads(dest.read_text(encoding="utf-8")).get("gameInfo", [])
                    new = json.loads(body).get("gameInfo", [])
                    reasons = check_tickets(old, new, datetime.now(timezone.utc))
                    if reasons:
                        TICKETS_GUARD.write_text(json.dumps({
                            "checkedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                            "received": len(new), "previous": len(old), "reasons": reasons,
                        }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
                        for r in reasons:
                            print(f"  ⛔ garde-fou billetterie : {r}", file=sys.stderr)
                        print("  → relevé rejeté, on garde le dernier tickets.json valide.", file=sys.stderr)
                        continue
                tmp = dest.with_suffix(dest.suffix + ".part")
                tmp.write_bytes(body)
                tmp.replace(dest)
            else:
                try:
                    download(client, url, dest)
                except RuntimeError as exc:
                    print(f"❌ {exc}", file=sys.stderr)
                    return 1
            digest = sha256(dest)
            manifest[src["id"]] = {
                "key": key,
                "url": url,
                "path": str(dest.relative_to(ROOT)),
                "sha256": digest,
                "bytes": dest.stat().st_size,
                "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            status = "inchangé" if before.get(src["id"]) == digest else "NOUVEAU/modifié"
            if status != "inchangé":
                changed.append(src["id"])
            print(f"  → {dest.relative_to(ROOT)}  {dest.stat().st_size} o  sha256={digest[:12]}…  {status}")

    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.unchanged:
        if changed:
            print(f"Sources modifiées : {', '.join(changed)}")
            return EXIT_CHANGED
        print("Aucune source modifiée.")
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
