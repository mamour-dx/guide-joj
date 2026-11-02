"""Billetterie (S2) → data/raw/tickets.parsed.json. AUCUNE requête réseau.

Lit, dans cet ordre :
- plan A : data/raw/tickets.json (réponse d'API sauvegardée à la main depuis DevTools) ;
- plan B : data/raw/tickets.html (page programme enregistrée à la main) ;
- plan C : rien → liste vide, l'UI affiche le code session et un lien vers la billetterie.

Plan A, format réel observé le 2026-11-02 (réponse de la requête `ticketing`) :
`{"gameInfo": [{subTitle: "BDM05 - Badminton", placeNameFra, playDateTime_Senegal,
homeTeamName, scheduleNoticeFra, productId, scheduleId, seat_*_ticketStatus…}]}`.
- `playDateTime_Senegal` = heure de Dakar ; `playDate`/`playTime` = heure de Corée (+9 h),
  ignorés. Pas d'heure de fin.
- Aucun champ URL : le lien d'achat n'est construit que si `tickets.purchaseUrlTemplate`
  est renseigné dans sources.json (gabarit observé à la main, ex. `…{scheduleId}`).
- Statut : codes opaques (`seat_tkl_ticketStatus` 02/03…). Traduits seulement via
  `tickets.statusMap` de sources.json, rempli après vérification visuelle ; sinon
  `unknown`.
- Billets multi-sports (SBWxx) : `homeTeamName` liste les sports couverts → `sports`.
Autre forme JSON / HTML : extraction heuristique (`KEYS`, `card_for`).

Sortie : {"plan", "file", "sha256", "items": [{code, title, venue, date, start, end,
status, url, …}]} ; champ inconnu = null.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
SOURCES = ROOT / "data" / "seed" / "sources.json"
JSON_IN = RAW / "tickets.json"
HTML_IN = RAW / "tickets.html"
OUT = RAW / "tickets.parsed.json"
BASE_URL = "https://tickets.dakar2026.org"

CODE = re.compile(r"\b((?:BS5|RU7|BK3|[A-Z]{3})\d{2,3})\b")
CODE_FULL = re.compile(r"^(?:BS5|RU7|BK3|[A-Z]{3})\d{2,3}$")

KEYS = {
    "code": ("code", "sessionCode", "session_code", "reference", "ref", "sessionId"),
    "title": ("title", "name", "label", "displayName"),
    "venue": ("venue", "venueName", "venue_name", "location", "site", "place"),
    "start": ("start", "startDate", "startsAt", "start_date", "startTime", "dateTime", "date"),
    "end": ("end", "endDate", "endsAt", "end_date", "endTime"),
    "status": ("status", "availability", "stockStatus", "state"),
    "url": ("url", "link", "href", "ticketUrl", "purchaseUrl", "buyUrl", "slug"),
}

STATUS_WORDS = [
    (re.compile(r"annul|cancel", re.I), "cancelled"),
    (re.compile(r"complet|épuisé|sold\s*out|soldout|unavailable", re.I), "soldout"),
    (re.compile(r"limit", re.I), "limited"),
    (re.compile(r"available|disponible|on\s*sale|en vente|open", re.I), "available"),
]


def norm_status(v: str | None) -> str:
    if not v:
        return "unknown"
    for pat, out in STATUS_WORDS:
        if pat.search(str(v)):
            return out
    return "unknown"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def split_dt(v: str | None) -> tuple[str | None, str | None]:
    """'2026-11-08T14:30:00+00:00' → ('2026-11-08', '14:30'). Pas de conversion devinée."""
    if not v or not isinstance(v, str):
        return None, None
    try:
        dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        m = re.search(r"(\d{4}-\d{2}-\d{2})", v)
        return (m[1] if m else None), None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc)  # Dakar = UTC+0
    return dt.date().isoformat(), dt.strftime("%H:%M")


# ------------------------------------------------------------------ plan A (format réel)

# Libellés de `homeTeamName` (billets groupés SBW) → préfixe de code du PDF
TICKET_SPORTS = {
    "beach volleyball": "VBV",
    "coastal rowing": "RCB",
    "triathlon": "TRI",
    "beach wrestling": "WRB",
    "sailing (windsurfing)": "SAL",
    "beach handball": "HBB",
}


def ticket_config() -> dict:
    return json.loads(SOURCES.read_text(encoding="utf-8")).get("tickets", {})


def parse_game_info(games: list[dict], cfg: dict) -> list[dict]:
    template = cfg.get("purchaseUrlTemplate")
    status_map = cfg.get("statusMap") or {}
    items = []
    for g in games:
        sub = (g.get("subTitle") or "").strip()
        m = CODE.match(sub)
        if not m:
            continue
        code = m[1]
        title = sub[len(code):].lstrip(" -–") or None
        dt = datetime.strptime(g["playDateTime_Senegal"], "%d.%m.%Y, %H:%M")
        raw_status = f"{g.get('seat_tkl_ticketStatus')}/{g.get('seat_percent_ticketStatus')}"
        sports = [TICKET_SPORTS[s.strip().lower()]
                  for s in (g.get("homeTeamName") or "").split("/")
                  if s.strip().lower() in TICKET_SPORTS]
        items.append({
            "code": code,
            "title": title,
            "titleFr": g.get("homeTeamNameFra") or None,
            "venue": g.get("placeNameFra") or g.get("placeName") or None,
            "date": dt.date().isoformat(),
            "start": dt.strftime("%H:%M"),
            "end": None,
            "status": status_map.get(raw_status, "unknown"),
            "statusRaw": raw_status,
            "url": template.format(**g) if template else None,
            "sports": sports,
            "noticeFr": g.get("scheduleNoticeFra") or None,
            "productId": g.get("productId"),
            "scheduleId": g.get("scheduleId"),
        })
    return items


# ------------------------------------------------------------------ plan A (heuristique)

def pick(obj: dict, keys: tuple[str, ...]):
    for k in keys:
        if k in obj and obj[k] not in (None, ""):
            v = obj[k]
            if isinstance(v, dict):
                v = v.get("name") or v.get("title") or v.get("label")
            return v
    return None


def walk_json(node, found: list[dict]) -> None:
    if isinstance(node, dict):
        code = pick(node, KEYS["code"])
        if isinstance(code, str) and CODE_FULL.match(code.strip()):
            found.append(node)
        for v in node.values():
            walk_json(v, found)
    elif isinstance(node, list):
        for v in node:
            walk_json(v, found)


def parse_json(path: Path, cfg: dict | None = None) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and isinstance(data.get("gameInfo"), list):
        return parse_game_info(data["gameInfo"], cfg if cfg is not None else ticket_config())
    nodes: list[dict] = []
    walk_json(data, nodes)
    items = []
    for n in nodes:
        d, s = split_dt(pick(n, KEYS["start"]))
        _, e = split_dt(pick(n, KEYS["end"]))
        url = pick(n, KEYS["url"])
        items.append({
            "code": pick(n, KEYS["code"]).strip(),
            "title": pick(n, KEYS["title"]),
            "venue": pick(n, KEYS["venue"]),
            "date": d, "start": s, "end": e,
            "status": norm_status(pick(n, KEYS["status"])),
            "url": urljoin(BASE_URL, url) if isinstance(url, str) else None,
        })
    return items


# ------------------------------------------------------------------ plan B

class Node:
    def __init__(self, tag: str, attrs: dict, parent: "Node | None"):
        self.tag, self.attrs, self.parent = tag, attrs, parent
        self.children: list[Node | str] = []

    def text(self) -> str:
        return " ".join(
            (c if isinstance(c, str) else c.text()) for c in self.children).strip()

    def links(self) -> list["Node"]:
        out = []
        for c in self.children:
            if isinstance(c, Node):
                if c.tag == "a" and c.attrs.get("href"):
                    out.append(c)
                out.extend(c.links())
        return out


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source",
        "track", "wbr"}


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root", {}, None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, dict(attrs), self.cur)
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_endtag(self, tag):
        n = self.cur
        while n is not None and n.tag != tag:
            n = n.parent
        if n is not None and n.parent is not None:
            self.cur = n.parent

    def handle_data(self, data):
        if data.strip() and self.cur.tag not in ("script", "style"):
            self.cur.children.append(re.sub(r"\s+", " ", data.strip()))


def code_nodes(n: Node, out: list[tuple[Node, str]]) -> None:
    for c in n.children:
        if isinstance(c, str):
            m = CODE.fullmatch(c.strip())
            if m:
                out.append((n, m[1]))
        else:
            code_nodes(c, out)


def card_for(n: Node) -> Node:
    """Remonte jusqu'au plus petit ancêtre qui contient un lien et un seul code."""
    cur = n
    while cur.parent is not None:
        codes = set(CODE.findall(cur.text()))
        if len(codes) > 1:
            break
        if cur.links():
            return cur
        cur = cur.parent
    return n


