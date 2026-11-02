"""Tests du parser du programme sur 3 pages réelles du PDF S1.

Fixtures : mots extraits par pdfplumber (texte + positions) des pages 1, 5 et 8 du PDF
publié le 30/10/2026. Résultats attendus recopiés à la main depuis le PDF.
"""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import parse_programme as pp  # noqa: E402

FIX = ROOT / "tests" / "fixtures"


def load_words(name: str) -> list[dict]:
    return json.loads((FIX / f"{name}.words.json").read_text(encoding="utf-8"))["words"]


def parse(words: list[dict]) -> dict[str, dict]:
    problems: list[str] = []
    sessions = pp.parse_words([words], problems)
    assert sessions is not None, "bornes de colonnes introuvables"
    assert problems == []
    out = pp.build_output(sessions, problems, "columns", None, None)
    return {s["code"]: s for s in out["sessions"]}


@pytest.fixture(scope="module")
def page1():
    return parse(load_words("page1_days_-1_0_1"))


@pytest.fixture(scope="module")
def page5():
    return parse(load_words("page5_day8"))


@pytest.fixture(scope="module")
def page8():
    return parse(load_words("page8_days_11_12_13"))


# ------------------------------------------------------------------ jour 1 (page 1)

DAY1 = [
    ("VBV02", "08:30", "16:50", "Saly Beach West", ["Women and Men - Pool Round"]),
    ("BDM01", "09:00", "12:40", "Dakar Arena", ["Women's and Men's singles - group stage"]),
    ("TTE02", "09:30", "13:00", "Dakar Expo Centre",
     ["Women's Single - Preliminary Stage", "Men's Single - Preliminary Stage"]),
    ("WST01", "09:30", "11:30", "Dakar Expo Centre",
     ["Men's Changquan - Preliminary Round", "Women's Taijishan - Preliminary Round"]),
    ("FBS01", "10:00", "14:00", "Complexe Iba Mar Diop",
     ["Women's CRC vs IRN", "Women's ITA vs CMR"]),
    ("JUD01", "10:00", "12:30", "Dakar Expo Centre",
     ["Men - 55kg - Preliminary Rounds", "Women -44kg - Preliminary Rounds",
      "Men -66kg - Preliminary Rounds"]),
    ("RCB02", "10:00", "13:30", "Saly Beach West",
     ["Mixed Double Sculls - Time Trial 2", "Men's Solo - Time Trial 2",
      "Women's Solo - Time Trial 2", "Mixed Double Sculls - Last 16"]),
    ("RU701", "10:30", "11:58", "Complexe Iba Mar Diop", ["Men - Pool Round"]),
    ("BS504", "10:30", "13:15", "Complexe Tour de l'Oeuf", ["KEN vs SYR", "FRA vs MEX"]),
    ("SWM01", "11:00", "13:00", "Complexe Tour de l'Oeuf",
     ["Women's 200m Backstroke - Heats", "Men's 200m Backstroke - Heats",
      "Women's 100m Butterfly - Heats", "Men's 100m Butterfly - Heats",
      "Women's 400m Freestyle - Slowest Heats", "Men's 800m Freestyle - Slowest Heats"]),
    ("RU702", "13:14", "17:26", "Complexe Iba Mar Diop", ["Men - Pool Round"]),
    ("BDM02", "14:30", "18:55", "Dakar Arena", ["Women's and Men's singles - group stage"]),
    ("TTE03", "14:30", "19:30", "Dakar Expo Centre",
     ["Women's Single - Preliminary Stage", "Men's Single - Preliminary Stage",
      "Mixed Doubles - Quarterfinals"]),
    ("WST02", "14:30", "16:30", "Dakar Expo Centre",
     ["Women's Gunshu - Preliminary Round", "Men's Taijiquan - Preliminary Round"]),
    ("BS505", "15:00", "17:45", "Complexe Tour de l'Oeuf", ["TUR vs SEN", "CUB vs TPE"]),
    ("SWM02", "15:00", "17:00", "Complexe Tour de l'Oeuf",
     ["Women's 400m Freestyle - Fastest Heats", "Men's 800m Freestyle - Fastest Heats",
      "Women's 200m Backstroke - Final", "Men's 200m Backstroke - Final",
      "Women's 100m Butterfly - Final", "Men's 100m Butterfly - Final"]),
    ("FBS02", "15:30", "19:30", "Complexe Iba Mar Diop",
     ["Women's VEN vs UKR", "Women's SEN vs FIJ"]),
    ("JUD02", "16:00", "17:39", "Dakar Expo Centre",
     ["Men - 55kg - Final Block", "Women -44kg - Final Block", "Men -66kg - Final Block"]),
]


