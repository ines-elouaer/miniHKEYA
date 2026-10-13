import os
import re
import torch
from transformers import M2M100Tokenizer, M2M100ForConditionalGeneration

# ===== 1) Construire un chemin ABSOLU vers le dossier models/ =====
# Ce fichier est : backend/story_bot/translator_m2m100.py
# Donc backend = parent du dossier story_bot
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# dossier par défaut : backend/models/fr_tn_m2m100_tunisien_v3
DEFAULT_MODEL_DIR = os.path.join(BACKEND_DIR, "models", "fr_tn_m2m100_tunisien_v3")

# Permet de surcharger via variable d'environnement
MODEL_DIR = os.getenv("TN_MODEL_DIR", DEFAULT_MODEL_DIR)

print("✅ [translator_m2m100] MODEL_DIR =", MODEL_DIR)
print("✅ exists ?", os.path.exists(MODEL_DIR))

# ===== 2) Charger une seule fois =====
tokenizer = M2M100Tokenizer.from_pretrained(MODEL_DIR, local_files_only=True)
model = M2M100ForConditionalGeneration.from_pretrained(MODEL_DIR, local_files_only=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()


def _clean_tags(text: str) -> str:
    # supprime __ar__, --ar--, <tn>, etc.
    t = re.sub(r"__\w+__", "", text)
    t = re.sub(r"--\w+--", "", t)
    t = t.replace("<tn>", "").replace("</tn>", "")
    t = re.sub(r"\s+", " ", t).strip()
    return t


@torch.no_grad()
def translate_fr_to_tn(text_fr: str) -> str:
    if not text_fr or not text_fr.strip():
        return ""

    tokenizer.src_lang = "fr"

    encoded = tokenizer(
        text_fr,
        return_tensors="pt",
        truncation=True,
        max_length=256
    ).to(device)

    generated = model.generate(
        **encoded,
        forced_bos_token_id=tokenizer.get_lang_id("ar"),
        max_new_tokens=256,
        num_beams=5,
        length_penalty=1.0,
        no_repeat_ngram_size=3,
    )

    out = tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
    return _clean_tags(out)
