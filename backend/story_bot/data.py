# backend/story_bot/data.py

# On définit quelques histoires par défaut pour tester
# Tu pourras en ajouter autant que tu veux

STORIES = {
    # level 1
    (1, "plage"): """
نهار من النهارات، أمين و أختو سارة مشاو للبحر في حمّامات.
الشمس كانت تضحك، و الموج يلعب معاهم.
أمين بنا قلعة كبيرة بالرملة، و سارة زينتها بالصدف.
في الآخر، جا موجة كبيرة شوية و هزّ نص القلعة...
ضحكوا و قالوا: موش مشكل، غدوة نعملو وحدة أكبر!
""",

    (1, "ecole"): """
اليوم الأول في المدرسة كان شويّة يخوّف بالنسبة ليوسف.
دخل للقسم و شاف برشا صغار ما يعرفهمش.
المعلّمة ضحكتلو و قالتلو: "مرحبا بيك يوسف!"
في العشية، خرج فرحان خاتر تعرّف على صاحب جديد اسمو آدم.
""",

    # level 2
    (2, "plage"): """
في عطلة الصيف، خديجة و هادي مشاو للبحر مع عايلتهم.
جابو معاهم كرة، و لعبو ماتش كبير فوق الرملة.
فجأة، كرة طاحت في الماء و بدات تبعد شوية شوية.
هادي جرى و طاح شويّة فالماء، أما شدّ الكرة و رجع يضحك.
""",

    (2, "ecole"): """
في المدرسة، حسام كان ديما يحب يجاوب في القسم.
نهار من النهارات، جا المعلّم بسؤال صعيب شوية.
حسام رفع يدو و جرّب يجاوب، حتى كان موش كامل صحيح.
المعلّم شجّعو و قالو: "المهم تحاول، و المرّة الجاية تكون أحسن!"
""",

    # histoire par défaut pour tout niveau / thème
    ("default", "default"): """
هاذي حكاية صغيرة على طفل/طفلة يحب يتعلّم كلمات جديدة بالتونسي.
كل نهار يلعب في miniHKEYA، يتعلّم حاجة جديدة و يضحك و يتفرهد.
أهم حاجة إنو ما يخافش يغلط، خاتر بالغلط نتعلّمو.
"""
}


def get_story(theme: str, level: int) -> str | None:
    """
    Retourne une histoire en fonction du thème et du niveau.
    Si rien ne correspond, retourne une histoire par défaut.
    """
    theme_lower = theme.lower()

    # On essaie de détecter un thème simple
    if "plage" in theme_lower or "mer" in theme_lower:
        key_theme = "plage"
    elif "école" in theme_lower or "ecole" in theme_lower:
        key_theme = "ecole"
    else:
        key_theme = "default"

    # On cherche d'abord une histoire spécifique (level, theme)
    story = STORIES.get((level, key_theme))

    # Sinon, on prend la par défaut
    if story is None:
        story = STORIES.get(("default", "default"))

    return story
