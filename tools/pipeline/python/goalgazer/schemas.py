from __future__ import annotations

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class MatchInfo(BaseModel):
    id: str
    date_utc: str
    league: str
    season: str
    round: Optional[str] = None
    homeTeam: Dict[str, Optional[str]]
    awayTeam: Dict[str, Optional[str]]
    score: Dict[str, Optional[int]]
    venue: Optional[str] = None


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
    type: Literal["goal", "card", "subst", "var", "other"]
    teamId: Optional[str] = None
    teamName: Optional[str] = None
    playerId: Optional[str] = None
    playerName: Optional[str] = None
    assistId: Optional[str] = None
    assistName: Optional[str] = None
    detail: Optional[str] = None
    score_after: Optional[Dict[str, int]] = None


class TeamNormalizedStats(BaseModel):
    possession: Optional[int] = None
    total_shots: Optional[int] = None
    shots_on_target: Optional[int] = None
    shots_off_target: Optional[int] = None
    corners: Optional[int] = None
    fouls: Optional[int] = None
    yellow_cards: Optional[int] = None
    red_cards: Optional[int] = None
    offsides: Optional[int] = None
    passes_total: Optional[int] = None
    pass_accuracy: Optional[int] = None
    xg: Optional[float] = None
    gk_saves: Optional[int] = None
    shots_inside_box: Optional[int] = None
    shots_outside_box: Optional[int] = None
    blocked_shots: Optional[int] = None


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
    id: str
    src_relative: str
    alt: str
    caption: str
    width: int
    height: int
    kind: Literal["stats_comparison", "timeline", "pass_network", "shot_proxy", "other"]


class LLMClaim(BaseModel):
    claim: str
    evidence: List[str]
    confidence: float


class LLMSection(BaseModel):
    heading: str
    bullets: List[str] = Field(default_factory=list)
    paragraphs: List[str]
    claims: List[LLMClaim]


class LLMPlayerNote(BaseModel):
    player: str
    team: str
    summary: str
    evidence: List[str]
    rating: Optional[str] = None


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


TRANSLATABLE_TEXT_PATHS = [
    "frontmatter.title",
    "frontmatter.description",
    "sections[].heading",
    "sections[].paragraphs[]",
    "sections[].bullets[]",
    "sections[].claims[].claim",
    "player_notes[].summary",
    "figures[].alt",
    "figures[].caption",
    "data_limitations[]",
    "cta",
]
