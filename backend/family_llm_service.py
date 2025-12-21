# backend/family_llm_service.py

import json
import re
from collections import deque
import requests

# ==========================
# CONSTANTES DE LA GRILLE
# ==========================

ROWS = 7
COLS = 7

EMPTY = 0   # case blanche (on peut marcher)
WALL = 1    # mur
DANGER = 2  # case rouge (interdite)


# ==========================
# CONFIG OLLAMA
# ==========================

OLLAMA_URL = "http://localhost:11434"
# 👉 modèle rapide que tu as déjà
OLLAMA_MODEL = "qwen2.5:1.5b-instruct"


# ==========================
# BFS MAISON
# ==========================

def neighbors(grid, r, c):
    """Génère les voisins accessibles (cases 0) depuis (r, c)."""
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if (
            0 <= nr < len(grid)
            and 0 <= nc < len(grid[0])
            and grid[nr][nc] == EMPTY
        ):
            yield nr, nc


def bfs_path(grid, start, goal):
    """Renvoie un chemin [ (r,c), ... ] ou [] si impossible."""
    queue = deque([start])
    parent = {start: None}

    while queue:
        cur = queue.popleft()
        if cur == goal:
            break
        for nb in neighbors(grid, *cur):
            if nb not in parent:
                parent[nb] = cur
                queue.append(nb)

    if goal not in parent:
        return []

    path = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = parent[cur]
    path.reverse()
    return path


# ==========================
# PROMPTS
# ==========================

SYSTEM_PROMPT = """
Tu es un générateur de labyrinthes pour un jeu éducatif pour enfants.
La grille est une maison vue de dessus.
Les valeurs possibles :
- 0 = case blanche (l'enfant peut marcher)
- 1 = mur (🧱, l'enfant ne peut pas passer)
- 2 = case rouge dangereuse (🟥, l'enfant ne peut PAS marcher dessus)

Tu dois renvoyer UNIQUEMENT un JSON valide, sans texte autour.
PAS de commentaires, PAS de texte avant ou après.
"""


def build_user_prompt(difficulty: int) -> str:
    """
    On change la nature et la quantité des murs / cases rouges selon la difficulté.

    Niveau 1 : uniquement des murs (1), pas de case rouge (2).
    Niveau 2 : murs + quelques cases rouges.
    Niveau 3 : beaucoup de murs + beaucoup de cases rouges, couloirs étroits, au moins 2 cibles.
    """
    if difficulty <= 1:
        nb_murs = "entre 5 et 8 murs"
        nb_dangers = "0 case rouge (aucune case 2 dans la grille)"
        extra_rules = """
- NE METS AUCUNE case rouge (2) dans la grille pour ce niveau.
- Toutes les cases qui ne sont pas des murs doivent être des 0 (cases où l'enfant peut marcher).
"""
    elif difficulty == 2:
        nb_murs = "entre 8 et 12 murs"
        nb_dangers = "entre 3 et 5 cases rouges"
        extra_rules = """
- Ajoute quelques cases rouges (2) pour rendre le niveau plus difficile.
- Les cases rouges doivent bloquer certains chemins, mais il doit rester au moins un chemin sûr en 0.
"""
    else:
        nb_murs = "entre 12 et 16 murs"
        nb_dangers = "entre 6 et 10 cases rouges"
        extra_rules = """
- Niveau difficile : plus de murs (1) et plus de cases rouges (2).
- Crée des couloirs étroits : des chemins de largeur 1 entourés de murs ou de cases rouges.
- Le chemin le plus court entre le départ et chaque membre de la famille doit être assez long (au moins une dizaine de cases environ).
- Utilise les cases rouges pour créer des zones dangereuses qui obligent à faire des détours.
- Place au moins 2 membres de la famille dans "targets", chacun sur une case 0 différente.
"""

    return f"""
Génère un labyrinthe 7x7 pour un enfant.

Contraintes :
- La taille doit être exactement 7 lignes x 7 colonnes (7 sous-listes de 7 entiers).
- La case de départ "start" est toujours [0, 0] et doit être 0 dans la grille.
- Place {nb_murs}.
- Place {nb_dangers}.
- Les murs (1) et les cases rouges (2) ne doivent pas entourer complètement le départ.
- Place entre 1 et 3 membres de la famille dans "targets".
- Les positions des targets doivent correspondre à des cases 0 dans la grille.
{extra_rules}

Format JSON EXACT à renvoyer :

{{
  "grid": [
    [0, 0, 1, 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 2, 0],
    [0, 0, 0, 0, 0, 1, 0],
    [0, 2, 1, 1, 0, 0, 0],
    [0, 0, 0, 2, 1, 1, 0],
    [0, 1, 2, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 2, 0]
  ],
  "start": [0, 0],
  "targets": {{
    "book": {{
      "name_ar": "بوك",
      "name_fr": "ton père",
      "pos": [4, 3]
    }},
    "ommik": {{
      "name_ar": "أمّك",
      "name_fr": "ta mère",
      "pos": [2, 5]
    }}
  }}
}}

IMPORTANT :
- Ne renvoie que le JSON, sans texte avant ou après.
- Toutes les valeurs de la grille doivent être 0, 1 ou 2.
- Les positions dans "pos" doivent être dans la grille (0-6).
"""


