"""Tests de la phase 2 : traduction, finales, sites, heuristiques billetterie (plan A/B)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import build_data as bd  # noqa: E402
import parse_tickets as pt  # noqa: E402
from translate_events import translate  # noqa: E402


@pytest.mark.parametrize("raw,fr", [
    ("Women's Road Race - Final", "Course sur route femmes — finale"),
    ("Men -48kg - Semifinals, Final", "-48 kg hommes — demi-finales, finale"),
    ("Women +63kg - Semifinals, Final", "+63 kg femmes — demi-finales, finale"),
    ("Men's 200m Individual Medley - Heats", "200 m 4 nages hommes — séries"),
    ("Women's CRC vs IRN", "Femmes : 🇨🇷 CRC – IRN 🇮🇷"),
    ("TPE vs SEN", "TPE – SEN 🇸🇳"),
    ("Women's and Men's R1, R2 and R3", "Femmes et hommes — manches 1, 2 et 3"),
    ("Mixed Team 1/8 Elimination Round", "Équipe mixte — huitièmes de finale"),
    ("Women's and Men's singles - quaterfinals", "Simple femmes et hommes — quarts de finale"),
    ("Bronze Medal Game", "Match pour le bronze"),
    # non traduisible proprement → anglais gardé
    ("M's 50kg - Final", "M's 50kg - Final"),
    ("Women's Underwater Basket Weaving", "Women's Underwater Basket Weaving"),
])
def test_translate(raw, fr):
    assert translate(raw) == fr


@pytest.mark.parametrize("event,final", [
    ("Women's 100m - semi & final", True),
    ("Women's 800m - semi-final", False),
    ("Men's Semifinals", False),
    ("Men - 55kg - Final Block", True),
    ("Women 45kg - Group Stage & Final Rounds", True),
    ("Gold Medal Game", True),
    ("Women and Men - Quarter and Semifinals", False),
])
def test_has_final(event, final):
    assert bool(bd.FINAL.search(event)) is final


def test_venue_resolution():
    idx = bd.VenueIndex(json.loads((ROOT / "data/seed/venues.json").read_text()))
    assert idx.resolve("Centre des Expositions de Dakar(Pavillon C)") == ("dakar-expo-centre", "Pavillon C")
    assert idx.resolve("COMPLEXE TOUR DE L’ŒUF") == ("tour-de-l-oeuf", None)
    assert idx.resolve("Corniche West") == ("corniche-ouest", None)
    assert idx.resolve("Stade inconnu") == (None, None)
    assert bd.cluster_of("Saly Beach West") == "saly"


def test_fixes_dedupe_and_display_as():
    warnings: list[str] = []
    raw = ["Women's and Men's singles - Pool Round", "Women's and Men's singles - Pool Round"]
    fixes = [{"action": "dedupe"}, {"action": "display-as: 'Femmes et hommes'"}]
    assert bd.apply_fixes("BK301", raw, fixes, warnings) == ["Femmes et hommes — phase de poules"]
    assert raw[1] == "Women's and Men's singles - Pool Round"  # eventsRaw intouché


def test_free_rule_requires_url():
    warnings: list[str] = []
    ov = {"free": [{"match": {"codePrefix": "CRD"}, "isFree": True, "source": "A_VERIFIER"}]}
    assert bd.free_rule(ov, "CRD", warnings) == (None, None)
    assert warnings
    ov["free"][0]["source"] = "https://example.org/guide"
    assert bd.free_rule(ov, "CRD", []) == (True, "https://example.org/guide")


def test_tickets_plan_a(tmp_path):
    f = tmp_path / "tickets.json"
    f.write_text(json.dumps({"data": {"sessions": [
        {"code": "ATH01", "name": "Athlétisme", "venue": {"name": "Complexe Iba Mar Diop"},
         "startDate": "2026-11-08T14:30:00Z", "status": "LIMITED", "url": "/fr/session/ath01"},
        {"code": "SBW03", "title": "Saly Plage Ouest", "startDate": "2026-11-02T09:00:00+00:00",
         "status": "available", "url": "https://tickets.dakar2026.org/fr/session/sbw03"},
        {"id": 3, "name": "pas une session"},
    ]}}))
    items = pt.parse_json(f)
    assert [i["code"] for i in items] == ["ATH01", "SBW03"]
    assert items[0]["url"] == "https://tickets.dakar2026.org/fr/session/ath01"
    assert (items[0]["date"], items[0]["start"], items[0]["status"]) == ("2026-11-08", "14:30", "limited")
    assert items[0]["venue"] == "Complexe Iba Mar Diop"


def test_tickets_plan_b(tmp_path):
    f = tmp_path / "tickets.html"
    f.write_text("""<html><body>
      <div class="card"><h3>Athlétisme</h3><span>ATH01</span><p>08/11 · 14:30 - 17:59</p>
        <p>Places limitées</p><a href="/fr/ticketing/ath01">ACHETER DES BILLETS</a></div>
      <div class="card"><h3>Judo</h3><span>JUD01</span><p>Complet</p>
        <a href="/fr/ticketing/jud01">ACHETER DES BILLETS</a></div>
    </body></html>""", encoding="utf-8")
    items = {i["code"]: i for i in pt.parse_html(f)}
    assert items["ATH01"]["url"] == "https://tickets.dakar2026.org/fr/ticketing/ath01"
    assert items["ATH01"]["status"] == "limited"
    assert (items["ATH01"]["start"], items["ATH01"]["end"]) == ("14:30", "17:59")
    assert items["JUD01"]["status"] == "soldout"


def test_tickets_game_info_real_format():
    """Format réel de la requête `ticketing` (champs recopiés de data/raw/tickets.json)."""
    games = [
        {"subTitle": "BDM05 - Badminton", "placeNameFra": "Dakar Arena",
         "playDateTime_Senegal": "03.11.2026, 09:00", "playDate": "20261103", "playTime": "1800",
         "homeTeamName": "Badminton", "homeTeamNameFra": "Badminton",
         "scheduleNoticeFra": "Phases de Poules Hommes et Femmes", "productId": 19080,
         "scheduleId": 1411267365, "seat_tkl_ticketStatus": "02", "seat_percent_ticketStatus": "02"},
        {"subTitle": "SBW09", "placeNameFra": "Saly Plage Ouest",
         "playDateTime_Senegal": "08.11.2026, 10:30", "homeTeamName": "Beach Wrestling / Sailing (windsurfing)",
         "productId": 19062, "scheduleId": 1746597196,
         "seat_tkl_ticketStatus": "02", "seat_percent_ticketStatus": "02"},
    ]
    items = pt.parse_game_info(games, {})
    assert items[0]["code"] == "BDM05" and items[0]["title"] == "Badminton"
    assert (items[0]["date"], items[0]["start"]) == ("2026-11-03", "09:00")  # heure de Dakar, pas de Corée
    assert items[0]["url"] is None and items[0]["status"] == "unknown"  # rien d'inventé
    assert items[1]["sports"] == ["WRB", "SAL"]
    cfg = {"purchaseUrlTemplate": "https://tickets.dakar2026.org/fr/x/{scheduleId}",
           "statusMap": {"02/02": "available"}}
    items = pt.parse_game_info(games, cfg)
    assert items[0]["url"] == "https://tickets.dakar2026.org/fr/x/1411267365"
    assert items[0]["status"] == "available"


def test_schedule_conflict_uses_ticketing_start():
    """Horaire billetterie ≠ PDF : début de la billetterie, fin null, PDF gardé pour la mention."""
    sessions = {s["id"]: s for s in json.loads((ROOT / "data/sessions.json").read_text())}
    tickets = {t["code"]: t for t in json.loads((ROOT / "data/raw/tickets.parsed.json").read_text())["items"]}
    pdf = {s["code"]: s for s in json.loads((ROOT / "data/raw/programme.sessions.json").read_text())["sessions"]}
    for code, s in sessions.items():
        if s["kind"] != "sport":
            continue
        t = tickets.get(code)
        if t and t["start"] != pdf[code]["start"][11:16]:
            assert s["start"] == f"{t['date']}T{t['start']}:00+00:00"
            assert s["end"] is None
            assert s["scheduleConflict"] == {"pdfStart": pdf[code]["start"], "pdfEnd": pdf[code]["end"],
                                             "ticketStart": s["start"]}
        else:
            assert (s["start"], s["end"], s["scheduleConflict"]) == (pdf[code]["start"], pdf[code]["end"], None)
