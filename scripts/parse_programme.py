"""PDF programme (S1) → data/raw/programme.sessions.json.

Méthode (SCRAPING.md §3, ajustée à la mise en page réelle du PDF) :

1. `pdfplumber.extract_words()` puis regroupement des mots en lignes par `top` (±2 pt).
2. Bornes de colonnes apprises sur la page : les colonnes sont alignées à gauche
   (heure, secteur, site, code, discipline, épreuve). L'en-tête `Date & Time | Cluster …`
   sert à repérer le début du tableau ; ses mots sont centrés, donc on ne s'en sert pas
   comme bornes. Si une page ne permet pas d'apprendre les bornes, on réutilise celles
   de la page précédente.
3. Machine à états sur les lignes :
   - `Day <n> <d> <Month> 2026.` → nouveau jour (le reste de la ligne est retraité) ;
   - ligne avec `HH:MM - HH:MM` → ligne principale d'une session ;
   - ligne avec seulement la colonne Épreuve → ligne d'épreuve.
4. **Les épreuves sont centrées verticalement sur la ligne principale** : une session à
   k lignes d'épreuves en a autant au-dessus qu'en dessous de son horaire (la ligne
   principale peut elle-même porter une épreuve). Les lignes d'épreuves situées entre
   deux lignes principales se répartissent donc ainsi : les N premières vont à la session
   du dessus (N = nombre de lignes qu'elle a au-dessus d'elle), le reste à la session du
   dessous. Contrôle géométrique : la moyenne des `top` du bloc ≈ `top` de l'horaire.
5. Lignes coupées (`Table of` / `8`, `(Bronze and Gold` / `Medal Battles)`) recollées
   dans `events`, mais `rows` garde chaque ligne source telle quelle.

Fallback (bornes introuvables) : `extract_text()` + regex MAIN de SCRAPING.md, même règle
de symétrie appliquée aux lignes de texte.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PDF = ROOT / "data" / "raw" / "programmePdf.pdf"
DEFAULT_OUT = ROOT / "data" / "raw" / "programme.sessions.json"
SOURCES = ROOT / "data" / "seed" / "sources.json"

ROW_TOL = 2.0
CENTER_TOL = 2.5

TIME_RANGE = re.compile(r"^(?P<start>\d{2}:\d{2})\s*-\s*(?P<end>\d{2}:\d{2})$")
TIME_TOKEN = re.compile(r"^\d{2}:\d{2}$")
CODE = re.compile(r"^(?:BS5|RU7|BK3|[A-Z]{3})\d{2,3}$")
DAY_HEADER = re.compile(
    r"Day\s*(?P<neg>-)?\s*(?P<n>\d{1,2})\s+(?P<d>\d{1,2})\s+(?P<month>[A-Z][a-z]+)\s+(?P<y>\d{4})\.?"
)
MONTHS = {m: i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August",
     "September", "October", "November", "December"], start=1)}
PAGE_TITLE = re.compile(r"Competition\s+SCheDule", re.I)
TABLE_HEADER = re.compile(r"^Date\s*&\s*Time\s+Cluster\s+Venue\s+Session\s+Discipline\s+Event$")
CLUSTERS = ("Dakar", "Diamniadio", "Saly")

MAIN_FALLBACK = re.compile(
    r"^(?P<start>\d{2}:\d{2})\s*-\s*(?P<end>\d{2}:\d{2})\s+"
    r"(?P<cluster>Dakar|Diamniadio|Saly)\s+(?P<rest>.+?)\s+"
    r"(?P<code>(?:BS5|RU7|BK3|[A-Z]{3})\d{2,3})\s+(?P<tail>.*)$"
)

COLUMNS = ("time", "cluster", "venue", "code", "discipline", "event")


# ---------------------------------------------------------------- structures

@dataclass
class Row:
    page: int
    top: float
    words: list[dict]

    @property
    def text(self) -> str:
        return " ".join(w["text"] for w in self.words)


@dataclass
class Session:
    code: str
    day: int
    date: str
    start: str
    end: str
    cluster: str
    venue: str
    discipline: str
    page: int
    top: float
    inline_event: str | None = None
    above: list[tuple[float, str]] = field(default_factory=list)
    below: list[tuple[float, str]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def rows(self) -> list[tuple[float, str]]:
        rows = list(self.above)
        if self.inline_event:
            rows.append((self.top, self.inline_event))
        rows.extend(self.below)
        return rows


# ---------------------------------------------------------------- utilitaires

def group_rows(words: list[dict], page: int) -> list[Row]:
    rows: list[Row] = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if rows and abs(rows[-1].top - w["top"]) <= ROW_TOL:
            rows[-1].words.append(w)
        else:
            rows.append(Row(page=page, top=w["top"], words=[w]))
    for r in rows:
        r.words.sort(key=lambda w: w["x0"])
    return rows


def parse_day_header(text: str) -> tuple[int, str, re.Match] | None:
    m = DAY_HEADER.search(text)
    if not m:
        return None
    n = int(m["n"]) * (-1 if m["neg"] else 1)
    d = date(int(m["y"]), MONTHS[m["month"]], int(m["d"]))
    return n, d.isoformat(), m


def iso(day_date: str, hhmm: str, plus_days: int = 0) -> str:
    d = datetime.fromisoformat(f"{day_date}T{hhmm}:00") + timedelta(days=plus_days)
    return d.strftime("%Y-%m-%dT%H:%M:%S+00:00")


def learn_bounds(rows: list[Row]) -> dict[str, float] | None:
    """Apprend le x de départ de chaque colonne (alignement à gauche) sur la page."""
    starts: dict[str, Counter] = {c: Counter() for c in COLUMNS}
    for r in rows:
        ws = r.words
        codes = [i for i, w in enumerate(ws) if CODE.match(w["text"])]
        times = [i for i, w in enumerate(ws) if TIME_TOKEN.match(w["text"])]
        if len(times) >= 2 and codes:
            ci = codes[0]
            starts["time"][round(ws[times[0]]["x0"])] += 1
            starts["code"][round(ws[ci]["x0"])] += 1
            after_time = times[1] + 1
            if after_time < ci:
                starts["cluster"][round(ws[after_time]["x0"])] += 1
                # le site commence après le premier « grand » blanc dans la zone secteur/site
                for j in range(after_time + 1, ci):
                    if ws[j]["x0"] - ws[j - 1]["x1"] > 12:
                        starts["venue"][round(ws[j]["x0"])] += 1
                        break
            if ci + 1 < len(ws):
                starts["discipline"][round(ws[ci + 1]["x0"])] += 1
    if not all(starts[c] for c in ("time", "cluster", "venue", "code", "discipline")):
        return None
    bounds = {c: starts[c].most_common(1)[0][0] for c in COLUMNS if starts[c]}
    # colonne Épreuve : x de départ le plus fréquent des lignes sans horaire ni code, à
    # droite de la discipline
    ev = Counter()
    for r in rows:
        if any(TIME_TOKEN.match(w["text"]) or CODE.match(w["text"]) for w in r.words):
            continue
        x = round(r.words[0]["x0"])
        if x > bounds["discipline"] + 40:
            ev[x] += 1
    if not ev:
        return None
    bounds["event"] = ev.most_common(1)[0][0]
    return bounds


def split_columns(row: Row, bounds: dict[str, float]) -> dict[str, str]:
    edges = [(c, bounds[c] - 3) for c in COLUMNS]
    out: dict[str, list[str]] = {c: [] for c in COLUMNS}
    for w in row.words:
        col = "time"
        for c, x in edges:
            if w["x0"] >= x:
                col = c
        out[col].append(w["text"])
    return {c: " ".join(v) for c, v in out.items()}


# ---------------------------------------------------------------- recollage des épreuves

CONNECTOR_END = re.compile(r"\b(of|and|&|-|,|vs)$", re.I)


def is_continuation(prev: str, cur: str) -> bool:
    if prev.count("(") > prev.count(")"):
        return True
    if CONNECTOR_END.search(prev.strip()):
        return True
    c = cur.strip()
    return bool(c) and (c[0].islower() or c[0] == "(" or re.fullmatch(r"\d+\)?", c) is not None)


def merge_events(rows: list[str]) -> list[str]:
    events: list[str] = []
    for t in rows:
        if events and is_continuation(events[-1], t):
            events[-1] = f"{events[-1]} {t}"
        else:
            events.append(t)
    return events


# ---------------------------------------------------------------- répartition des épreuves

def assign_gap(prev: Session | None, nxt: Session | None, gap: list[tuple[float, str]],
               problems: list[str]) -> None:
    """Répartit les lignes d'épreuves entre la session du dessus et celle du dessous."""
    if prev is None:
        if nxt is not None:
            nxt.above.extend(gap)
        elif gap:
            problems.append(f"lignes d'épreuves orphelines : {[t for _, t in gap]}")
        return
    need = len(prev.above)
    if nxt is None:
        prev.below.extend(gap)
        if len(gap) != need:
            prev.warnings.append(
                f"bloc asymétrique : {need} ligne(s) au-dessus, {len(gap)} en dessous")
        return
    if len(gap) < need:
        prev.warnings.append(
            f"bloc asymétrique : {need} ligne(s) au-dessus, {len(gap)} en dessous")
        prev.below.extend(gap)
        return
    prev.below.extend(gap[:need])
    nxt.above.extend(gap[need:])


