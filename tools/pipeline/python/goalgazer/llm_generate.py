from __future__ import annotations

import json
from typing import Any, Dict, List
import re
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
                "required": ["heading", "paragraphs", "claims"],
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
                "required": ["player", "team", "summary", "evidence"],
            },
        },
        "data_limitations": {"type": "array", "items": {"type": "string"}},
        "cta": {"type": "string"},
        "multiverse": {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "pivots": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "minute": {"type": "integer"},
                            "type": {"type": "string", "enum": ["goal", "card", "red card", "yellow card", "substitution", "tactical", "penalty", "other"]},
                            "description": {"type": "string"},
                            "reality": {
                                "type": "object",
                                "properties": {
                                    "event": {"type": "string"},
                                    "outcome": {"type": "string"},
                                    "tactical_impact": {"type": "string"},
                                },
                                "required": ["event", "outcome", "tactical_impact"],
                            },
                            "symmetry": {
                                "type": "object",
                                "properties": {
                                    "event": {"type": "string"},
                                    "outcome": {"type": "string"},
                                    "tactical_impact": {"type": "string"},
                                    "probability": {"type": "number"},
                                },
                                "required": ["event", "outcome", "tactical_impact"],
                            },
                        },
                        "required": ["minute", "type", "description", "reality", "symmetry"],
                    },
                },
            },
            "required": ["summary", "pivots"],
        },
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


def _detect_limitations(availability: Dict[str, bool]) -> List[str]:
    return []


def build_prompt(
    match: MatchData,
    metrics: Dict[str, Any],
    figure_summaries: Dict[str, Any],
    availability: Dict[str, bool],
    allowed_evidence: List[str],
) -> List[Dict[str, str]]:
    system_prompt = (
        "You are a professional football tactical analyst and data editor. "
        "Strictly follow these requirements:\n"
        "1. Only use the supplied JSON data and derived metrics. Do not fabricate facts.\n"
        "2. Output MUST be strict JSON with no extra text.\n"
        "3. Provide at least 3 sections: 'Match Overview', 'Key Moments', and 'Tactical Notes'.\n"
        "4. Each section must have at least 2 paragraphs, and each paragraph must be at least 5 sentences long.\n"
        "5. Every claim MUST include evidence referencing fields from the payload and allowed evidence list (e.g., 'team_stats.normalized.123.total_shots=15').\n"
        "6. Player notes MUST use player-specific evidence ONLY when availability.has_players=true.\n"
        "7. Include a 'thesis' which is a 2-3 sentence core takeaway of the match.\n"
        "8. Generate a 'multiverse' section: Identify 2-3 key 'Pivot Points' (e.g., missed goals, red cards, key substitutions). "
        "For each pivot, provide the 'reality' and a high-probability 'symmetry' (an alternative outcome) with its hypothetical tactical ripple effect.\n"
        f"8. availability.has_xg={availability.get('has_xg')}; if false, do NOT mention xG or Expected Goals.\n"
        f"9. availability.has_players={availability.get('has_players')}; if false, do NOT mention ratings or duels.\n"
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
        "    { \"player\": \"...\", \"team\": \"...\", \"summary\": \"...\", \"evidence\": [\"...\"] }\n"
        "  ],\n"
        "  \"data_limitations\": [\"...\"],\n"
        "  \"cta\": \"...\",\n"
        "  \"multiverse\": {\n"
        "    \"summary\": \"...\",\n"
        "    \"pivots\": [\n"
        "      {\n"
        "        \"minute\": 35, \"type\": \"penalty\", \"description\": \"...\",\n"
        "        \"reality\": { \"event\": \"...\", \"outcome\": \"...\", \"tactical_impact\": \"...\" },\n"
        "        \"symmetry\": { \"event\": \"...\", \"outcome\": \"...\", \"tactical_impact\": \"...\", \"probability\": 0.65 }\n"
        "      }\n"
        "    ]\n"
        "  }\n"
        "}"
    )

    is_sparse_data = not availability.get("has_shot_locations") or not availability.get("has_xg")
    
    inference_instruction = ""
    if is_sparse_data:
        inference_instruction = (
            "\n💡 TACTICAL INFERENCE MODE: Critical data (shot locations or xG) is missing. "
            "Please use the 'timeline' events and 'aggregates' to infer the tactical narrative. "
            "Focus on momentum shifts, substitution impacts, and how teams adapted their playstyle "
            "based on the sequence of events. Provide a richer description of key sequences to "
            "compensate for the lack of spatial charts."
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
        "automatically_detected_limitations": _detect_limitations(availability),
        "inference_instruction": inference_instruction,
        "availability": availability,
        "allowed_evidence": allowed_evidence,
    }

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": json.dumps(user_payload)},
    ]


