"""Télécharge les sources marquées `ci-daily` dans data/seed/sources.json vers data/raw/.

Règles (CLAUDE.md §4, SCRAPING.md) :
- User-Agent honnête lu dans sources.json ;
- 1 requête par seconde maximum, timeouts, pas de retry agressif ;
- jamais la billetterie (refresh "manual-only").

Usage :
    python scripts/fetch_sources.py                 # toutes les sources ci-daily
    python scripts/fetch_sources.py --only S1       # une source (id ou clé)
    python scripts/fetch_sources.py --unchanged     # exit 0 si aucun hash n'a changé
                                                    # depuis data/meta.json, exit 10 sinon
                                                    # (exit 1 = erreur de téléchargement)

Sortie : data/raw/<clé>.pdf + data/raw/manifest.json (url, sha256, fetchedAt, taille).
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
            url = src["fileUrl"]
            dest = target_path(key, url)
            print(f"[{src['id']}] {url}")
            last_request = time.monotonic()
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
