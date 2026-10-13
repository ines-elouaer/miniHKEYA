# backend/game/models.py
from pydantic import BaseModel
from typing import List, Optional

# ===================== HISTOIRE A TROUS =====================

class GenerateRequest(BaseModel):
    theme: str
    level: int
    use_llm: Optional[bool] = False
    llm_story_text: Optional[str] = None  # si tu veux envoyer une histoire directe depuis le front


class GenerateResponse(BaseModel):
    story_id: str
    raw_story: str
    theme: str
    level: int
    index: int
    source: str  # "static" ou "llm"


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


# ===================== MCQ (Questions sur histoire) =====================

class MCQQuestion(BaseModel):
    question: str
    choices: List[str]          # exactement 3 choix
    correct_index: int          # 0, 1 ou 2


class MCQGenerateRequest(BaseModel):
    story: str
    n_questions: int = 3


class MCQGenerateResponse(BaseModel):
    questions: List[MCQQuestion]


class MCQCheckRequest(BaseModel):
    questions: List[MCQQuestion]
    answers: List[int]          # index choisi par l’enfant


class MCQCheckResponse(BaseModel):
    score: int
    max_score: int
    feedback: str
    details: List[bool]