def parse_html(path: Path) -> list[dict]:
    tb = TreeBuilder()
    tb.feed(path.read_text(encoding="utf-8", errors="replace"))
    found: list[tuple[Node, str]] = []
    code_nodes(tb.root, found)
    items, seen = [], set()
    for node, code in found:
        if code in seen:
            continue
        seen.add(code)
        card = card_for(node)
        text = card.text()
        buy = [a for a in card.links() if re.search(r"achet|billet|ticket|buy", a.text() + a.attrs["href"], re.I)]
        link = (buy or card.links() or [None])[0]
        d = re.search(r"(\d{4}-\d{2}-\d{2})", text)
        times = re.findall(r"\b(\d{1,2})[:h](\d{2})\b", text)
        items.append({
            "code": code,
            "title": None,
            "venue": None,
            "date": d[1] if d else None,
            "start": f"{int(times[0][0]):02d}:{times[0][1]}" if times else None,
            "end": f"{int(times[1][0]):02d}:{times[1][1]}" if len(times) > 1 else None,
            "status": norm_status(text) if link else "unknown",
            "url": urljoin(BASE_URL, link.attrs["href"]) if link else None,
            "cardText": text[:300],
        })
    return items


# ------------------------------------------------------------------ main

def fetched_at(path: Path) -> str:
    """Heure du relevé : celle du manifeste si le fichier est bien celui téléchargé par
    fetch_sources.py (même hash), sinon la date de modification (sauvegarde manuelle)."""
    manifest = RAW / "manifest.json"
    if manifest.exists():
        m = json.loads(manifest.read_text(encoding="utf-8")).get("S2")
        if m and m.get("sha256") == sha256(path):
            return m["fetchedAt"]
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat(timespec="seconds")

def main() -> int:
    if JSON_IN.exists():
        plan, path, items = "A", JSON_IN, parse_json(JSON_IN)
    elif HTML_IN.exists():
        plan, path, items = "B", HTML_IN, parse_html(HTML_IN)
    else:
        plan, path, items = "C", None, []
    out = {
        "plan": plan,
        "file": str(path.relative_to(ROOT)) if path else None,
        "sha256": sha256(path) if path else None,
        "fetchedAt": fetched_at(path) if path else None,
        "items": items,
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if plan == "C":
        print("Plan C : ni data/raw/tickets.json ni data/raw/tickets.html → aucun lien profond.")
    else:
        with_url = sum(1 for i in items if i["url"])
        print(f"Plan {plan} ({path.name}) : {len(items)} sessions trouvées, {with_url} avec URL.")
        if not items:
            print("⚠️  Aucun code de session reconnu : la forme du fichier diffère des heuristiques.")
    print(f"→ {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
