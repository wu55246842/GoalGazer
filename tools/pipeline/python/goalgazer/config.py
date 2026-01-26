from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    api_football_key: str | None = os.getenv("API_FOOTBALL_KEY")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    pollinations_api_key: str | None = os.getenv("POLLINATIONS_API_KEY")
    pollinations_model: str = os.getenv("POLLINATIONS_MODEL", "grok")
    pollinations_endpoint: str = "https://gen.pollinations.ai/v1/chat/completions"
    output_root: Path = Path(__file__).resolve().parents[4]

    @property
    def web_content_dir(self) -> Path:
        return self.output_root / "apps" / "web" / "content"

    @property
    def web_public_dir(self) -> Path:
        return self.output_root / "apps" / "web" / "public" / "generated" / "matches"

    @property
    def cache_dir(self) -> Path:
        return self.output_root / "tools" / "pipeline" / ".cache" / "api-football"


settings = Settings()
