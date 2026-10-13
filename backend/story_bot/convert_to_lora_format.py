import json
from pathlib import Path

INPUT = Path("story_bot/data/story_examples_ar_clean.jsonl")
OUTPUT = Path("lora_training/stories_lora.jsonl")

def main():
    OUTPUT.parent.mkdir(exist_ok=True)

    with open(INPUT, "r", encoding="utf-8") as f_in, \
         open(OUTPUT, "w", encoding="utf-8") as f_out:

        for line in f_in:
            obj = json.loads(line)
            prompt = f"اكتب قصة قصيرة للأطفال عن {obj['theme']}."
            completion = obj["story"]

            f_out.write(json.dumps({
                "prompt": prompt,
                "completion": completion
            }, ensure_ascii=False) + "\n")

    print("✅ Dataset LoRA prêt :", OUTPUT)

if __name__ == "__main__":
    main()
