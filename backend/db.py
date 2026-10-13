# backend/db.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# 1) Charger les variables d'environnement
# Priorité: .env.local (dev local) > .env
if os.path.exists(".env.local"):
    load_dotenv(".env.local", override=False)
else:
    load_dotenv(override=False)


def build_database_url() -> str:
    """
    Priorité:
    1) DATABASE_URL (si défini)
    2) DB_* fallback

    + Auto-fix:
      - Si on n'est PAS dans docker et l'URL contient @db: -> remplacer par localhost
      - Si le nom de DB contient des majuscules, on garde tel quel (Postgres accepte),
        mais l'utilisateur doit mettre le bon nom (miniHKEYA vs minihkeya).
    """
    database_url = os.getenv("DATABASE_URL", "").strip()

    # ✅ Protection contre placeholders
    if database_url and ("VRAI_MDP" in database_url or "NOM_DB_EXACT" in database_url or "ton_mdp" in database_url):
        raise RuntimeError(
            "DATABASE_URL contient encore un placeholder (VRAI_MDP / NOM_DB_EXACT / ton_mdp). "
            "Mets ton vrai mot de passe et le vrai nom de DB dans .env.local."
        )

    # Auto-fix docker hostname "db" quand on est en local
    running_in_docker = os.getenv("RUNNING_IN_DOCKER", "0").strip() == "1"
    if database_url and ("@db:" in database_url) and not running_in_docker:
        database_url = database_url.replace("@db:", "@localhost:")

    if database_url:
        return database_url

    # 2) Fallback DB_*
    host = os.getenv("DB_HOST", "localhost").strip()
    port = os.getenv("DB_PORT", "5432").strip()
    name = os.getenv("DB_NAME", "miniHKEYA").strip()
    user = os.getenv("DB_USER", "postgres").strip()
    password = os.getenv("DB_PASSWORD", "").strip()

    if not password:
        raise RuntimeError(
            "DB_PASSWORD est vide et DATABASE_URL est absent. "
            "Ajoute DATABASE_URL dans .env.local."
        )

    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"


DATABASE_URL = build_database_url()

# ✅ Log utile (optionnel) : affiche l'URL sans mot de passe
def _safe_url(url: str) -> str:
    # cache le password dans postgresql+psycopg2://user:pass@host/db
    if "://" in url and "@" in url and ":" in url.split("://", 1)[1]:
        prefix, rest = url.split("://", 1)
        # rest = user:pass@host:port/db
        if "@" in rest and ":" in rest.split("@", 1)[0]:
            creds, after = rest.split("@", 1)
            user = creds.split(":", 1)[0]
            return f"{prefix}://{user}:***@{after}"
    return url

print("✅ DATABASE_URL utilisée :", _safe_url(DATABASE_URL))

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