def call_llm(messages: List[Dict[str, str]], use_openai: bool = False) -> str:
    if use_openai and settings.openai_api_key:
        import sys
        print("Using OpenAI for Deep Analysis...", file=sys.stderr)
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.openai_api_key}",
            },
            json={
                "model": settings.openai_model,
                "messages": messages,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            },
            timeout=120,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    api_key = settings.pollinations_api_key
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    import sys
    print(f"Calling Pollinations AI [{settings.pollinations_model}]...", file=sys.stderr)
    response = requests.post(
        settings.pollinations_endpoint,
        headers=headers,
        json={
            "model": settings.pollinations_model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        },
        timeout=120,
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
    for note in payload.get("player_notes", []):
        for item in note.get("evidence", []):
            key = item.split("=")[0]
            if key not in allowed_tokens:
                return False
    return True


def fallback_output(
    match: MatchData,
    metrics: Dict[str, Any],
    figure_summaries: Dict[str, Any],
    availability: Dict[str, bool],
    allowed_evidence: List[str],
) -> LLMOutput:
    title = f"{match.match.league} Tactical Review: {match.match.homeTeam['name']} vs {match.match.awayTeam['name']}"
    evidence = [item for item in allowed_evidence if item.startswith("team_stats.normalized")][:2]
    return LLMOutput(
        title=title,
        meta_description="Match analysis based on available team data and visualizations.",
        tags=["tactical-analysis", "match-review"],
        thesis=f"A tactical overview of the clash between {match.match.homeTeam['name']} and {match.match.awayTeam['name']}.",
        sections=[
            {
                "heading": "Match Summary",
                "bullets": [],
                "paragraphs": [
                    f"This report provides a data-driven look at the match between {match.match.homeTeam['name']} and {match.match.awayTeam['name']}.",
                    "The following sections detail the key metrics and statistical performance of both teams."
                ],
                "claims": [
                    {
                        "claim": "Match statistics and figures successfully processed.",
                        "evidence": evidence or [],
                        "confidence": 0.9,
                    }
                ],
            }
        ],
        player_notes=[],
        data_limitations=[],
        cta="Thank you for reading this tactical review.",
    )


def _validate_llm_payload(payload: Dict[str, Any], availability: Dict[str, bool], allowed_tokens: set[str]) -> bool:
    forbidden_terms = []
    if not availability.get("has_xg"):
        forbidden_terms.extend([r"\bxg\b", r"expected goals"])
    if not availability.get("has_players"):
        forbidden_terms.extend([r"\brating\b", r"\bduel"])

    text_fields = []
    for section in payload.get("sections", []):
        text_fields.extend(section.get("paragraphs", []))
        text_fields.extend(section.get("bullets", []))
        for claim in section.get("claims", []):
            text_fields.append(claim.get("claim", ""))
    for note in payload.get("player_notes", []):
        text_fields.append(note.get("summary", ""))

    for term in forbidden_terms:
        pattern = re.compile(term, re.IGNORECASE)
        if any(pattern.search(text or "") for text in text_fields):
            return False

    return evidence_traceable(payload, allowed_tokens)


def generate_llm_output(
    match: MatchData,
    metrics: Dict[str, Any],
    figure_summaries: Dict[str, Any],
    availability: Dict[str, bool],
) -> LLMOutput:
    allowed_evidence = [f"{key}={value}" for key, value in metrics.items()]
    allowed_tokens = set(metrics.keys())
    messages = build_prompt(match, metrics, figure_summaries, availability, allowed_evidence)

    # Use OpenAI directly for sparse data (Deep Analysis mode)
    is_sparse_data = not availability.get("has_shot_locations") or not availability.get("has_xg")
    if is_sparse_data and settings.openai_api_key:
        try:
            response = call_llm(messages, use_openai=True)
            payload = validate_json(response)
            if _validate_llm_payload(payload, availability, allowed_tokens):
                return LLMOutput.model_validate(payload)
        except Exception as e:
            import sys
            print(f"Deep Analysis (OpenAI) failed: {e}. Falling back to default...", file=sys.stderr)

    for attempt in range(3):
        try:
            response = call_llm(messages, use_openai=False)
            payload = validate_json(response)
            if not _validate_llm_payload(payload, availability, allowed_tokens):
                import sys
                print(f"Attempt {attempt + 1}: LLM payload failed validation.", file=sys.stderr)
                continue
            return LLMOutput.model_validate(payload)
        except (ValidationError, json.JSONDecodeError, requests.RequestException) as e:
            import sys
            print(f"Attempt {attempt + 1} failed: {type(e).__name__}: {str(e)[:100]}", file=sys.stderr)
            if settings.openai_api_key and attempt == 2: # Last resort
                print("Final attempt using OpenAI fallback...", file=sys.stderr)
                try:
                    response = call_llm(messages, use_openai=True)
                    payload = validate_json(response)
                    return LLMOutput.model_validate(payload)
                except: pass
            continue

    return fallback_output(match, metrics, figure_summaries, availability, allowed_evidence)
