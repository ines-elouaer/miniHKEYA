import json
import os
import random
from typing import List, Dict, Optional, Any, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_EXAMPLES_PATH = os.path.join(BASE_DIR, "data", "story_examples_ar.jsonl")


def load_examples(path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Charge des exemples JSONL.
    Chaque ligne doit être un dict JSON: {"theme": "...", "level": 1, "story": "..."}
    """
    path = path or DEFAULT_EXAMPLES_PATH
    if not os.path.exists(path):
        return []

    data: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if isinstance(obj, dict) and isinstance(obj.get("story"), str):
                    data.append(obj)
            except Exception:
                pass
    return data


def pick_few_shots(
    examples: List[Dict[str, Any]],
    theme: str,
    level: int,
    k: int = 2
) -> List[Dict[str, Any]]:
    """
    Choisit k exemples les plus proches (theme/level).
    Tri SAFE (pas de comparaison dict).
    """
    if not examples:
        return []

    theme_norm = (theme or "").lower().strip()
    scored: List[Tuple[int, int, Dict[str, Any]]] = []

    for idx, ex in enumerate(examples):
        if not isinstance(ex, dict):
            continue

        ex_theme = str(ex.get("theme", "")).lower().strip()
        try:
            ex_level = int(ex.get("level", level))
        except Exception:
            ex_level = level

        score = 0
        if ex_level == level:
            score += 2
        # thème proche
        if ex_theme and (ex_theme in theme_norm or theme_norm in ex_theme):
            score += 3

        scored.append((score, idx, ex))

    scored.sort(key=lambda x: x[0], reverse=True)

    pool = [ex for _, _, ex in scored[: max(k * 3, 6)]]
    random.shuffle(pool)
    return pool[:k]
