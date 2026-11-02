"""Traduction FR des épreuves, par règles (DATA_MODEL.md § Traduction des épreuves).

Principe : on remplace des expressions connues (dictionnaire), puis on vérifie qu'il ne
reste **aucun mot anglais non traduit**. Sinon on renvoie l'anglais tel quel (mieux que
faux). Les codes pays CIO restent tels quels, avec un drapeau emoji si le code est connu.

Usage : python scripts/translate_events.py   → couverture sur data/raw/programme.sessions.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Code CIO → code ISO 3166-1 alpha-2 (pour le drapeau). TPE volontairement absent
# (le Taipei chinois concourt sous drapeau olympique : pas d'emoji).
IOC_TO_ISO = {
    "AFG": "AF", "ARG": "AR", "BRA": "BR", "CHN": "CN", "CMR": "CM", "COK": "CK",
    "CRC": "CR", "CRO": "HR", "CUB": "CU", "ESP": "ES", "FIJ": "FJ", "FRA": "FR",
    "GER": "DE", "HUN": "HU", "IRN": "IR", "ITA": "IT", "KEN": "KE", "MAR": "MA",
    "MEX": "MX", "PAN": "PA", "PAR": "PY", "POR": "PT", "PUR": "PR", "SEN": "SN",
    "SOL": "SB", "SYR": "SY", "THA": "TH", "TUN": "TN", "TUR": "TR", "UKR": "UA",
    "URU": "UY", "VEN": "VE",
}


def flag(ioc: str) -> str:
    iso = IOC_TO_ISO.get(ioc)
    return "".join(chr(0x1F1E6 + ord(c) - ord("A")) for c in iso) if iso else ""


# ------------------------------------------------------------------ dictionnaires

PHASES = {
    "semi & final": "demi-finale et finale",
    "semi-final": "demi-finale",
    "final": "finale",
    "finals": "finales",
    "heats": "séries",
    "fastest heats": "séries rapides",
    "fastest heat": "série rapide",
    "slowest heats": "séries lentes",
    "semifinals": "demi-finales",
    "quarterfinals": "quarts de finale",
    "quaterfinals": "quarts de finale",  # coquille de la source
    "quarter and semifinals": "quarts et demi-finales",
    "preliminary rounds": "tours préliminaires",
    "preliminary round": "tour préliminaire",
    "preliminary stage": "phase préliminaire",
    "preliminaries": "préliminaires",
    "prelims": "préliminaires",
    "pool round": "phase de poules",
    "group stage": "phase de groupes",
    "group stage rounds": "phase de groupes",
    "group stage & final rounds": "phase de groupes et finales",
    "final block": "bloc final",
    "round of 16": "huitièmes de finale",
    "round of 32": "seizièmes de finale",
    "elimination round of 16": "huitièmes de finale",
    "1/16 elimination round": "seizièmes de finale",
    "1/8 elimination round": "huitièmes de finale",
    "last 16": "huitièmes de finale",
    "last 8": "quarts de finale",
    "time trial": "contre-la-montre",
    "lucky loser round": "repêchages",
    "placing": "places",
    "placement matches": "matchs de classement",
    "ranking round": "tour de classement",
    "table of": "tableau de",
    "bronze and gold medal matches": "matchs pour le bronze et l'or",
    "bronze and gold medal battles": "battles pour le bronze et l'or",
    "bronze and gold games": "matchs pour le bronze et l'or",
    "bronze and gold matches": "matchs pour le bronze et l'or",
    "bronze and gold": "bronze et or",
    "bronze medal game": "match pour le bronze",
    "gold medal game": "match pour l'or",
    "bronze final": "match pour le bronze",
    "preselection and round robin": "présélection et poules",
    "qualification": "qualifications",
    "qualifier round": "manche qualificative",
    "podium training": "entraînement sur le podium",
    "5th place": "match pour la 5e place",
    "7th place": "match pour la 7e place",
    "winner": "1er",
    "runner-up": "2e",
    "vs": "–",
    "and": "et",
}

EVENTS = {
    "backstroke": "dos",
    "breaststroke": "brasse",
    "butterfly": "papillon",
    "freestyle": "nage libre",
    "individual medley": "4 nages",
    "hurdles": "haies",
    "hurdle": "haies",
    "steeplechase": "steeple",
    "race walk": "marche",
    "hammer throw": "lancer du marteau",
    "discus throw": "lancer du disque",
    "javelin throw": "lancer du javelot",
    "shot put": "lancer du poids",
    "high jump": "saut en hauteur",
    "long jump": "saut en longueur",
    "triple jump": "triple saut",
    "pole vault": "saut à la perche",
    "road race": "course sur route",
    "individual time trial": "contre-la-montre individuel",
    "foil individual": "fleuret individuel",
    "épée individual": "épée individuelle",
    "sabre individual": "sabre individuel",
    "jumping individual": "saut d'obstacles individuel",
    "individual": "individuel",
    "single": "simple",
    "singles": "simple",
    "solo": "solo",
    "team": "concours par équipes",
    "all-around": "concours général",
    "all around": "concours général",
    "street": "street",
    "changquan": "changquan",
    "gunshu": "gunshu",
    "taijiquan": "taijiquan",
    "taijishan": "taijishan",
    "mixed doubles": "double mixte",
    "mixed double sculls": "deux de couple mixte",
    "mixed team": "équipe mixte",
}

UNITS = {"m": "m", "kg": "kg"}

GENDER = [
    (r"Women's and Men's", "femmes et hommes"),
    (r"Women and Men", "femmes et hommes"),
    (r"Mixed Team", "équipe mixte"),
    (r"Women's", "femmes"),
    (r"Men's", "hommes"),
    (r"Women", "femmes"),
    (r"Men", "hommes"),
    (r"B-Girls", "B-Girls"),
    (r"B-Boys", "B-Boys"),
]
GENDER_RE = re.compile(r"^(" + "|".join(g for g, _ in GENDER) + r")(?=\s|$)")
GENDER_FR = {g: fr for g, fr in GENDER}

MATCH_ONE = re.compile(r"^(?:(?P<g>W|M|Women's|Men's)\s+)?(?P<a>[A-Z]{3})\s+vs\s+(?P<b>[A-Z]{3})$")
G_SHORT = {"W": "Femmes", "Women's": "Femmes", "M": "Hommes", "Men's": "Hommes"}
SAIL_RACES = re.compile(r"^R(\d+), R(\d+) and R(\d+)$")


def _phrase_table(*tables: dict[str, str]) -> list[tuple[re.Pattern, str]]:
    merged: dict[str, str] = {}
    for t in tables:
        merged.update(t)
    out = []
    for en in sorted(merged, key=len, reverse=True):
        out.append((re.compile(r"(?<![\w'])" + re.escape(en) + r"(?![\w'])", re.I), merged[en]))
    return out


ALL = _phrase_table(PHASES, EVENTS, UNITS)
PHASE_ONLY = _phrase_table(PHASES)
LEFTOVER_OK = re.compile(r"[\s\d,&()+\-/.–A-H]*")  # chiffres, ponctuation, poules/lettres A-H


def _fragment(text: str, table=ALL) -> str | None:
    """Traduit un fragment ; None s'il reste un mot non traduit."""
    s = re.sub(r"(\d+)(m|kg)\b", r"\1 \2", text)  # 100m → 100 m, 55kg → 55 kg
    found: list[str] = []

    def keep(fr: str):
        def _r(_m):
            found.append(fr)
            return f"\x00{len(found) - 1}\x00"
        return _r

    for pat, fr in table:
        s = pat.sub(keep(fr), s)
    leftover = re.sub(r"\x00\d+\x00", "", s)
    if not LEFTOVER_OK.fullmatch(leftover):
        return None
    return re.sub(r"\x00(\d+)\x00", lambda m: found[int(m[1])], s).strip()


