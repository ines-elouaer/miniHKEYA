from pydantic import BaseModel
from typing import List

class GenerateRequest(BaseModel):
    theme: str
    level: int

class GenerateResponse(BaseModel):
    story_id: str
    raw_story: str
    theme: str
    level: int
    index: int  # numéro de l'histoire dans la série (0 → 3)

class MaskRequest(BaseModel):
    story_id: str
    raw_story: str
    level: int

class BlankChoice(BaseModel):
    blank_id: int
    correct: str
    choices: List[str]
    position: int

class MaskResponse(BaseModel):
    story_id: str
    masked_story: str
    blanks: List[BlankChoice]
    theme: str
    level: int
    index: int

class CheckAnswer(BaseModel):
    blank_id: int
    answer: str

class CheckRequest(BaseModel):
    story_id: str
    answers: List[CheckAnswer]

class CheckDetail(BaseModel):
    blank_id: int
    correct: bool

class CheckResponse(BaseModel):
    score: int
    max_score: int
    details: List[CheckDetail]
    feedback: str
    theme: str
    level: int
    index: int