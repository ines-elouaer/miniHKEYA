import random
import re
from typing import List, Dict

def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())

def build_mcq_from_story(story: str, n_questions: int = 3) -> List[Dict]:
    """
    يبني 3 أسئلة QCM بسيطة من القصة:
    - سؤال على الشخصية
    - سؤال على المكان
    - سؤال على العبرة (إذا موجودة)
    كل سؤال: question + choices(3) + correct_index
    """
    story = _clean(story)
    lines = [l.strip() for l in story.split("\n") if l.strip()]
    full = " ".join(lines)

    # استخراج العبرة
    moral = None
    for l in lines[::-1]:
        if l.startswith("العبرة"):
            moral = l.replace("العبرة:", "").strip()
            break

    # محاولة استخراج "من" (اسم) و "أين"
    # (Heuristics بسيطة، تنجم تحسنها لاحقًا أو تعتمد LLM)
    who_candidates = []
    for name in ["سارة", "أمين", "سلمى", "آدم", "الطفل", "القطة", "الأرنب", "الدب", "القرد"]:
        if name in full:
            who_candidates.append(name)
    who = who_candidates[0] if who_candidates else "الطفل"

    place = "المدرسة" if "المدرسة" in full else ("البيت" if "البيت" in full else "الحديقة")

    questions = []

    # Q1: من بطل القصة؟
    q1_correct = who
    q1_choices = list({q1_correct, "السلحفاة", "الكتاب"})  # set لإزالة التكرار
    while len(q1_choices) < 3:
        q1_choices.append(random.choice(["المعلمة", "الأصدقاء", "الأم", "الأب", "القطة"]))
        q1_choices = list(dict.fromkeys(q1_choices))
    random.shuffle(q1_choices)
    questions.append({
        "question": "من بطل القصة؟",
        "choices": q1_choices[:3],
        "correct_index": q1_choices[:3].index(q1_correct),
    })

    # Q2: أين حدثت القصة؟
    q2_correct = place
    q2_choices = list({q2_correct, "السوق", "البحر"})
    while len(q2_choices) < 3:
        q2_choices.append(random.choice(["المدرسة", "البيت", "الحديقة", "المكتبة"]))
        q2_choices = list(dict.fromkeys(q2_choices))
    random.shuffle(q2_choices)
    q2_choices = q2_choices[:3]
    if q2_correct not in q2_choices:
        q2_choices[0] = q2_correct
        random.shuffle(q2_choices)
    questions.append({
        "question": "أين حدثت القصة؟",
        "choices": q2_choices,
        "correct_index": q2_choices.index(q2_correct),
    })

    # Q3: ما العبرة؟
    if moral:
        q3_correct = moral
        distract = [
            "السرعة أهم من الفهم.",
            "السخرية تجعلنا أقوى.",
            "من الأفضل أن نكون وحدنا.",
            "الغضب يحل المشاكل.",
        ]
        q3_choices = [q3_correct] + random.sample(distract, 2)
        random.shuffle(q3_choices)
        questions.append({
            "question": "ما العبرة من القصة؟",
            "choices": q3_choices,
            "correct_index": q3_choices.index(q3_correct),
        })
    else:
        # بديل: ماذا حدث؟
        q3_correct = "حدثت مغامرة صغيرة وتعلم البطل شيئًا."
        q3_choices = [q3_correct, "لم يحدث شيء.", "تشاجر الجميع طوال اليوم."]
        random.shuffle(q3_choices)
        questions.append({
            "question": "ماذا تعلمنا من القصة؟",
            "choices": q3_choices,
            "correct_index": q3_choices.index(q3_correct),
        })

    return questions[:n_questions]