def test_page1_days(page1):
    by_day = {}
    for s in page1.values():
        by_day.setdefault(s["day"], []).append(s["code"])
    assert by_day == {
        -1: ["BS501", "BS502"],
        0: ["BS503", "VBV01", "TTE01", "RCB01"],
        1: [c for c, *_ in DAY1],
    }


@pytest.mark.parametrize("code,start,end,venue,events", DAY1, ids=[d[0] for d in DAY1])
def test_day1_session(page1, code, start, end, venue, events):
    s = page1[code]
    assert s["date"] == "2026-11-01"
    assert s["start"] == f"2026-11-01T{start}:00+00:00"
    assert s["end"] == f"2026-11-01T{end}:00+00:00"
    assert s["venue"] == venue
    assert s["eventsRaw"] == events
    assert s["warnings"] == []


def test_day_minus1_and_0(page1):
    assert page1["BS501"]["date"] == "2026-10-30"
    assert page1["BS501"]["eventsRaw"] == ["CUB vs TUR", "TPE vs SEN"]
    assert page1["BS503"]["eventsRaw"] == ["TPE vs TUR", "SYR vs FRA", "MEX vs KEN", "SEN vs CUB"]
    # 1ʳᵉ épreuve sur la ligne principale, une au-dessus, une en dessous
    assert page1["RCB01"]["eventsRaw"] == [
        "Mixed Double Sculls - Time Trial 1", "Men's Solo - Time Trial 1",
        "Women's Solo - Time Trial 1"]
    assert page1["TTE01"]["eventsRaw"] == [
        "Mixed Doubles - Round of 32", "Mixed Doubles - Round of 16"]
    assert page1["VBV01"]["cluster"] == "Saly Beach West"
    assert page1["VBV01"]["discipline"] == "Beach Volleyball"


# ------------------------------------------------------------------ jour 8 (page 5)

def test_day8_order(page5):
    assert list(page5) == [
        "CRD01", "FEN01", "GAR03", "ARC04", "WRB03", "TKW01", "FBS13", "BK305", "BOX03",
        "SAL01", "FEN02", "ARC05", "ATH01", "BK306", "FBS14", "WRB04", "GAR04", "TKW02",
        "BOX04",
    ]
    assert {s["date"] for s in page5.values()} == {"2026-11-08"}


def test_day8_athletics_multiline(page5):
    s = page5["ATH01"]
    assert (s["start"], s["end"]) == ("2026-11-08T14:30:00+00:00", "2026-11-08T17:59:00+00:00")
    assert s["venue"] == "Complexe Iba Mar Diop"
    assert s["eventsRaw"] == [
        "Men's Hammer Throw - final",
        "Women's 100m Hurdle - semi & final",
        "Women's Triple Jump - final",
        "Women's 800m - semi-final",
        "Women's 100m - semi & final",
        "Men's 100m - semi & final",
        "Women's Pole Vault - final",
        "Women's 400m - semi-final",
        "Men's 400m - semi-final",
        "Women's Discus Throw",
        "Men's Long Jump - final",
        "Men's 3000m - final",
        "Women's 2000m Steeplechase - final",
    ]
    assert s["warnings"] == []