# ==========================
# EXTRACTION ROBUSTE DU JSON
# ==========================

def extract_json(text: str) -> str:
    """
    Isole le bloc JSON {...} dans le texte renvoyé par le LLM.
    Si aucun bloc complet trouvé -> ValueError.
    """
    text = text.strip()

    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].lstrip()

    # on cherche un { ... } avec au moins une accolade fermante
    matches = re.findall(r"\{.*\}", text, flags=re.DOTALL)
    if not matches:
        raise ValueError("Aucun JSON trouvé dans la réponse du LLM")

    return matches[0]


# ==========================
# APPEL AU LLM
# ==========================

def call_ollama_for_labyrinth(difficulty: int) -> dict:
    """
    Appelle Ollama et renvoie le dict Python du JSON renvoyé par le modèle.
    """
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(difficulty)},
        ],
        "stream": False,
        "options": {
            # ⚠️ on augmente fortement num_predict pour éviter la coupure
            "num_predict": 512,
            "temperature": 0.2,
            "top_p": 0.8,
        },
    }

    resp = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    content = data["message"]["content"]

    # debug optionnel
    print("========== OLLAMA CONTENT ==========")
    print(repr(content))
    print("====================================")

    json_str = extract_json(content)
    print("========== EXTRACTED JSON ==========")
    print(json_str)
    print("====================================")

    return json.loads(json_str)


