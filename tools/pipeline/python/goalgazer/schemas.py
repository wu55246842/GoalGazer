from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class MatchInfo(BaseModel):
    id: str
    date_utc: str
    league: str
    season: str
    round: str
    homeTeam: str
    awayTeam: str
    score: str
    venue: str


class TeamInfo(BaseModel):
    id: str
    name: str
    side: str


class PlayerStats(BaseModel):
    # Base stats usually from events
    passes_completed: Optional[int] = None
    progressive_passes: Optional[int] = None
    shots: Optional[int] = None
    touches: Optional[int] = None
    
    # Detailed stats from fixtures/players
    rating: Optional[str] = None
    key_passes: Optional[int] = None
    tackles: Optional[int] = None
    interceptions: Optional[int] = None
    duels_total: Optional[int] = None
    duels_won: Optional[int] = None
    dribbles_success: Optional[int] = None


class PlayerInfo(BaseModel):
    id: str
    name: str
    teamId: str
    position: Optional[str] = ""
    minutes: int
    stats: PlayerStats


class EventQualifier(BaseModel):
    bodyPart: Optional[str] = None
    shotType: Optional[str] = None


class Event(BaseModel):
    type: str
    teamId: str
    playerId: Optional[str] = None
    minute: int
    second: int
    x: float
    y: float
    endX: Optional[float] = None
    endY: Optional[float] = None
    outcome: Optional[str] = None
    qualifiers: Optional[EventQualifier] = None


class TimelineEvent(BaseModel):
    minute: int
    type: str  # goal, card, sub, var
    teamId: str
    playerId: str
    playerName: str
    assistId: Optional[str] = None
    assistName: Optional[str] = None
    detail: str  # e.g. "Yellow Card", "Normal Goal"
    score_after: Optional[str] = None


class TeamNormalizedStats(BaseModel):
    possession: Optional[int] = None
    total_shots: Optional[int] = None
    shots_on_target: Optional[int] = None
    corners: Optional[int] = None
    fouls: Optional[int] = None
    yellow_cards: Optional[int] = None
    red_cards: Optional[int] = None
    offsides: Optional[int] = None
    passes_total: Optional[int] = None
    pass_accuracy: Optional[int] = None


class Aggregates(BaseModel):
    # Derived from events
    possession: Optional[dict] = None
    shots: Optional[dict] = None
    shotsOnTarget: Optional[dict] = None
    xG: Optional[dict] = None
    
    # New normalized and raw stats
    normalized: Optional[dict] = None  # Keyed by teamId
    raw: Optional[dict] = None         # Raw response from API


class MatchData(BaseModel):
    match: MatchInfo
    teams: List[TeamInfo]
    players: List[PlayerInfo]
    events: List[Event]
    timeline: List[TimelineEvent] = Field(default_factory=list)
    aggregates: Aggregates


class FigureMeta(BaseModel):
    src_relative: str
    alt: str
    caption: str
    width: int
    height: int


class LLMClaim(BaseModel):
    claim: str
    evidence: List[str]
    confidence: float


class LLMSection(BaseModel):
    heading: str
    bullets: List[str]
    paragraphs: List[str]
    claims: List[LLMClaim]


class LLMPlayerNote(BaseModel):
    player: str
    team: str
    summary: str
    evidence: List[str]
    rating: str


class LLMOutput(BaseModel):
    language: str = Field(default="en")
    title: str
    meta_description: str
    tags: List[str]
    thesis: str
    sections: List[LLMSection]
    player_notes: List[LLMPlayerNote]
    data_limitations: List[str]
    cta: str
