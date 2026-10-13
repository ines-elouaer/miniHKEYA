# backend/game_robot/models.py

from pydantic import BaseModel
from typing import List


class RobotGenerateRequest(BaseModel):
    level: int


class RobotChoice(BaseModel):
    id: int
    label: str
    image_key: str


class RobotGenerateResponse(BaseModel):
    round_id: str
    word: str
    choices: List[RobotChoice]


class RobotCheckRequest(BaseModel):
    round_id: str
    choice_label: str


class RobotCheckResponse(BaseModel):
    correct: bool
    correct_word: str
    feedback: str
