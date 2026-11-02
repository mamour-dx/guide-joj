"""fetch_tickets : une requête honnête, échec silencieux. Aucun appel réseau (MockTransport)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import fetch_sources as fs  # noqa: E402

SOURCES = json.loads((ROOT / "data/seed/sources.json").read_text(encoding="utf-8"))
API = SOURCES["tickets"]["api"]
UA = SOURCES["userAgent"]
# deux entrées réelles de data/raw/tickets.json
GAMES = json.loads((ROOT / "data/raw/tickets.json").read_text(encoding="utf-8"))["gameInfo"][:2]


def client_for(handler) -> tuple[httpx.Client, list[httpx.Request]]:
    seen: list[httpx.Request] = []

    def wrapped(req: httpx.Request) -> httpx.Response:
        seen.append(req)
        return handler(req)

    return httpx.Client(transport=httpx.MockTransport(wrapped), headers={"User-Agent": UA}), seen


def test_success_and_request_is_honest():
    c, seen = client_for(lambda r: httpx.Response(200, json={"gameInfo": GAMES}))
    body = fs.fetch_tickets(c, API)
    assert json.loads(body)["gameInfo"][0]["subTitle"] == GAMES[0]["subTitle"]
    assert len(seen) == 1                                   # une seule requête
    req = seen[0]
    assert req.method == "POST" and str(req.url) == "https://tickets.dakar2026.org/api/ticketing"
    assert req.headers["user-agent"] == UA                  # notre User-Agent, rien d'autre
    assert "cookie" not in req.headers
    assert not {"sec-ch-ua", "referer", "origin"} & set(req.headers)
    sent = req.content.decode()
    assert 'name="startDate"' in sent and "2026-10-30" in sent
    assert sent.count('name="productIds"') == 32


@pytest.mark.parametrize("response,reason", [
    (httpx.Response(200, text="<html>challenge</html>", headers={"content-type": "text/html"}), "non JSON"),
    (httpx.Response(403, text="Forbidden"), "HTTP 403"),
    (httpx.Response(200, text="{oops", headers={"content-type": "application/json"}), "JSON illisible"),
    (httpx.Response(200, json={"gameInfo": []}), "gameInfo"),
    (httpx.Response(200, json={"error": "x"}), "gameInfo"),
])
def test_failures_are_reported_not_raised_further(response, reason):
    c, seen = client_for(lambda r: response)
    with pytest.raises(fs.TicketsUnavailable, match=reason):
        fs.fetch_tickets(c, API)
    assert len(seen) == 1                                   # pas de retry


def test_network_error():
    def boom(_r):
        raise httpx.ConnectError("refusé")
    c, seen = client_for(boom)
    with pytest.raises(fs.TicketsUnavailable, match="réseau"):
        fs.fetch_tickets(c, API)
    assert len(seen) == 1


# ------------------------------------------------------------------ garde-fou

from datetime import datetime, timezone  # noqa: E402

NOW = datetime(2026, 11, 4, 6, 0, tzinfo=timezone.utc)


def game(code: str, closing: str = "13.11.2026, 23:00") -> dict:
    return {"subTitle": f"{code} - x", "closingTime_Senegal": closing, "playDateTime_Senegal": closing}


def test_guard_rejects_drop_over_10_percent():
    old = [game(f"FEN{i:02d}") for i in range(1, 21)]          # 20 sessions encore en vente
    new = old[:17]                                             # 17 reçues : −15 %
    reasons = fs.check_tickets(old, new, NOW)
    assert len(reasons) == 1 and "baisse de 15 %" in reasons[0]
    assert fs.check_tickets(old, old[:19], NOW) == []          # −5 % : sous le seuil, accepté


def test_guard_rejects_vanished_discipline():
    old = [game(f"FEN{i:02d}") for i in range(1, 20)] + [game("BDM09")]
    new = [game(f"FEN{i:02d}") for i in range(1, 20)]          # −5 % seulement, mais plus de BDM
    reasons = fs.check_tickets(old, new, NOW)
    assert reasons == ["discipline(s) sans aucune session alors qu'encore en vente hier : BDM"]


def test_guard_ignores_sessions_whose_sale_has_closed():
    """Pendant les Jeux, les sessions passées et les disciplines terminées sortent de la liste :
    ce n'est pas une anomalie."""
    past = [game(f"SWM{i:02d}", "03.11.2026, 15:00") for i in range(1, 9)]  # vente close avant NOW
    future = [game(f"FEN{i:02d}") for i in range(1, 11)]
    assert fs.check_tickets(past + future, future, NOW) == []


def test_guard_keeps_previous_file_end_to_end(tmp_path, monkeypatch):
    raw = tmp_path / "raw"
    raw.mkdir()
    previous = {"gameInfo": [game(f"FEN{i:02d}") for i in range(1, 21)] + [game("BDM09")]}
    (raw / "tickets.json").write_text(json.dumps(previous), encoding="utf-8")
    for name, value in {"RAW": raw, "MANIFEST": raw / "manifest.json", "META": tmp_path / "meta.json",
                        "TICKETS_GUARD": raw / "tickets.guard.json", "MIN_INTERVAL_S": 0}.items():
        monkeypatch.setattr(fs, name, value)
    shrunk = {"gameInfo": [game(f"FEN{i:02d}") for i in range(1, 11)]}  # −52 %, plus de BDM
    real_client = httpx.Client
    monkeypatch.setattr(fs.httpx, "Client", lambda **kw: real_client(
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json=shrunk)),
        headers=kw.get("headers")))
    monkeypatch.setattr(sys, "argv", ["fetch_sources.py", "--only", "S2"])

    assert fs.main() == 0                                      # pas d'échec technique
    assert json.loads((raw / "tickets.json").read_text()) == previous   # ancien fichier gardé
    guard = json.loads((raw / "tickets.guard.json").read_text())
    assert guard["received"] == 10 and guard["previous"] == 21
    assert any("baisse" in r for r in guard["reasons"]) and any("BDM" in r for r in guard["reasons"])
