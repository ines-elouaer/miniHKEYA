# backend/seed_quiz.py
from db import SessionLocal
from db_models import QuizQuestion
from quiz.quiz_data import quiz_questions

def main():
    db = SessionLocal()
    try:
        for q in quiz_questions:
            question = QuizQuestion(
                question=q["question"],
                choices=q["choices"],
                correct_index=q["correct_index"],
                explanation=q["explanation"],
            )
            db.add(question)
        db.commit()
        print("✅ Questions de quiz insérées en base")
    finally:
        db.close()

if __name__ == "__main__":
    main()
