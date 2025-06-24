# backend/app/auth_utils.py

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import models, schemas, crud 
from app.database import get_db
from app.security import verify_password 
from app.config import settings 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


ACCESS_TOKEN_EXPIRE_MINUTES = 30 


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    print(f"DEBUG(Auth): Token created. Sub: {data.get('sub')}, Exp: {expire}, Encoded: {encoded_jwt[:20]}...") # <--- ЛОГ
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print(f"DEBUG(Auth): get_current_user called. Token received: {token[:20]}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"DEBUG(Auth): Attempting to decode token with SECRET_KEY[:5]: {settings.SECRET_KEY[:5]} and ALGORITHM: {settings.ALGORITHM}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username_or_email: str = payload.get("sub") 
        print(f"DEBUG(Auth): Token decoded. Subject (sub): {username_or_email}")
        if username_or_email is None:
            print("ERROR(Auth): Subject (sub) is None in token payload.")
            raise credentials_exception
        
        token_data = schemas.TokenData(username=username_or_email) # token_data.username будет email

    except JWTError as e:
        print(f"ERROR(Auth): JWTError during token decoding: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"ERROR(Auth): Unexpected error during token decoding: {e}")
        raise credentials_exception

    # ИСПРАВЛЕНО: Ищем пользователя по email, а не по username
    user = crud.user.get_by_email(db, email=token_data.username) # <--- ИСПРАВЛЕНО ЗДЕСЬ!
    if user is None:
        print(f"ERROR(Auth): User '{token_data.username}' not found in DB by email after token decoding.") # <--- Лог
        raise credentials_exception
    print(f"DEBUG(Auth): User '{user.username}' found and authenticated.")
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    print(f"DEBUG(Auth): get_current_active_user called for user: {current_user.username}") # <--- ЛОГ
    if not current_user.is_active:
        print(f"ERROR(Auth): User {current_user.username} is inactive.") # <--- ЛОГ
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

def authenticate_user(db: Session, username: str, password: str):
    user = crud.user.get_by_username(db, username=username)
    if not user:
        print(f"DEBUG(Auth): Authentication failed: User '{username}' not found.") # <--- ЛОГ
        return False
    if not verify_password(password, user.hashed_password):
        print(f"DEBUG(Auth): Authentication failed: Incorrect password for user '{username}'.") # <--- ЛОГ
        return False
    print(f"DEBUG(Auth): Authentication successful for user '{username}'.") # <--- ЛОГ
    return user