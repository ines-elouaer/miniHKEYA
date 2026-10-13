# backend/main.py

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Header
import io
import asyncio

# ✅ STORY BOT: version AR (simple / enfant / amusant)
from story_bot.service_ar import generate_story_with_llm

from db import SessionLocal
from db_models import QuizQuestion, Story, GameLog, User

from auth.auth_utils import hash_password, verify_password, create_access_token
from auth.auth_schemas import UserCreate, UserLogin, UserOut, Token

# ===================== IMPORTS QUIZ / LABYRINTHE =====================
from quiz.labyrinth_data import grid, start, goal
from quiz.algorithms import dfs, bfs

# ===================== IMPORTS JEU "CHNOUWA SAR ?" =====================
from game.models import (
    GenerateRequest as StoryGenerateRequest,
    GenerateResponse as StoryGenerateResponse,
    MaskRequest,
    MaskResponse,
    CheckRequest as StoryCheckRequest,
    CheckResponse as StoryCheckResponse,
)

from game.service import generate_story, mask_story, check_answers

# Pool (dernière histoire LLM)
from game.llm_pool import push_story

# MCQ depuis histoire (Mission Hkeya)
from game.quiz_from_story import build_mcq_from_story
from game.models import MCQGenerateRequest, MCQGenerateResponse, MCQCheckRequest, MCQCheckResponse

# ===================== IMPORTS JEU "ROBOT MOUL L'KALMA" =====================
from game_robot.models import (
    RobotGenerateRequest,
    RobotGenerateResponse,
    RobotCheckRequest,
    RobotCheckResponse,
)
from game_robot.service import (
    generate_round as robot_generate_round,
    check_round as robot_check_round,
)

# ===================== IMPORTS LABYRINTHE FAMILLE (LLM) =====================
from family_llm_service import generate_labyrinth_with_llm, bfs_path

# ===================== (OPTIONNEL) edge-tts =====================
try:
    import edge_tts
except Exception:
    edge_tts = None


# ===================== MODELES STORY BOT =====================
class StoryBotRequest(BaseModel):
    theme: str
    level: int


class StoryBotResponse(BaseModel):
    theme: str
    level: int
    story: str


# ===================== MODELES TTS =====================
class TTSRequest(BaseModel):
    text: str
    voice: str | None = "ar-SA-HamedNeural"  # tu peux changer


# ===================== APP & CORS =====================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à restreindre en prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================== DEPENDANCE DB =====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===================== ROOT =====================
@app.get("/")
def read_root():
    return {"message": "Backend miniHKEYA OK"}


# ===================== AUTH =====================
@app.post("/api/auth/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(User)
        .filter((User.username == user.username) | (User.email == user.email))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur ou email déjà utilisé.",
        )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects.",
        )

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


# ===================== PARTIE QUIZ (depuis PostgreSQL) =====================
@app.get("/api/quiz/questions")
def api_get_quiz_questions(db: Session = Depends(get_db)):
    questions = db.query(QuizQuestion).all()
    return {
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "choices": q.choices,
                "correct_index": q.correct_index,
                "explanation": q.explanation,
            }
            for q in questions
        ]
    }


# ===================== PARTIE LABYRINTHE (DFS/BFS DEMO) =====================
@app.get("/api/labyrinth")
def get_labyrinth():
    return {"grid": grid, "start": list(start), "goal": list(goal)}


@app.get("/api/labyrinth/dfs")
def run_dfs():
    visited, path = dfs(grid, start, goal)
    visited_list = [[r, c] for (r, c) in visited]
    path_list = [[r, c] for (r, c) in path]
    return {"visited": visited_list, "path": path_list}


@app.get("/api/labyrinth/bfs")
def run_bfs():
    visited, path = bfs(grid, start, goal)
    visited_list = [[r, c] for (r, c) in visited]
    path_list = [[r, c] for (r, c) in path]
    return {"visited": visited_list, "path": path_list}


# ===================== JEU "CHNOUWA SAR ?" =====================
@app.post("/game/story/generate", response_model=StoryGenerateResponse)
def api_generate_story(req: StoryGenerateRequest, db: Session = Depends(get_db)):
    resp = generate_story(req)

    log = GameLog(
        game_name="chnouwa_generate",
        child_input=str(req),
        model_output=str(resp),
    )
    db.add(log)
    db.commit()

    return resp


@app.post("/game/story/mask", response_model=MaskResponse)
def api_mask_story(req: MaskRequest):
    return mask_story(req)


@app.post("/game/story/check", response_model=StoryCheckResponse)
def api_check_story(req: StoryCheckRequest, db: Session = Depends(get_db)):
    resp = check_answers(req)

    log = GameLog(
        game_name="chnouwa_check",
        child_input=str(req),
        model_output=str(resp),
    )
    db.add(log)
    db.commit()

    return resp


# ===================== JEU "ROBOT MOUL L'KALMA" =====================
@app.post("/game/robot/generate", response_model=RobotGenerateResponse)
def robot_generate(req: RobotGenerateRequest, db: Session = Depends(get_db)):
    resp = robot_generate_round(req)

    log = GameLog(
        game_name="robot_generate",
        child_input=str(req),
        model_output=str(resp),
    )
    db.add(log)
    db.commit()

    return resp