def check_centering(s: Session) -> None:
    rows = s.rows()
    if not rows:
        s.warnings.append("aucune épreuve")
        return
    if s.above and s.below and s.above[0][0] < s.top < s.below[-1][0]:
        center = (s.above[0][0] + s.below[-1][0]) / 2
        if abs(center - s.top) > CENTER_TOL:
            s.warnings.append(f"centrage douteux (centre {center:.1f} vs horaire {s.top:.1f})")


# ---------------------------------------------------------------- parse principal

def parse_rows(rows: list[Row], bounds_by_page: dict[int, dict[str, float]],
               problems: list[str]) -> list[Session]:
    sessions: list[Session] = []
    day: tuple[int, str] | None = None
    prev: Session | None = None
    gap: list[tuple[float, str]] = []
    page_seen: int | None = None

    def flush(nxt: Session | None) -> None:
        nonlocal gap
        assign_gap(prev, nxt, gap, problems)
        gap = []

    for row in rows:
        if row.page != page_seen:
            # changement de page : les blocs ne chevauchent pas les pages
            flush(None)
            prev = None
            page_seen = row.page
        text = row.text
        if PAGE_TITLE.search(text) or TABLE_HEADER.match(text):
            continue
        dh = parse_day_header(text)
        if dh:
            flush(None)
            prev = None
            day = (dh[0], dh[1])
            # en-tête collé à une ligne de session : on retire les mots de l'en-tête
            rest = row.words[_count_words(row.words, dh[2].group(0)):]
            if not rest:
                continue
            row = Row(page=row.page, top=row.top, words=rest)
            text = row.text
        cols = split_columns(row, bounds_by_page[row.page])
        tm = TIME_RANGE.match(cols["time"])
        if tm:
            if day is None:
                problems.append(f"session avant tout en-tête de jour : {text}")
                continue
            code = cols["code"]
            if not CODE.match(code):
                problems.append(f"p{row.page} code de session illisible : {text!r}")
                continue
            s = Session(
                code=code, day=day[0], date=day[1], start=tm["start"], end=tm["end"],
                cluster=cols["cluster"], venue=cols["venue"], discipline=cols["discipline"],
                page=row.page, top=row.top, inline_event=cols["event"] or None,
            )
            flush(s)
            sessions.append(s)
            prev = s
            continue
        non_event = [c for c in COLUMNS if c != "event" and cols[c]]
        if non_event:
            problems.append(f"p{row.page} ligne non reconnue : {text!r}")
            continue
        gap.append((row.top, cols["event"]))
    flush(None)
    return sessions