# ==========================
# VALIDATION DU LABYRINTHE
# ==========================
def validate_and_fix_labyrinth(raw: dict, difficulty: int):
    """
    Vérifie que le JSON du LLM est correct et jouable.
    - bonne taille (7x7)
    - valeurs ∈ {0,1,2}
    - start correct
    - au moins une cible valide
    - au moins UNE cible atteignable depuis start
    - difficulté influencée par :
        * le nombre de cases rouges selon difficulty
        * la longueur du chemin minimum vers une cible
        * pour la difficulté 3 : au moins 2 cibles atteignables
    Retourne (grid, start, targets) OU lève ValueError.
    """
    grid = raw.get("grid")
    start = raw.get("start")
    targets = raw.get("targets")

    # --- grid ---
    if not isinstance(grid, list) or len(grid) != ROWS:
        raise ValueError("grid invalide (pas 7 lignes)")

    for row in grid:
        if not isinstance(row, list) or len(row) != COLS:
            raise ValueError("ligne de grid invalide (pas 7 colonnes)")
        for v in row:
            if v not in (EMPTY, WALL, DANGER):
                raise ValueError(f"valeur de case invalide : {v}")

    # --- règles globales sur les cases rouges selon la difficulté ---
    danger_count = sum(1 for row in grid for v in row if v == DANGER)

    if difficulty == 1:
        # niveau 1 : pas de cases rouges → on les transforme en 0 au cas où
        if danger_count > 0:
            grid = [
                [EMPTY if v == DANGER else v for v in row]
                for row in grid
            ]
            danger_count = 0
    elif difficulty == 2:
        # niveau 2 : il doit y avoir AU MOINS quelques cases rouges
        # (on reste souple pour le petit modèle : min 2)
        if danger_count < 2:
            raise ValueError("niveau 2 : pas assez de cases rouges")
    elif difficulty >= 3:
        # niveau 3 : plus de cases rouges que le niveau 2
        # on met le seuil à 4 (ton modèle renvoie déjà 5 dans l'exemple)
        if danger_count < 4:
            raise ValueError("niveau 3 : pas assez de cases rouges")

    # --- start ---
    if (
        not isinstance(start, list)
        or len(start) != 2
        or not all(isinstance(x, int) for x in start)
    ):
        raise ValueError("start invalide")

    sr, sc = start
    if not (0 <= sr < ROWS and 0 <= sc < COLS):
        raise ValueError("start hors grille")

    # on force la case de départ à vide
    grid[sr][sc] = EMPTY

    # --- targets ---
    if not isinstance(targets, dict) or not targets:
        raise ValueError("targets vide ou invalide")

    clean_targets = {}
    for member_id, info in targets.items():
        pos = info.get("pos")
        if (
            not isinstance(pos, list)
            or len(pos) != 2
            or not all(isinstance(x, int) for x in pos)
        ):
            continue

        r, c = pos
        if not (0 <= r < ROWS and 0 <= c < COLS):
            continue

        # si la cible est sur un mur (1) ou rouge (2), on rend la case accessible
        if grid[r][c] != EMPTY:
            grid[r][c] = EMPTY

        clean_targets[member_id] = {
            "id": member_id,
            "name_ar": info.get("name_ar", ""),
            "name_fr": info.get("name_fr", ""),
            "pos": [r, c],
        }

    if not clean_targets:
        raise ValueError("aucune cible valide dans targets")

    # --- accessibilité des cibles ---
    start_tuple = (sr, sc)
    reachable = False
    best_len = None
    reachable_targets_count = 0

    for t in clean_targets.values():
        goal = tuple(t["pos"])
        path = bfs_path(grid, start_tuple, goal)
        if path:
            reachable = True
            reachable_targets_count += 1
            L = len(path)
            if best_len is None or L < best_len:
                best_len = L

    if not reachable:
        raise ValueError("aucune cible atteignable")

    # Pour le niveau 3 : au moins 2 cibles atteignables
    if difficulty >= 3 and reachable_targets_count < 2:
        raise ValueError("niveau 3 : au moins 2 cibles atteignables nécessaires")

    # --- longueur minimale des chemins selon la difficulté ---
    # (plus le niveau est élevé, plus le chemin doit être long)
    min_len_by_diff = {
        1: 3,   # petit chemin
        2: 5,   # un peu plus long
        3: 7,   # niveau 3 : plus long, mais pas trop strict
    }
    min_len = min_len_by_diff.get(difficulty, 3)

    if best_len is not None and best_len < min_len:
        raise ValueError(
            f"chemin trop court ({best_len}) pour difficulté {difficulty} (min {min_len})"
        )

    return grid, start, clean_targets

# ==========================
# FONCTION PRINCIPALE
# ==========================

def generate_labyrinth_with_llm(difficulty: int, max_tries: int = 3):
    for attempt in range(max_tries):
        try:
            print(f"[family_llm] tentative {attempt+1} pour difficulty={difficulty}")
            raw = call_ollama_for_labyrinth(difficulty)
            grid, start, targets = validate_and_fix_labyrinth(raw, difficulty)
            print("[family_llm] labyrinthe valide obtenu ✅")
            return grid, start, targets
        except Exception as e:
            print(f"[family_llm] tentative {attempt+1} KO:", e)

    raise ValueError("Impossible de générer un labyrinthe valide avec le LLM")