@app.post("/game/robot/check", response_model=RobotCheckResponse)
def robot_check(req: RobotCheckRequest, db: Session = Depends(get_db)):
    resp = robot_check_round(req)

    log = GameLog(
        game_name="robot_check",
        child_input=str(req),
        model_output=str(resp),
    )
    db.add(log)
    db.commit()

    return resp


# ===================== STORY BOT (AR SIMPLE ENFANT) =====================
@app.post("/game/story-bot/generate", response_model=StoryBotResponse)
def story_bot_generate(req: StoryBotRequest, db: Session = Depends(get_db)):
    story_text = generate_story_with_llm(req.theme, req.level)

    # ✅ stocker dans un pool (dernière histoire)
    push_story(req.theme, req.level, story_text)

    new_story = Story(
        child_theme=req.theme,
        generated_story=story_text,
    )
    db.add(new_story)

    log = GameLog(
        game_name="storybot_ar",
        child_input=f"theme={req.theme}, level={req.level}",
        model_output=story_text,
    )
    db.add(log)

    db.commit()
    db.refresh(new_story)

    return StoryBotResponse(theme=req.theme, level=req.level, story=story_text)


@app.get("/game/story-bot/last")
def get_last_story(db: Session = Depends(get_db)):
    try:
        last = db.query(Story).order_by(Story.id.desc()).first()
    except Exception:
        # fallback si id n'est pas sortable
        all_stories = db.query(Story).all()
        last = all_stories[-1] if all_stories else None

    if not last:
        raise HTTPException(status_code=404, detail="Aucune histoire trouvée")

    return {
        "theme": getattr(last, "child_theme", "famille"),
        "level": 1,
        "story": last.generated_story,
    }


# ===================== TTS (mp3) =====================
@app.post("/tts")
async def tts(req: TTSRequest):
    """
    Retourne un MP3 en audio/mpeg
    Nécessite: pip install edge-tts
    """
    if edge_tts is None:
        raise HTTPException(
            status_code=500,
            detail="edge-tts n'est pas installé. Fais: python -m pip install edge-tts",
        )

    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Texte vide.")

    voice = req.voice or "ar-SA-HamedNeural"

    communicate = edge_tts.Communicate(text=text, voice=voice)

    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])

    buf.seek(0)
    return StreamingResponse(buf, media_type="audio/mpeg")


# ===================== MCQ Mission Hkeya =====================
@app.post("/game/mission-hkeya/mcq", response_model=MCQGenerateResponse)
def generate_mcq(req: MCQGenerateRequest):
    qs = build_mcq_from_story(req.story, n_questions=3)
    return {"questions": qs}


@app.post("/game/mission-hkeya/mcq/check", response_model=MCQCheckResponse)
def check_mcq(req: MCQCheckRequest):
    questions = req.questions
    answers = req.answers

    max_score = len(questions)
    score = 0
    details = []

    for i, q in enumerate(questions):
        chosen = answers[i] if i < len(answers) else -1
        ok = (chosen == q.correct_index)
        details.append(ok)
        if ok:
            score += 1

    if score == max_score:
        feedback = "ممتاز! 🔥"
    elif score == 0:
        feedback = "جرّب مرة أخرى 😊"
    else:
        feedback = f"باهي! نتيجتك {score}/{max_score}"

    return {
        "score": score,
        "max_score": max_score,
        "feedback": feedback,
        "details": details,
    }


# ===================== JEU "CHERCHE LA FAMILLE" (100% LLM) =====================
CURRENT_FAMILY_GRID = None
CURRENT_FAMILY_START = None
CURRENT_FAMILY_TARGETS = None


@app.get("/api/family-labyrinth")
def api_family_labyrinth(difficulty: int = 1):
    global CURRENT_FAMILY_GRID, CURRENT_FAMILY_START, CURRENT_FAMILY_TARGETS

    if difficulty not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="La difficulté doit être 1, 2 ou 3.")

    try:
        grid2, start2, targets2 = generate_labyrinth_with_llm(difficulty)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    CURRENT_FAMILY_GRID = grid2
    CURRENT_FAMILY_START = start2
    CURRENT_FAMILY_TARGETS = targets2

    return {
        "grid": grid2,
        "start": start2,
        "targets": targets2,
        "difficulty": difficulty,
        "maxDifficulty": 3,
    }


@app.get("/api/family-labyrinth/path")
def api_family_path(member_id: str, algo: str = "bfs"):
    if (
        CURRENT_FAMILY_GRID is None
        or CURRENT_FAMILY_START is None
        or CURRENT_FAMILY_TARGETS is None
    ):
        raise HTTPException(status_code=400, detail="Labyrinthe non initialisé")

    if member_id not in CURRENT_FAMILY_TARGETS:
        raise HTTPException(status_code=404, detail="Membre inconnu")

    grid2 = CURRENT_FAMILY_GRID
    start2 = tuple(CURRENT_FAMILY_START)
    goal2 = tuple(CURRENT_FAMILY_TARGETS[member_id]["pos"])

    try:
        path = bfs_path(grid2, start2, goal2)
    except Exception:
        raise HTTPException(status_code=500, detail="Erreur BFS")

    if not path:
        raise HTTPException(status_code=400, detail="Pas de chemin trouvé")

    path_list = [[r, c] for (r, c) in path]
    visited_list = path_list

    return {"visited": visited_list, "path": path_list}
@app.get("/health")
def health():
    return {"status": "ok"}
