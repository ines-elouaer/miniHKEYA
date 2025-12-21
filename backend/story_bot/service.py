# backend/story_bot/service.py

from typing import Optional, List, Dict, Any
import json
import os
import requests

# ================== CONFIG OLLAMA ==================

# URL du serveur Ollama local
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# Nom du modèle utilisé (par défaut : Qwen 2.5 7B Instruct)
# Tu peux le surcharger via une variable d'environnement OLLAMA_MODEL
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")


# ================== DICTIONNAIRES DE REMPLACEMENT ==================

# Remplacements FR -> tounsi pour corriger des bouts de FR qui restent
REPLACEMENTS = {
    # personnages
    "Amin": "أمين",
    "Amina": "أمينة",

    # temps / structure
    "Il était une fois": "نهار من نهارات",
    "il était une fois": "نهار من نهارات",
    "un jour": "نهار من نهارات",

    # école
    "école": "المدرسة",
    "la maîtresse": "المعلّمة",
    "le maître": "المعلّم",
    "ses camarades": "صحابو",
    "ses amis": "صحابو",

    # émotions
    "il a un peu peur": "كان خايف شوية",
    "il avait peur": "كان خايف",
    "il est content": "كان فرحان",
    "il était content": "كان فرحان",
    "il est triste": "كان متغشِشْ",
    "il était triste": "كان متغشِشْ",

    # famille
    "ses parents": "أموُ و بوه ",
    "sa maman": "أموُ",
    "sa mère": "أموُ",
    "son père": "بوه",

    # fin / morale
    "À la fin de la journée": "في آخر النهار",
    "à la fin de la journée": "في آخر النهار",
    "il a passé un beau jour": "عدّى نهار مزيان برشا",
    "il a appris beaucoup de choses": "تعلّم برشا حاجات",
}

# 💡 Petit vocabulaire "guidé" pour les histoires en français
SIMPLE_FR_VOCAB_HINT = """
Utilise de préférence ce type de mots simples :

- Personnages : enfant, petit garçon, petite fille, ami, amie, papa, maman, maîtresse, maître.
- Lieux : maison, école, classe, cour de récréation, jardin, parc, rue.
- Objets : cartable, sac, cahier, stylo, gomme, ballon, jouet, livre.
- Actions : se réveiller, aller à l'école, jouer, courir, aider, partager, donner, recevoir, apprendre.
- Temps : le matin, l'après-midi, le soir, aujourd'hui, demain, un jour.
- Émotions : content, heureux, triste, fâché, inquiet, fier.
- Valeurs : amitié, respect, partage, courage, honnêteté, patience.
"""

# Remplacements FR -> FR pour simplifier le texte de Qwen
REPLACEMENTS_FR = {
    # synonymes compliqués -> mots simples
    "magnifique": "très beau",
    "splendide": "très beau",
    "merveilleux": "très beau",
    "extraordinaire": "très spécial",
    "embouteillage": "beaucoup de voitures dans la rue",
    "stressé": "un peu inquiet",
    "nerveux": "un peu inquiet",
    "inquiet": "un peu inquiet",
    "heureux": "content",
    "joyeux": "content",
    "furieux": "très fâché",

    # connecteurs lourds
    "cependant": "mais",
    "toutefois": "mais",
    "pourtant": "mais",
}


# ================== FONCTION GENERIQUE D'APPEL OLLAMA ==================


def call_ollama(prompt: str) -> str:
    """
    Appelle le modèle Ollama avec un prompt donné
    et renvoie le texte généré.
    Si quelque chose se passe mal, renvoie une chaîne vide.
    """
    url = f"{OLLAMA_URL}/api/generate"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.4,  # texte plus stable, moins de délire
            "top_p": 0.9,
        },
    }

    try:
        resp = requests.post(url, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "").strip()
    except Exception as e:
        print(f"[ERROR] Appel Ollama échoué: {e}")
        return ""


# ================== ETAPE 1 : GENERATION EN FRANÇAIS ==================


