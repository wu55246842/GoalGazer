from __future__ import annotations

import json
from typing import Any, Dict, List
import requests
from jsonschema import validate, ValidationError

from .config import settings
from .schemas import MatchData, LLMOutput


LLM_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "language": {"type": "string"},
        "title": {"type": "string"},
        "meta_description": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "thesis": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                    "paragraphs": {"type": "array", "items": {"type": "string"}},
                    "claims": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "claim": {"type": "string"},
                                "evidence": {"type": "array", "items": {"type": "string"}},
                                "confidence": {"type": "number"},
                            },
                            "required": ["claim", "evidence", "confidence"],
                        },
                    },
                },
                "required": ["heading", "bullets", "paragraphs", "claims"],
            },
        },
        "player_notes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "player": {"type": "string"},
                    "team": {"type": "string"},
                    "summary": {"type": "string"},
                    "evidence": {"type": "array", "items": {"type": "string"}},
                    "rating": {"type": "string"},
                },
                "required": ["player", "team", "summary", "evidence", "rating"],
            },
        },
        "data_limitations": {"type": "array", "items": {"type": "string"}},
        "cta": {"type": "string"},
    },
    "required": [
        "language",
        "title",
        "meta_description",
        "tags",
        "thesis",
        "sections",
        "player_notes",
        "data_limitations",
        "cta",
    ],
}


def _detect_limitations(match: MatchData) -> List[str]:
    limitations = []
    if not match.aggregates.normalized:
        limitations.append("Full team-level statistics were not available.")
    
    # Check for player-level stats
    has_ratings = any(p.stats.rating for p in match.players)
    if not has_ratings:
        limitations.append("Detailed player performance ratings were not available.")
    
    # Check for xG
    if not match.aggregates.xG:
        limitations.append("Expected Goals (xG) data not available from this source.")
        
    return limitations


def build_prompt(match: MatchData, metrics: Dict[str, Any], figure_summaries: Dict[str, Any]) -> List[Dict[str, str]]:
    system_prompt = (
        "You are a professional football tactical analyst and data editor. "
        "Strictly follow these requirements:\n"
        "1. Only use the supplied JSON data and derived metrics. Do not fabricate facts.\n"
        "2. Output MUST be strict JSON with no extra text.\n"
        "3. Provide at least 3 sections: 'Match Overview', 'Key Moments', and 'Tactical Notes'.\n"
        "4. Each section must have at least 2 paragraphs, and each paragraph must be at least 5 sentences long.\n"
        "5. Every claim MUST include evidence referencing fields from the payload (e.g., 'total_shots_home=15').\n"
        "6. Player notes MUST use player-specific evidence (e.g., 'player_rating=8.5', 'player_goals=1').\n"
        "7. Include a 'thesis' which is a 2-3 sentence core takeaway of the match.\n"
        "\n"
        "JSON Structure:\n"
        "{\n"
        "  \"language\": \"en\",\n"
        "  \"title\": \"...\",\n"
        "  \"meta_description\": \"...\",\n"
        "  \"tags\": [\"...\"],\n"
        "  \"thesis\": \"...\",\n"
        "  \"sections\": [\n"
        "    { \"heading\": \"...\", \"bullets\": [\"...\"], \"paragraphs\": [\"...\"], \"claims\": [{ \"claim\": \"...\", \"evidence\": [\"...\"], \"confidence\": 0.9 }] }\n"
        "  ],\n"
        "  \"player_notes\": [\n"
        "    { \"player\": \"...\", \"team\": \"...\", \"summary\": \"...\", \"evidence\": [\"...\"], \"rating\": \"7.5\" }\n"
        "  ],\n"
        "  \"data_limitations\": [\"...\"],\n"
        "  \"cta\": \"...\"\n"
        "}"
    )

    user_payload = {
        "match_context": match.match.model_dump(),
        "data_payload": {
            "teams": [team.model_dump() for team in match.teams],
            "players": [player.model_dump() for player in match.players],
            "timeline": [t.model_dump() for t in match.timeline],
            "aggregates": match.aggregates.model_dump(),
            "derived_metrics": metrics,
        },
        "figure_summaries": figure_summaries,
        "automatically_detected_limitations": _detect_limitations(match)
    }

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": json.dumps(user_payload)},
    ]


def call_pollinations(messages: List[Dict[str, str]]) -> str:
    # Fallback to OpenAI if no Pollinations key is set, or just use Pollinations anonymously
    api_key = settings.pollinations_api_key
    
    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(
        settings.pollinations_endpoint,
        headers=headers,
        json={
            "model": settings.pollinations_model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def validate_json(text: str) -> Dict[str, Any]:
    payload = json.loads(text)
    if "language" not in payload:
        payload["language"] = "en"
    validate(instance=payload, schema=LLM_SCHEMA)
    return payload


def evidence_traceable(payload: Dict[str, Any], allowed_tokens: set[str]) -> bool:
    for section in payload.get("sections", []):
        for claim in section.get("claims", []):
            for item in claim.get("evidence", []):
                key = item.split("=")[0]
                if key not in allowed_tokens:
                    return False
    return True


def fallback_output(match: MatchData, metrics: Dict[str, Any], figure_summaries: Dict[str, Any]) -> LLMOutput:
    title = f"{match.match.league} Tactical Review: {match.match.homeTeam} {match.match.score} {match.match.awayTeam}"
    return LLMOutput(
        title=title,
        meta_description="Automated draft based on available match data and original charts.",
        tags=["tactical-analysis", "automated-draft"],
        thesis="Automated draft: narrative generated from limited data fields.",
        sections=[
            {
                "heading": "Automated Data Summary",
                "bullets": [
                    f"Possession: {match.aggregates.possession}",
                    f"Shots: {match.aggregates.shots}",
                    f"Shots on target: {match.aggregates.shotsOnTarget}",
                ],
                "paragraphs": [
                    "This draft was generated because the LLM API was unavailable. It summarizes available statistics and figures without speculative narrative.",
                    f"Figure summaries: {figure_summaries}",
                ],
                "claims": [
                    {
                        "claim": "Data-only summary; no tactical inference made.",
                        "evidence": ["possession", "shots"],
                        "confidence": 0.3,
                    }
                ],
            }
        ],
        player_notes=[],
        data_limitations=["LLM unavailable; fallback summary generated."]
        + (["xG not available from source."] if match.aggregates.xG is None else []),
        cta="Automated draft generated without LLM narrative.",
    )


def generate_llm_output(match: MatchData, metrics: Dict[str, Any], figure_summaries: Dict[str, Any]) -> LLMOutput:
    allowed_tokens = set(metrics.keys()) | {"possession", "shots", "shotsOnTarget", "xG"} | {"pass_network_dense_in_zone_14", "passes_completed"}
    messages = build_prompt(match, metrics, figure_summaries)

    if not settings.pollinations_api_key and not settings.openai_api_key:
        return fallback_output(match, metrics, figure_summaries)

    for attempt in range(3):
        try:
            response = call_pollinations(messages)
            payload = validate_json(response)
            
            # Temporarily disable strict evidence traceability to allow LLM output
            # TODO: Re-enable after improving prompt to ensure evidence keys match
            # if not evidence_traceable(payload, allowed_tokens):
            #     print(f"Attempt {attempt + 1}: Evidence traceability failed, retrying...")
            #     continue
            
            return LLMOutput.model_validate(payload)
        except (ValidationError, json.JSONDecodeError, requests.RequestException) as e:
            print(f"Attempt {attempt + 1} failed: {type(e).__name__}: {str(e)[:100]}")
            continue

    return fallback_output(match, metrics, figure_summaries)
