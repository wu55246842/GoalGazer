from __future__ import annotations

from pathlib import Path

from .config import settings


def build_src_relative(out_path: Path) -> str:
    relative_path = out_path.relative_to(settings.figure_output_base_dir).as_posix()
    return f"/generated/{relative_path}"
