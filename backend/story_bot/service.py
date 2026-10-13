# backend/story_bot/service.py
from typing import Dict, List
import os
import re
import requests

from .translator_m2m100 import translate_fr_to_tn

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")


def call_ollama(prompt: str) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2, "top_p": 0.9},
    }
    try:
        r = requests.post(url, json=payload, timeout=120)
        r.raise_for_status()
        return r.json().get("response", "").strip()
    except Exception as e:
        print("[ERROR] Ollama:", e)
        return ""


def normalize_lines(text: str) -> List[str]:
    text = (text or "").replace("\r\n", "\n")
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    cleaned = []
    for l in lines:
        l = re.sub(r"^\s*(?:[-*]|\d+[.)])\s+", "", l).strip()
        if l:
            cleaned.append(l)
    return cleaned


def build_french_prompt(theme: str, level: int) -> str:
    if level == 1:
        n_sent, max_words = 4, 10
        level_desc = "6-7 ans"
    else:
        n_sent, max_words = 6, 12
        level_desc = "8-10 ans"

    return f"""
Tu écris une histoire POUR ENFANTS en FRANÇAIS TRÈS SIMPLE.

RÈGLES :
- Thème: {theme}
- Niveau: {level_desc}
- EXACTEMENT {n_sent} phrases.
- Une phrase par ligne.
- Chaque phrase ≤ {max_words} mots.
- Histoire logique: début -> événement -> solution -> morale.
- Pas de dialogues. Pas de mots compliqués.

Réponds فقط بالـ {n_sent} phrases, une par ligne.
""".strip()


def generate_story_fr(theme: str, level: int) -> str:
    out = call_ollama(build_french_prompt(theme, level))
    lines = normalize_lines(out)

    target = 4 if level == 1 else 6
    lines = lines[:target]
    while len(lines) < target:
        lines.append("Il est content.")

    # ponctuation
    fixed = []
    for l in lines:
        if not l.endswith((".", "!", "?")):
            l += "."
        fixed.append(l)
    return "\n".join(fixed)


# تونسيفيكاسيون صغيرة (باش نبدلو كلمات فصحى شائعة)
TN_REPL = {
    "يستيقظ": "يفيق",
    "يذهب": "يمشي",
    "تذهب": "تمشي",
    "الأصدقاء": "الصحاب",
    "أصدقاؤه": "صحابو",
    "أصدقائها": "صحابها",
    "سعيدة": "فرحانة",
    "للمرة الأولى": "أول مرة",
    "الوجبة الخفيفة": "اللمجة",
    "وجبة خفيفة": "لمجة",
    "النافذة": "الشباك",
    "الحافلة": "الكار",
    "حافلة": "كار",
    "ثم": "وبعد",
    "لكن": "أما",
    "ولكن": "أما",
}

BAD_HINTS = [
    "إلى", "سوف", "سعيدة", "يستيقظ", "يذهب", "الأم", "الأب", "الكتابة", "المتعة"
]


def tunisify(text: str) -> str:
    t = re.sub(r"\s+", " ", (text or "")).strip()
    for k, v in TN_REPL.items():
        t = t.replace(k, v)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def looks_msa(text: str) -> bool:
    t = text or ""
    return any(w in t for w in BAD_HINTS)


def rewrite_whole_story_to_darja(story_ar: str) -> str:
    prompt = f"""
حوّل النص هذا إلى دارجة تونسية 100% (مش فصحى).
- خليه مفهوم لطفل.
- حافظ على نفس المعنى.
- خليه جمل قصيرة.
- ما تكتبش Tags كيما __ar__ أو --ar--.
- جاوب بالنص فقط.

النص:
{story_ar}
""".strip()
    out = call_ollama(prompt).strip()
    return out if out else story_ar


def translate_story_fr_to_tn(story_fr: str) -> str:
    fr_lines = normalize_lines(story_fr)
    ar_lines = [tunisify(translate_fr_to_tn(l)) for l in fr_lines]
    story = "\n".join(ar_lines).strip()

    # ✅ إذا فيه فصحى واضحة: نصلح القصة كاملة مرة وحدة (أفضل من line-by-line)
    if looks_msa(story):
        story = rewrite_whole_story_to_darja(story)
        story = tunisify(story)

    if "العبرة" not in story:
        story += "\nالعبرة: ديما نتعلّموا من الحكايات و نولّيو أحسن شوية شوية."
    return story


def generate_story_with_llm(theme: str, level: int) -> str:
    story_fr = generate_story_fr(theme, level)
    return translate_story_fr_to_tn(story_fr)


def generate_story_with_llm_bilingual(theme: str, level: int) -> Dict[str, str]:
    story_fr = generate_story_fr(theme, level)
    story_tn = translate_story_fr_to_tn(story_fr)
    return {"fr": story_fr, "tn": story_tn}
