from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

from jsonschema import validate

from .config import settings


def _load_schema() -> Dict[str, Any]:
    schema_path = Path(__file__).with_name("schema_match_analysis.json")
    return json.loads(schema_path.read_text())


def _locate_article(match_id: str) -> Path:
    matches_dir = settings.web_content_dir / "matches"
    index_path = settings.web_content_dir / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text())
        for entry in index:
            if str(entry.get("matchId")) == str(match_id):
                slug = entry.get("slug")
                if slug:
                    candidate = matches_dir / f"{slug}.json"
                    if candidate.exists():
                        return candidate
    matches_dir.mkdir(parents=True, exist_ok=True)
    candidates = sorted(matches_dir.glob(f"*_{match_id}.json"))
    if candidates:
        return candidates[-1]
    raise FileNotFoundError(f"No article JSON found for matchId={match_id} in {matches_dir}")


def validate_match(match_id: str) -> Path:
    article_path = _locate_article(match_id)
    article = json.loads(article_path.read_text())
    schema = _load_schema()
    validate(instance=article, schema=schema)
    return article_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate GoalGazer match analysis JSON")
    parser.add_argument("--match-id", required=True)
    args = parser.parse_args()

    article_path = validate_match(args.match_id)
    print(f"✅ Validated match analysis JSON: {article_path}")


if __name__ == "__main__":
    main()
