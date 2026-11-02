"""Miroir pydantic des schémas zod de docs/DATA_MODEL.md (référence : le zod)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import AnyUrl, BaseModel, ConfigDict, Field, field_validator

Cluster = Literal["dakar", "diamniadio", "saly"]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _aware(v: str | None) -> str | None:
    if v is None:
        return v
    dt = datetime.fromisoformat(v)
    if dt.tzinfo is None:
        raise ValueError(f"datetime sans offset : {v}")
    return v


class Venue(_Strict):
    id: str
    name: str
    cluster: Cluster
    aliases: list[str] = Field(min_length=1)
    lat: float | None
    lng: float | None
    mapsQuery: str
    accessNote: str | None
    accessSourceUrl: AnyUrl | None


class Sport(_Strict):
    id: str
    codePrefix: str
    nameFr: str
    nameEn: str
    emoji: str


class ScheduleConflict(_Strict):
    pdfStart: str
    pdfEnd: str
    ticketStart: str

    _a = field_validator("pdfStart", "pdfEnd", "ticketStart")(classmethod(lambda cls, v: _aware(v)))


class Session(_Strict):
    id: str
    kind: Literal["sport", "fan"]
    sportId: str | None
    title: str | None
    venueId: str
    hall: str | None
    start: str
    end: str | None  # null pour kind = "fan" si la fin n'est pas publiée
    day: int
    events: list[str]
    eventsRaw: list[str]
    hasFinal: bool
    isFree: Literal[True] | None  # jamais false par défaut
    freeSource: AnyUrl | None
    ticketUrl: AnyUrl | None
    ticketMatch: Literal["code", "venue-day", "none"]
    ticketStatus: Literal["available", "limited", "soldout", "cancelled", "unknown"]
    sourceUrl: AnyUrl
    scheduleConflict: ScheduleConflict | None

    _start = field_validator("start")(classmethod(lambda cls, v: _aware(v)))
    _end = field_validator("end")(classmethod(lambda cls, v: _aware(v)))


class MetaSource(_Strict):
    id: str
    url: AnyUrl
    sha256: str
    fetchedAt: str


class Counts(_Strict):
    sessions: int
    venues: int
    sports: int


class Meta(_Strict):
    generatedAt: str
    sources: list[MetaSource]
    counts: Counts
    warnings: list[str]

    _gen = field_validator("generatedAt")(classmethod(lambda cls, v: _aware(v)))
