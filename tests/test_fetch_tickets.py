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