def build_french_prompt(theme: str, level: int) -> str:
    """
    Construit un prompt pour demander au modèle
    d'écrire une histoire en FRANÇAIS TRÈS SIMPLE,
    avec un vocabulaire compatible avec le modèle de traduction FR->Tounsi.
    """
    if level == 1:
        niveau_desc = "Niveau 1 = enfants de 6-7 ans. Phrases très simples, vocabulaire de base."
        longueur = "1 à 2 phrases, un seul petit paragraphe."
    else:
        niveau_desc = "Niveau 2 = enfants de 8-10 ans. Phrases un peu plus longues, mais toujours simples."
        longueur = "2 à 2 phrases, 1 ou 2 petits paragraphes."

    prompt = f"""
Tu es un auteur d'histoires pour enfants.

OBJECTIF :
- Écrire une courte histoire en FRANÇAIS TRÈS SIMPLE.
- L'histoire sera ensuite traduite automatiquement en dialecte tunisien.
- Donc elle doit utiliser un vocabulaire simple et des phrases faciles.

CONTRAINTES GÉNÉRALES :
- {niveau_desc}
- {longueur}
- Structure claire :
  1. Début : présenter l'enfant et le contexte.
  2. Petit problème ou événement.
  3. Solution + petite morale positive à la fin.
- Pas de violence, pas de sujets adultes.
- Utilise seulement des temps simples (présent, passé composé, imparfait simple).
- Une phrase par ligne.
- Chaque phrase doit faire AU MAXIMUM 15 mots.
- Évite les synonymes compliqués ou littéraires.
- Ne crée pas de dialogues compliqués.

VOCABULAIRE CONSEILLÉ (exemples) :
{SIMPLE_FR_VOCAB_HINT}

NOUVELLE HISTOIRE :
- Thème : "{theme}"
- Niveau : {level}

FORMAT DE RÉPONSE :
- Une phrase par ligne.
- Pas de numéros, pas de tirets, pas de guillemets.
- Ne mets pas de commentaires, seulement le texte de l'histoire.

IMPORTANT :
- Utilise seulement du français simple.
- Réponds UNIQUEMENT avec l'histoire, pas d'explications autour.
"""
    return prompt


def simplify_french_story(story_fr: str) -> str:
    """
    Simplifie légèrement le texte français généré par Qwen :
    - applique quelques remplacements de synonymes compliqués
    - normalise les espaces
    - supprime les lignes vides
    - s'assure que chaque phrase finit par un signe de ponctuation
    """
    text = story_fr

    # Remplacements lexicaux FR -> FR
    for src, tgt in REPLACEMENTS_FR.items():
        text = text.replace(src, tgt)
        # version avec majuscule
        text = text.replace(src.capitalize(), tgt)

    # Normalisation basique : lignes propres
    lines = [l.strip() for l in text.split("\n")]
    lines = [l for l in lines if l]  # garder seulement non vides

    cleaned_lines = []
    for l in lines:
        if not l:
            continue
        # ajouter un point si pas de ponctuation finale
        if not l.endswith((".", "!", "?")):
            l = l + "."
        cleaned_lines.append(l)

    return "\n".join(cleaned_lines).strip()


def generate_story_fr(theme: str, level: int) -> str:
    """
    Demande au modèle une histoire en français simple.
    Fournit une histoire de secours si l'appel échoue.
    On simplifie ensuite légèrement le texte pour coller au traducteur FR->Tounsi.
    """
    prompt = build_french_prompt(theme, level)
    story_fr = call_ollama(prompt)

    if not story_fr.strip():
        # Fallback simple si le modèle ne répond pas
        story_fr = (
            "Amin se réveille, c'est son premier jour d'école.\n"
            "Il a un peu peur mais il est aussi content.\n"
            "À la fin de la journée, il dit à ses parents qu'il a passé un beau jour "
            "et qu'il a appris beaucoup de choses."
        )

    # 🔹 On simplifie / normalise le texte FR avant la traduction
    story_fr = simplify_french_story(story_fr)
    return story_fr.strip()


# ================== ETAPE 2 : TRADUCTION FR -> TUNISIEN (LLM OLLAMA) ==================


