# backend/main.py

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from story_bot.service import generate_story_with_llm
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


# ===================== MODELES STORY BOT =====================

class StoryBotRequest(BaseModel):
    theme: str
    level: int


class StoryBotResponse(BaseModel):
    theme: str
    level: int
    story: str


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
    user = (
        db.query(User)
        .filter(User.username == credentials.username)
        .first()
    )

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
    return {
        "grid": grid,
        "start": list(start),
        "goal": list(goal),
    }


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
def api_generate_story(
    req: StoryGenerateRequest,
    db: Session = Depends(get_db),
):
    resp = generate_story(req)

    child_input = str(req)
    model_output = str(resp)

    log = GameLog(
        game_name="chnouwa_generate",
        child_input=child_input,
        model_output=model_output,
    )
    db.add(log)
    db.commit()

    return resp


@app.post("/game/story/mask", response_model=MaskResponse)
def api_mask_story(req: MaskRequest):
    return mask_story(req)


@app.post("/game/story/check", response_model=StoryCheckResponse)
def api_check_story(
    req: StoryCheckRequest,
    db: Session = Depends(get_db),
):
    resp = check_answers(req)

    child_input = str(req)
    model_output = str(resp)

    log = GameLog(
        game_name="chnouwa_check",
        child_input=child_input,
        model_output=model_output,
    )
    db.add(log)
    db.commit()

    return resp


# ===================== JEU "ROBOT MOUL L'KALMA" =====================

@app.post("/game/robot/generate", response_model=RobotGenerateResponse)
def robot_generate(
    req: RobotGenerateRequest,
    db: Session = Depends(get_db),
):
    resp = robot_generate_round(req)

    child_input = str(req)
    model_output = str(resp)

    log = GameLog(
        game_name="robot_generate",
        child_input=child_input,
        model_output=model_output,
    )
    db.add(log)
    db.commit()

    return resp


@app.post("/game/robot/check", response_model=RobotCheckResponse)
def robot_check(
    req: RobotCheckRequest,
    db: Session = Depends(get_db),
):
    resp = robot_check_round(req)

    child_input = str(req)
    model_output = str(resp)

    log = GameLog(
        game_name="robot_check",
        child_input=child_input,
        model_output=model_output,
    )
    db.add(log)
    db.commit()

    return resp


# ===================== STORY BOT =====================

@app.post("/game/story-bot/generate", response_model=StoryBotResponse)
def story_bot_generate(
    req: StoryBotRequest,
    db: Session = Depends(get_db),
):
    story_text = generate_story_with_llm(req.theme, req.level)

    new_story = Story(
        child_theme=req.theme,
        generated_story=story_text,
    )
    db.add(new_story)

    log = GameLog(
        game_name="storybot",
        child_input=f"theme={req.theme}, level={req.level}",
        model_output=story_text,
    )
    db.add(log)

    db.commit()
    db.refresh(new_story)

    return StoryBotResponse(
        theme=req.theme,
        level=req.level,
        story=story_text,
    )


# ===================== JEU "CHERCHE LA FAMILLE" (100% LLM) =====================


# ===================== JEU "CHERCHE LA FAMILLE" (100% LLM) =====================

CURRENT_FAMILY_GRID = None
CURRENT_FAMILY_START = None
CURRENT_FAMILY_TARGETS = None

@app.get("/api/family-labyrinth")
def api_family_labyrinth(difficulty: int = 1):
    global CURRENT_FAMILY_GRID, CURRENT_FAMILY_START, CURRENT_FAMILY_TARGETS

    if difficulty not in (1, 2, 3):
        raise HTTPException(
            status_code=400,
            detail="La difficulté doit être 1, 2 ou 3."
        )

    print(f"[family] génération labyrinthe pour difficulty={difficulty}")

    try:
        grid, start, targets = generate_labyrinth_with_llm(difficulty)
    except Exception as e:
        print("[family] erreur LLM :", e)
        raise HTTPException(status_code=500, detail=str(e))

    CURRENT_FAMILY_GRID = grid
    CURRENT_FAMILY_START = start
    CURRENT_FAMILY_TARGETS = targets

    return {
        "grid": grid,
        "start": start,
        "targets": targets,
        "difficulty": difficulty,
        "maxDifficulty": 3,  # <--- pratique pour le front
    }



@app.get("/api/family-labyrinth/path")
def api_family_path(member_id: str, algo: str = "bfs"):
    """
    Calcule un chemin vers le membre demandé sur
    le DERNIER labyrinthe généré par le LLM.
    """
    if (
        CURRENT_FAMILY_GRID is None
        or CURRENT_FAMILY_START is None
        or CURRENT_FAMILY_TARGETS is None
    ):
        raise HTTPException(status_code=400, detail="Labyrinthe non initialisé")

    if member_id not in CURRENT_FAMILY_TARGETS:
        raise HTTPException(status_code=404, detail="Membre inconnu")

    grid = CURRENT_FAMILY_GRID
    start = tuple(CURRENT_FAMILY_START)
    goal = tuple(CURRENT_FAMILY_TARGETS[member_id]["pos"])

    try:
        # pour l’instant on n’utilise que BFS
        path = bfs_path(grid, start, goal)
    except Exception as e:
        print("[family] erreur bfs_path :", e)
        raise HTTPException(status_code=500, detail="Erreur BFS")

    if not path:
        raise HTTPException(status_code=400, detail="Pas de chemin trouvé")

    path_list = [[r, c] for (r, c) in path]
    visited_list = path_list  # tu pourras différencier plus tard

    return {
        "visited": visited_list,
        "path": path_list,
    }