def _is_phase(text: str) -> bool:
    return _fragment(text, PHASE_ONLY) is not None


def _cap(s: str) -> str:
    return s[:1].upper() + s[1:] if s else s


def _matchups(text: str) -> str | None:
    parts = [p.strip() for p in text.split(";")]
    out = []
    for p in parts:
        m = MATCH_ONE.match(p)
        if not m:
            return None
        a, b = m["a"], m["b"]
        fa, fb = flag(a), flag(b)
        duel = f"{(fa + ' ') if fa else ''}{a} – {b}{(' ' + fb) if fb else ''}"
        out.append(f"{G_SHORT[m['g']]} : {duel}" if m["g"] else duel)
    return " ; ".join(out)


def translate(raw: str) -> str:
    """Épreuve anglaise → français. Renvoie `raw` si la traduction n'est pas propre."""
    text = raw.strip()
    if (m := _matchups(text)) is not None:
        return m
    gender = None
    g = GENDER_RE.match(text)
    if g:
        gender = GENDER_FR[g[1]]
        text = text[g.end():].strip()
        # « Men - Pool Round » : séparateur ; « Men -48kg » : signe moins, gardé
        text = re.sub(r"^-\s+", "", text)
    if gender and (sm := SAIL_RACES.match(text)):
        return f"{_cap(gender)} — manches {sm[1]}, {sm[2]} et {sm[3]}"
    parts = [p for p in re.split(r"\s+-\s+", text) if p]
    head, phases = (parts[0], parts[1:]) if parts else ("", [])
    if head and _is_phase(head) and not phases:
        head, phases = "", [head]
    fr_head = _fragment(head) if head else ""
    fr_phases = [_fragment(p) for p in phases]
    if fr_head is None or any(p is None for p in fr_phases):
        return raw
    if fr_head and gender:
        label = f"{fr_head} {gender}"
    else:
        label = fr_head or gender or ""
    out = " — ".join([_cap(label)] + fr_phases) if label else _cap(" — ".join(fr_phases))
    return out or raw


def main() -> int:
    src = ROOT / "data" / "raw" / "programme.sessions.json"
    sessions = json.loads(src.read_text(encoding="utf-8"))["sessions"]
    distinct = sorted({e for s in sessions for e in s["eventsRaw"]})
    untranslated = [e for e in distinct if translate(e) == e]
    for e in distinct:
        print(f"{'  ' if translate(e) != e else '❌'} {e}  →  {translate(e)}")
    print(f"\n{len(distinct) - len(untranslated)}/{len(distinct)} épreuves traduites ; "
          f"{len(untranslated)} gardées en anglais.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
