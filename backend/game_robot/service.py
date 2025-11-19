# backend/game_robot/service.py

import uuid
import random
from typing import Dict, List

from .data import WORDS
from .models import (
    RobotGenerateRequest,
    RobotGenerateResponse,
    RobotChoice,
    RobotCheckRequest,
    RobotCheckResponse,
)

# round_id -> mot correct
ROUND_CACHE: Dict[str, str] = {}


def generate_round(req: RobotGenerateRequest) -> RobotGenerateResponse:
    options = WORDS.get(req.level, WORDS[1])

    # choisir un mot correct
    correct_word, _ = random.choice(options)

    # mélanger les choix
    shuffled = options.copy()
    random.shuffle(shuffled)

    round_id = str(uuid.uuid4())
    ROUND_CACHE[round_id] = correct_word

    choices: List[RobotChoice] = []
    for idx, (word, image_key) in enumerate(shuffled, start=1):
        choices.append(
            RobotChoice(id=idx, label=word, image_key=image_key)
        )

    return RobotGenerateResponse(
        round_id=round_id,
        word=correct_word,
        choices=choices,
    )


def check_round(req: RobotCheckRequest) -> RobotCheckResponse:
    correct_word = ROUND_CACHE.get(req.round_id)

    if correct_word is None:
        return RobotCheckResponse(
            correct=False,
            correct_word="",
            feedback="Round inconnu, recommence une nouvelle manche."
        )

    is_correct = (req.choice_label == correct_word)

    feedback = (
        "صحيح يعطيك الصحة ! 👏"
        if is_correct
        else f"غلط ! الكلمة الصحيحة هي: {correct_word}"
    )

    return RobotCheckResponse(
        correct=is_correct,
        correct_word=correct_word,
        feedback=feedback,
    )