def build_tunisian_translation_prompt(story_fr: str, level: int) -> str:
    """
    Construit un prompt demandant au modèle de TRADUIRE
    le texte français en arabe dialectal tunisien (dérja tounsi).
    On donne 1–2 petits exemples pour guider le style.
    """

    level_desc = (
        "استعمل جمل قصيرة وبسيطة، مفهومة لطفل عمره 6–7 سنين."
        if level == 1
        else "تنجم تستعمل جمل شويّة أطول، أما تبقى بسيطة ومفهومة لطفل 8–10 سنين."
    )

    prompt = f"""
أنت مترجم محترف من الفرنسية إلى العربية الدارجة التونسية (دَرجة تونسية) لصالح قصص أطفال.

مثال 1:
النص بالفرنسية:
"Il était une fois un enfant qui aimait beaucoup sa famille."
النسخة بالدارجة التونسية للأطفال:
"نهار من نهارات، كان فمّة طفل صغير يحب برشا عايلتو."

مثال 2:
النص بالفرنسية:
"Sa maman lui dit : ne t'inquiète pas, on va trouver une solution ensemble."
النسخة بالدارجة التونسية للأطفال:
"مّو قالتلو: ما تخافش، باش نلقاو حل مع بعضنا."

الآن، ترجم النص التالي إلى الدارجة التونسية للأطفال.
حافظ على نفس معنى القصة ونفس ترتيب الأحداث، لكن استعمل تعابير تونسية بسيطة.
{level_desc}

النص بالفرنسية لترجمته:
\"\"\"{story_fr.strip()}\"\"\"


تعليمات مهمة:
- استعمل حروف عربية فقط، بدون كتابة بالحروف اللاتينية.
- ما تستعملش العربية الفصحى، استعمل الدارجة التونسية فقط.
- ينجم يكون فما شوية كلمات فرنسية عاديين كيما: "école", "bus", "cartable" إذا لازم.
- خلي الأسلوب دافي وبسيط، وكأنك تحكي لطفل صغير.
- جاوب فقط بالنص المترجَم، بدون أي تفسير أو تعليق زائد.
"""
    return prompt


def translate_story_fr_to_tunisian(story_fr: str, level: int) -> str:
    """
    Utilise Ollama comme traducteur FR -> Tounsi.
    Ensuite applique quelques remplacements et ajoute une morale si absente.
    """
    prompt = build_tunisian_translation_prompt(story_fr, level)
    story_tn = call_ollama(prompt)

    if not story_tn.strip():
        story_tn = (
            "نهار من نهارات، كان فمّة طفل صغير يحب برشا عايلتو وصحابو. "
            "في نهار صارلو موقف صغير، تعلّم منّو كيفاش يكون صبور ويحترم الناس اللي يحبّوه.\n"
            "العبرة: ديما نتعلّموا من الحكايات و نولّيو أحسن شوية شوية."
        )
    else:
        text = story_tn.strip()

        # 🔹 1) On applique les remplacements FR -> tounsi
        text = apply_replacements(text)

        # 🔹 2) On s'assure qu'il y a une morale
        if "العبرة" not in text:
            text += "\nالعبرة: ديما نتعلّموا من الحكايات و نولّيو أحسن شوية شوية."

        story_tn = text

    return story_tn


# ================== FONCTIONS PRINCIPALES APPELEES PAR main.py ==================


def generate_story_with_llm(theme: str, level: int) -> str:
    """
    Pipeline complet :
    1) Générer une histoire en FRANÇAIS SIMPLE avec le LLM (Ollama)
    2) Traduire cette histoire en TUNISIEN (dérja) avec un second appel LLM
    Retourne seulement la version tunisienne.
    """
    story_fr = generate_story_fr(theme, level)
    story_tn = translate_story_fr_to_tunisian(story_fr, level)
    return story_tn


def generate_story_with_llm_bilingual(theme: str, level: int) -> Dict[str, str]:
    """
    Même pipeline, mais retourne l'histoire en FRANÇAIS et en TUNISIEN.
    """
    story_fr = generate_story_fr(theme, level)
    story_tn = translate_story_fr_to_tunisian(story_fr, level)

    return {
        "fr": story_fr,
        "tn": story_tn,
    }


def apply_replacements(text: str) -> str:
    """
    Applique les remplacements FR -> tounsi sur un texte déjà en arabe/tounsi,
    pour corriger certains bouts qui restent en français.
    """
    t = text
    for fr, tn in REPLACEMENTS.items():
        t = t.replace(fr, tn)
    return t


# ================== TEST LOCAL DANS LE TERMINAL ==================

if __name__ == "__main__":
    # Petit test local dans le terminal
    theme = "l'amitié à l'école"
    level = 1  # ou 2

    stories = generate_story_with_llm_bilingual(theme, level)

    print("\n================ HISTOIRE EN FRANÇAIS ================")
    print(stories["fr"])

    print("\n================ HISTOIRE EN TUNISIEN ================")
    print(stories["tn"])
