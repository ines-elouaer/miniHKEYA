# backend/create_tables.py

from db import Base, engine
import db_models  # important : pour que User, QuizQuestion, Story, GameLog soient chargés

def create_all_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_all_tables()
    print("✅ Tables créées")