def test_day8_others(page5):
    assert page5["CRD01"]["venue"] == "Corniche West"
    assert page5["CRD01"]["discipline"] == "Cycling Road"
    assert page5["CRD01"]["eventsRaw"] == ["Women's Road Race - Final", "Men's Road Race - Final"]
    assert page5["FEN01"]["eventsRaw"] == [
        "Women's Foil Individual - Pool Round, Table of 16, Table of 8"]
    assert page5["ARC05"]["eventsRaw"] == [
        "Men's Quarterfinals", "Men's Semifinals", "Men's Finals (Bronze and Gold)"]
    assert page5["WRB03"]["eventsRaw"] == [
        "Women 45kg - Group Stage Rounds", "Women 65kg - Group Stage Rounds",
        "Men 70kg - Group Stage Rounds", "Men 90kg - Group Stage Rounds"]
    assert page5["BOX03"]["eventsRaw"] == [
        "Women's 48kg - Preliminaries", "Women's 54kg - Preliminaries",
        "Women's 60kg - Preliminaries", "Men's 50kg - Preliminaries",
        "Men's 60kg - Preliminaries"]
    assert page5["SAL01"]["discipline"] == "Sailing (Windsurfing)"


# ------------------------------------------------------------------ jours 11-13 (page 8)

def test_page8_counts(page8):
    counts = {}
    for s in page8.values():
        counts[s["day"]] = counts.get(s["day"], 0) + 1
    assert counts == {11: 12, 12: 13, 13: 2}


def test_day12_split_event(page8):
    # « Table of » au-dessus de l'horaire, « 8 » en dessous → une seule épreuve
    s = page8["FEN09"]
    assert s["rows"] == ["Women's Sabre Individual - Pool Round, Table of 16, Table of", "8"]
    assert s["eventsRaw"] == ["Women's Sabre Individual - Pool Round, Table of 16, Table of 8"]
    assert page8["BOX11"]["eventsRaw"][2] == "M's 50kg - Final"


def test_day13(page8):
    hbb = page8["HBB08"]
    assert hbb["date"] == "2026-11-13"
    assert (hbb["start"], hbb["end"]) == ("2026-11-13T09:30:00+00:00", "2026-11-13T13:51:00+00:00")
    # parenthèse non fermée dans la source : gardée telle quelle, signalée
    assert hbb["eventsRaw"] == ["Women's and Men's singles - Finals (Bronze and Gold"]
    assert any("parenthèse" in a for a in hbb["anomalies"])
    bkg = page8["BKG03"]
    assert bkg["venue"] == "Complexe Tour de l'Oeuf"
    assert bkg["eventsRaw"] == [
        "B-Girls - Quarterfinals, Semifinals, Finals (Bronze and Gold Medal Battles)",
        "B-Boys - Quarterfinals, Semifinals, Finals (Bronze and Gold Medal Battles)",
    ]


def test_day13_glued_header():
    """En-tête de jour collé à la ligne de session (`Day 13 13 November 2026. 09:30 - …`)."""
    words = copy.deepcopy(load_words("page8_days_11_12_13"))
    hbb_top = next(w["top"] for w in words if w["text"] == "HBB08")
    header = [w for w in words if 755 < w["top"] < 760]  # « Day 13 13 November 2026. »
    assert " ".join(w["text"] for w in header) == "Day 13 13 November 2026."
    # on colle l'en-tête à gauche de la ligne HBB08, comme dans l'extraction texte
    for i, w in enumerate(header):
        w["top"] = hbb_top
        w["x0"], w["x1"] = -200 + 30 * i, -200 + 30 * i + 25
    glued = parse(words)
    assert glued["HBB08"]["day"] == 13
    assert glued["HBB08"]["start"] == "2026-11-13T09:30:00+00:00"
    assert glued["BKG03"]["eventsRaw"] == parse(load_words("page8_days_11_12_13"))["BKG03"]["eventsRaw"]


# ------------------------------------------------------------------ unités

def test_merge_events():
    assert pp.merge_events(["A - Finals (Bronze and Gold", "Medal Battles)", "B"]) == [
        "A - Finals (Bronze and Gold Medal Battles)", "B"]
    assert pp.merge_events(["X, Table of", "8"]) == ["X, Table of 8"]
    assert pp.merge_events(["Men's 100m - Heats", "Women's 100m - Heats"]) == [
        "Men's 100m - Heats", "Women's 100m - Heats"]


def test_day_header_negative():
    n, d, _ = pp.parse_day_header("Day - 1 30 October 2026.")
    assert (n, d) == (-1, "2026-10-30")
    n, d, m = pp.parse_day_header("Day 13 13 November 2026. 09:30 - 13:51 Saly")
    assert (n, d) == (13, "2026-11-13")
    assert m.end() < len("Day 13 13 November 2026. 09:30")
