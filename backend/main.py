# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ===================== QUIZ / LABYRINTHE =====================

from quiz.quiz_data import quiz_questions
from quiz.labyrinth_data import grid, start, goal
from quiz.algorithms import dfs, bfs

# ===================== JEU "CHNOUWA SAR ?" =====================

from game.models import (
    GenerateRequest as StoryGenerateRequest,
    GenerateResponse as StoryGenerateResponse,
    MaskRequest,
    MaskResponse,
    CheckRequest as StoryCheckRequest,
    CheckResponse as StoryCheckResponse,
)
from game.service import generate_story, mask_story, check_answers

# ===================== JEU "ROBOT MOUL L'KALMA" =====================

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

# =============================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== ROOT =====================

@app.get("/")
def read_root():
    return {"message": "Backend miniHKEYA OK"}

# ===================== PARTIE QUIZ =====================

@app.get("/api/quiz/questions")
def get_quiz_questions():
    return {"questions": quiz_questions}

# ===================== PARTIE LABYRINTHE =====================

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
def api_generate_story(req: StoryGenerateRequest):
    return generate_story(req)


@app.post("/game/story/mask", response_model=MaskResponse)
def api_mask_story(req: MaskRequest):
    return mask_story(req)


@app.post("/game/story/check", response_model=StoryCheckResponse)
def api_check_story(req: StoryCheckRequest):
    return check_answers(req)

# ===================== JEU "ROBOT MOUL L'KALMA" =====================

@app.post("/game/robot/generate", response_model=RobotGenerateResponse)
def robot_generate(req: RobotGenerateRequest):
    return robot_generate_round(req)


@app.post("/game/robot/check", response_model=RobotCheckResponse)
def robot_check(req: RobotCheckRequest):
    return robot_check_round(req)
