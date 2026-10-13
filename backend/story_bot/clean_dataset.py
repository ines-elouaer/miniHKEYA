import json
import re
from pathlib import Path

INPUT_PATH = Path("story_bot/data/story_examples_ar.jsonl")
OUTPUT_PATH = Path("story_bot/data/story_examples_ar_clean.jsonl")

def clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace(" .", ".").replace(" ،", "،")
    return text

def normalize_story(story: str) -> str:
    lines = [clean_text(l) for l in story.split("\n") if l.strip()]
    
    # garder max 5 lignes + morale
    body = []
    moral = None

    for l in lines:
        if l.startswith("العبرة"):
            moral = l
        else:
            body.append(l)

    body = body[:5]

    if moral is None:
        moral = "العبرة: التعلم يجعلنا أفضل."

    return "\n".join(body + [moral])

def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(INPUT_PATH, "r", encoding="utf-8") as f_in, \
         open(OUTPUT_PATH, "w", encoding="utf-8") as f_out:

        for line in f_in:
            obj = json.loads(line)
            obj["story"] = normalize_story(obj["story"])
            f_out.write(json.dumps(obj, ensure_ascii=False) + "\n")

    print("✅ Dataset nettoyé :", OUTPUT_PATH)

if __name__ == "__main__":
    main()
