from typing import List, Dict
import os
import re
import json
import requests
from datetime import datetime

from .few_shot import load_examples, pick_few_shots

# =====================================================
# CONFIG OLLAMA
# =====================================================
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL_QUALITY = os.getenv("OLLAMA_MODEL_QUALITY", "mistral-nemo:latest")
OLLAMA_TIMEOUT_QUALITY = int(os.getenv("OLLAMA_TIMEOUT_QUALITY", "240"))

# ✅ plus rapide (sans perte de qualité perceptible)
AR_TEMPERATURE = float(os.getenv("AR_TEMPERATURE", "0.35"))
AR_TOP_P = float(os.getenv("AR_TOP_P", "0.8"))

# Option: réduire la longueur de génération (accélère)
AR_NUM_PREDICT = int(os.getenv("AR_NUM_PREDICT", "220"))

# =====================================================
# DATA (few-shot examples + dataset auto)
# =====================================================
EXAMPLES = load_examples()

DATASET_PATH = os.getenv(
    "GENERATED_DATASET_PATH",
    os.path.join(os.path.dirname(__file__), "data", "generated_stories.jsonl")
)

# =====================================================
# LLM CALL
# =====================================================
def call_ollama(prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL_QUALITY,

        "prompt": prompt,
        "stream": False,
        "options": {
  "temperature": AR_TEMPERATURE,
  "top_p": AR_TOP_P,
  "num_predict": AR_NUM_PREDICT,
  "num_ctx": 1024,
}

    }
    try:
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=OLLAMA_TIMEOUT_QUALITY)
        r.raise_for_status()
        return r.json().get("response", "").strip()
    except Exception as e:
        print("[OLLAMA ERROR]", e)
        return ""

# =====================================================
# TEXT HELPERS
# =====================================================
FORBIDDEN_PATTERNS = [
    r"\bA\b", r"\bB\b",
    r"لعبة", r"اختر", r"اختيار", r"سؤال", r"؟",
    r":\s*$"
]

def normalize_lines(text: str) -> List[str]:
    text = (text or "").replace("\r\n", "\n").strip()
    return [l.strip() for l in text.split("\n") if l.strip()]

def remove_forbidden(text: str) -> str:
    lines = normalize_lines(text)
    clean = []
    for l in lines:
        if any(re.search(p, l) for p in FORBIDDEN_PATTERNS):
            continue
        clean.append(l)
    return "\n".join(clean).strip()

def tidy_story(text: str) -> str:
    lines = normalize_lines(text)
    cleaned = []
    for l in lines:
        if cleaned and cleaned[-1] == l:
            continue
        cleaned.append(l)
    return "\n".join(cleaned).strip()

def ensure_moral(text: str, level: int) -> str:
    lines = normalize_lines(text)
    body, moral = [], None

    for l in lines:
        if l.startswith("العبرة"):
            moral = l
        else:
            body.append(l)

    if moral is None:
        moral = (
            "العبرة: التعاون يجعل التعلم ممتعًا."
            if level == 1
            else "العبرة: بالاجتهاد والتفكير ننجح."
        )

    return "\n".join(body + [moral]).strip()

# =====================================================
# PROMPT (FAST + THEME-CONSISTENT)
# =====================================================
def build_ar_prompt(theme: str, level: int) -> str:
    k = 1 if level == 1 else 2
    shots = pick_few_shots(EXAMPLES, theme, level, k=k)
    shots_block = "\n".join(ex["story"] for ex in shots) if shots else ""

    if level == 1:
        story_lines = 3
        level_desc = "طفل (6-7 سنوات)"
        rules = "- جمل قصيرة.\n- كلمات سهلة."
        plan = "طفل + مكان → موقف لطيف → نهاية سعيدة."
    else:
        story_lines = 5
        level_desc = "طفل (8-10 سنوات)"
        rules = "- جمل مترابطة.\n- استخدم: ثم / لأن / لذلك."
        plan = "هدف → مشكلة → محاولة → حل → شعور."

    theme_guard = f"يجب أن تكون الأحداث مرتبطة مباشرة بموضوع: {theme}."

    return f"""
اكتب قصة قصيرة للأطفال بالعربية الفصحى البسيطة.

قواعد:
- العربية فقط.
- كل جملة في سطر.
- لا أسئلة.
- السطر الأخير يبدأ بـ: العبرة:
{theme_guard}

الموضوع: {theme}
المستوى: {level_desc}
عدد الجمل: {story_lines} + سطر العبرة

الأسلوب:
{rules}

الخطة:
{plan}

أمثلة:
{shots_block}

اكتب القصة الآن.
""".strip()

# =====================================================
# SCORE (cheap + fast)
# =====================================================
def score_story(lines: List[str], level: int) -> int:
    score = 0
    body = [l for l in lines if not l.startswith("العبرة")]
    has_moral = any(l.startswith("العبرة") for l in lines)

    if any(("ثم" in l) or ("بعد ذلك" in l) for l in body):
        score += 1
    if any(("لذلك" in l) or ("لأن" in l) for l in body):
        score += 1
    if any(("سعيد" in l) or ("فرح" in l) or ("ضحك" in l) or ("ابتسم" in l) for l in body):
        score += 1
    if has_moral:
        score += 1

    expected = 3 if level == 1 else 5
    if len(body) >= expected:
        score += 1

    return score

# =====================================================
# DATASET LOG (optional)
# =====================================================
def save_story(theme: str, level: int, story: str, score: int) -> None:
    record = {
        "theme": theme,
        "level": level,
        "story": story,
        "score": score,
        "timestamp": datetime.utcnow().isoformat()
    }
    try:
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        with open(DATASET_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        print("[DATASET SAVE ERROR]", e)

# =====================================================
# GENERATION (FAST)
# =====================================================
def generate_story_ar(theme: str, level: int) -> str:
    best_story = ""
    best_score = -1

    # ✅ réduit retries => plus rapide
    MAX_RETRIES = 2
    TARGET_SCORE = 4

    for attempt in range(MAX_RETRIES):
        prompt = build_ar_prompt(theme, level)
        out = call_ollama(prompt)
        if not out:
            continue

        out = tidy_story(ensure_moral(remove_forbidden(out), level))
        lines = normalize_lines(out)
        sc = score_story(lines, level)

        if sc > best_score:
            best_score = sc
            best_story = out

        # ✅ stop early si ok
        if sc >= TARGET_SCORE:
            break

    if not best_story:
        best_story = (
            "دخل الطفل الفصل مبتسمًا.\n"
            "جلس بجانب أصدقائه.\n"
            "بدأ الدرس بسعادة.\n"
            "العبرة: التعلم ممتع."
        )
        best_score = 0

    save_story(theme, level, best_story, best_score)

    # enforce exact length
    lines = normalize_lines(best_story)
    target = 3 if level == 1 else 5

    story_lines = []
    moral = None
    for l in lines:
        if l.startswith("العبرة"):
            moral = l
        else:
            story_lines.append(l)

    story_lines = story_lines[:target]
    while len(story_lines) < target:
        story_lines.append("شعروا بالسعادة في النهاية.")

    if moral is None:
        moral = "العبرة: التعلم يجعلنا أفضل."

    return "\n".join(story_lines + [moral])

# =====================================================
# PUBLIC API
# =====================================================
def generate_story_with_llm(theme: str, level: int) -> str:
    return generate_story_ar(theme, level)

def generate_story_with_llm_bilingual(theme: str, level: int) -> Dict[str, str]:
    return {"ar": generate_story_ar(theme, level)}
