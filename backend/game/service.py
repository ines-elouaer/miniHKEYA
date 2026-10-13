# backend/game/service.py
import random
import uuid
from typing import Dict, List, Tuple

from .data import STORIES, VOCAB_BY_LEVEL, DISTRACTORS
from .models import (
    GenerateRequest, GenerateResponse,
    MaskRequest, MaskResponse, BlankChoice,
    CheckRequest, CheckResponse, CheckDetail
)

STORY_BLANKS: Dict[str, List[BlankChoice]] = {}
STORY_META: Dict[str, Dict] = {}

def generate_story(req: GenerateRequest) -> GenerateResponse:
    story_text = None
    source = "static"
    story_index = 0

    # ✅ PRIORITÉ 1 : histoire envoyée depuis le front
    if req.llm_story_text and req.llm_story_text.strip():
        story_text = req.llm_story_text.strip()
        source = "llm"
        story_index = 999
        print("✅ [generate_story] LLM story received from FRONT ✅")

    # ✅ PRIORITÉ 2 : fallback dataset statique
    if not story_text:
        key = (req.theme, req.level)
        stories_list = STORIES.get(key)

        if not stories_list:
            story_text = "نهار من نهارات، صغير مشى للمدرسة و قابل أصحابه."
            story_index = 0
        else:
            story_index = random.randint(0, len(stories_list) - 1)
            story_text = stories_list[story_index]

        source = "static"
        print("ℹ️ [generate_story] Static dataset used")

    story_id = str(uuid.uuid4())

    STORY_META[story_id] = {
        "theme": req.theme,
        "level": req.level,
        "index": story_index,
        "source": source,
    }

    return GenerateResponse(
        story_id=story_id,
        raw_story=story_text,
        theme=req.theme,
        level=req.level,
        index=story_index,
        source=source,
    )

def _choose_words_to_mask(words: List[str], level: int) -> List[Tuple[int, str]]:
    vocab = VOCAB_BY_LEVEL.get(level, [])
    candidates = [(i, w) for i, w in enumerate(words) if w in vocab]

    if not candidates:
        indices = list(range(len(words)))
        random.shuffle(indices)
        selected = indices[:3]
        return [(i, words[i]) for i in selected]

    random.shuffle(candidates)
    return candidates[:3]

def _build_choices(correct_word: str) -> List[str]:
    distracts = [d for d in DISTRACTORS if d != correct_word]
    random.shuffle(distracts)
    options = [correct_word] + distracts[:2]
    random.shuffle(options)
    return options

def mask_story(req: MaskRequest) -> MaskResponse:
    words = req.raw_story.split()
    to_mask = _choose_words_to_mask(words, req.level)

    blanks: List[BlankChoice] = []
    for blank_id, (index, word) in enumerate(to_mask, start=1):
        choices = _build_choices(word)
        blanks.append(
            BlankChoice(blank_id=blank_id, correct=word, choices=choices, position=index)
        )
        words[index] = "___"

    masked_story = " ".join(words)
    STORY_BLANKS[req.story_id] = blanks

    meta = STORY_META.get(req.story_id, {"theme": "", "level": req.level, "index": 0})

    return MaskResponse(
        story_id=req.story_id,
        masked_story=masked_story,
        blanks=blanks,
        theme=meta["theme"],
        level=meta["level"],
        index=meta["index"],
    )

def check_answers(req: CheckRequest) -> CheckResponse:
    blanks = STORY_BLANKS.get(req.story_id, [])
    correct_map = {b.blank_id: b.correct for b in blanks}

    score = 0
    details: List[CheckDetail] = []

    for ans in req.answers:
        is_correct = (ans.answer == correct_map.get(ans.blank_id))
        if is_correct:
            score += 1
        details.append(CheckDetail(blank_id=ans.blank_id, correct=is_correct))

    meta = STORY_META.get(req.story_id, {"theme": "", "level": 1, "index": 0})
    max_score = len(blanks)

    if score == max_score:
        feedback = "Bravo ! 🔥"
    elif score == 0:
        feedback = "Réessaye, tu vas réussir ! 😊"
    else:
        feedback = f"Pas mal ! Tu as obtenu {score}/{max_score}."

    return CheckResponse(
        score=score,
        max_score=max_score,
        details=details,
        feedback=feedback,
        theme=meta["theme"],
        level=meta["level"],
        index=meta["index"],
    )