def _count_words(words: list[dict], header: str) -> int:
    """Nombre de mots pdfplumber qui composent l'en-tête de jour (début de ligne)."""
    target = re.sub(r"\s+", "", header)
    acc = ""
    for i, w in enumerate(words, start=1):
        acc += w["text"]
        if len(acc) >= len(target):
            return i
    return len(words)


def parse_fallback(pdf: pdfplumber.PDF, problems: list[str]) -> list[Session]:
    """Fallback texte : regex MAIN + même règle de symétrie, ligne par ligne."""
    sessions: list[Session] = []
    for pno, page in enumerate(pdf.pages, start=1):
        day = None
        prev: Session | None = None
        gap: list[tuple[float, str]] = []
        for i, line in enumerate((page.extract_text() or "").splitlines()):
            if PAGE_TITLE.search(line) or TABLE_HEADER.match(line):
                continue
            dh = parse_day_header(line)
            if dh:
                assign_gap(prev, None, gap, problems)
                prev, gap = None, []
                day = (dh[0], dh[1])
                line = line[dh[2].end():].strip()
                if not line:
                    continue
            m = MAIN_FALLBACK.match(line)
            if m and day:
                rest, tail = m["rest"], m["tail"]
                s = Session(code=m["code"], day=day[0], date=day[1], start=m["start"],
                            end=m["end"], cluster=m["cluster"], venue=rest,
                            discipline=tail, page=pno, top=float(i))
                s.warnings.append("fallback texte : discipline et 1ʳᵉ épreuve non séparées")
                assign_gap(prev, s, gap, problems)
                gap = []
                sessions.append(s)
                prev = s
            else:
                gap.append((float(i), line))
        assign_gap(prev, None, gap, problems)
    return sessions


# ---------------------------------------------------------------- anomalies de la source

TYPOS = {
    r"\bquaterfinals\b": "coquille « quaterfinals »",
    r"^M's\b": "abréviation « M's » au lieu de « Men's »",
}


