# backend/game/llm_pool.py
from collections import deque
from typing import Deque, Dict, Optional

# on garde les 50 dernières histoires
LLM_STORIES_POOL: Deque[Dict] = deque(maxlen=50)

def push_story(theme: str, level: int, story: str) -> None:
    LLM_STORIES_POOL.appendleft({
        "theme": theme,
        "level": level,
        "story": story,
    })

def pop_story(theme: str, level: int) -> Optional[str]:
    """
    Prend la 1ère histoire qui match theme/level.
    Si aucune ne match -> None
    """
    for i, item in enumerate(list(LLM_STORIES_POOL)):
        if item["theme"] == theme and item["level"] == level:
            # on retire cet item du pool
            LLM_STORIES_POOL.remove(item)
            return item["story"]
    return None
