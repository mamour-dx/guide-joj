#!/usr/bin/env bash
# Rafraîchissement des données (SCRAPING.md §7). Lancé chaque jour par la GitHub Action,
# et lançable à la main à l'identique : `bash scripts/refresh.sh` (FORCE=1 pour reconstruire
# même si les sources n'ont pas changé, ex. après avoir re-sauvegardé data/raw/tickets.json).
#
# 1. Re-télécharge S1 (programme) et S3 (guide mobilité), compare les hash à data/meta.json.
# 2. Rien n'a changé (et pas FORCE) → stop, rien n'est publié.
# 3. Sinon : parse → build → validate → tests. Une seule erreur → exit ≠ 0 → rien n'est publié.
#
# La billetterie n'est JAMAIS appelée ici : data/raw/tickets.json est sauvegardé à la main.
set -uo pipefail
cd "$(dirname "$0")/.."

PY="${PYTHON:-python}"
out() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1" >> "$GITHUB_OUTPUT"; return 0; }

"$PY" scripts/fetch_sources.py --unchanged
rc=$?
if [ "$rc" -eq 0 ] && [ "${FORCE:-0}" != "1" ]; then
  echo "→ Sources inchangées : rien à publier."
  out "changed=false"
  exit 0
elif [ "$rc" -ne 0 ] && [ "$rc" -ne 10 ]; then
  echo "❌ Téléchargement en échec (exit $rc) : rien n'est publié." >&2
  exit "$rc"
fi

set -e
"$PY" scripts/parse_programme.py
"$PY" scripts/parse_tickets.py
"$PY" scripts/build_data.py
# graine du tirage = date du jour : le rapport est reproductible sur une même journée
"$PY" scripts/validate.py --seed "$(date -u +%Y%m%d)"
"$PY" -m pytest -q tests
out "changed=true"
echo "✅ Données régénérées et validées."