def source_anomalies(s: Session, events: list[str]) -> list[str]:
    out: list[str] = []
    dupes = [e for e, n in Counter(events).items() if n > 1]
    for e in dupes:
        out.append(f"épreuve en double : {e!r}")
    for e in events:
        if e.count("(") != e.count(")"):
            out.append(f"parenthèse non fermée : {e!r}")
        for pat, label in TYPOS.items():
            if re.search(pat, e, re.I if "quater" in pat else 0):
                out.append(f"{label} : {e!r}")
    if s.code.startswith(("BK3", "HBB")) and any("singles" in e for e in events):
        out.append("libellé générique « Women's and Men's singles » pour un sport collectif")
    if s.code.startswith("GAR") and any("Street" in e for e in events):
        out.append("épreuve de skateboard (« Street ») sous Gymnastique artistique")
    if s.cluster not in CLUSTERS and not s.cluster.startswith(CLUSTERS):
        out.append(f"secteur inattendu : {s.cluster!r}")
    return out


# ---------------------------------------------------------------- point d'entrée

def parse_words(pages_words: list[list[dict]], problems: list[str],
                first_page: int = 1) -> list[Session] | None:
    """Parse par colonnes à partir des mots de chaque page. None si bornes introuvables."""
    all_rows: list[Row] = []
    bounds_by_page: dict[int, dict[str, float]] = {}
    last_bounds = None
    for pno, words in enumerate(pages_words, start=first_page):
        rows = group_rows(words, pno)
        b = learn_bounds(rows) or last_bounds
        if b is None:
            return None
        bounds_by_page[pno] = b
        last_bounds = b
        all_rows.extend(rows)
    return parse_rows(all_rows, bounds_by_page, problems)


def extract_page_words(page) -> list[dict]:
    return page.extract_words(keep_blank_chars=False, use_text_flow=False)


def parse_pdf(pdf_path: Path, source_url: str | None = None) -> dict:
    problems: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        sessions = parse_words([extract_page_words(p) for p in pdf.pages], problems)
        method = "columns"
        if sessions is None:
            method = "fallback-regex"
            problems.append("bornes de colonnes introuvables : fallback texte")
            sessions = parse_fallback(pdf, problems)
    return build_output(sessions, problems, method, source_url, pdf_path)


def build_output(sessions: list[Session], problems: list[str], method: str,
                 source_url: str | None, pdf_path: Path | None) -> dict:
    out_sessions = []
    for s in sessions:
        check_centering(s)
        rows = [t for _, t in s.rows()]
        events = merge_events(rows)
        plus = 1 if s.end < s.start else 0
        out_sessions.append({
            "code": s.code,
            "day": s.day,
            "date": s.date,
            "start": iso(s.date, s.start),
            "end": iso(s.date, s.end, plus),
            "cluster": s.cluster,
            "venue": s.venue,
            "discipline": s.discipline,
            "eventsRaw": events,
            "rows": rows,
            "page": s.page,
            "anomalies": source_anomalies(s, events),
            "warnings": s.warnings,
        })
    return {
        "source": source_url,
        "pdf": (None if pdf_path is None else
                str(pdf_path.relative_to(ROOT)) if pdf_path.is_relative_to(ROOT) else str(pdf_path)),
        "parsedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "method": method,
        "problems": problems,
        "sessions": out_sessions,
    }


def summary(result: dict) -> str:
    lines = [f"Méthode : {result['method']} — {len(result['sessions'])} sessions"]
    per_day = Counter(s["day"] for s in result["sessions"])
    dates = {s["day"]: s["date"] for s in result["sessions"]}
    for d in sorted(per_day):
        lines.append(f"  Jour {d:>2} ({dates[d]}) : {per_day[d]}")
    prefixes = Counter(re.match(r"(BS5|RU7|BK3|[A-Z]{3})", s["code"])[1] for s in result["sessions"])
    lines.append("Préfixes : " + ", ".join(f"{p}×{n}" for p, n in sorted(prefixes.items())))
    for p in result["problems"]:
        lines.append(f"  PROBLÈME {p}")
    for s in result["sessions"]:
        for a in s["anomalies"]:
            lines.append(f"  [source] {s['code']} : {a}")
        for w in s["warnings"]:
            lines.append(f"  [parser] {s['code']} : {w}")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description="PDF programme → data/raw/programme.sessions.json")
    ap.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    src = json.loads(SOURCES.read_text(encoding="utf-8"))["programmePdf"]["fileUrl"]
    result = parse_pdf(args.pdf.resolve(), src)
    args.out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(summary(result))
    print(f"→ {args.out.relative_to(ROOT) if args.out.resolve().is_relative_to(ROOT) else args.out}")
    return 1 if result["problems"] else 0


if __name__ == "__main__":
    sys.exit(main())
