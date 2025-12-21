# backend/auth/auth_utils.py
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt

# ⛔ À mettre dans .env plus tard, pour l'instant c'est ok pour dev
SECRET_KEY = "CHANGE_MOI_AVANT_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h

# On n'utilise plus bcrypt car il pose problème sur ta machine.
# sha256_crypt est géré 100% en Python par passlib → pas de bug natif.
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
