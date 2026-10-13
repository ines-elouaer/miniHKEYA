from sqlalchemy import Column, Integer, String, Text, ARRAY, TIMESTAMP,DateTime, func
from db import Base
from datetime import datetime
class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    choices = Column(ARRAY(Text), nullable=False)
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    child_theme = Column(Text, nullable=False)
    # ❌ plus de niveau ici, pour coller à la DB
    generated_story = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class GameLog(Base):
    __tablename__ = "game_logs"

    id = Column(Integer, primary_key=True, index=True)
    game_name = Column(String(50), nullable=False)
    child_input = Column(Text)
    model_output = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)