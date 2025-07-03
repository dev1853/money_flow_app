# /routers/users.py

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Импортируем все необходимые компоненты из нашего приложения
from .. import crud, models, schemas
from ..dependencies import get_db, get_current_user, get_current_active_superuser
from ..services.user_service import user_service # <--- Наш новый сервис
from ..core.exceptions import UserAlreadyExistsError # <--- Наше бизнес-исключение

router = APIRouter(
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Создание нового пользователя.
    Роутер делегирует всю сложную логику (создание, онбординг, управление транзакцией) сервису.
    """
    try:
        user = user_service.create_user_with_onboarding(db=db, user_in=user_in)
        return user
    except UserAlreadyExistsError as e:
        # Превращаем бизнес-исключение в корректный HTTP-ответ.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.detail,
        )
    except Exception:
        # Ловим любые другие непредвиденные ошибки из сервисного слоя.
        # В production здесь должно быть логирование ошибки.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Произошла непредвиденная ошибка при создании пользователя.",
        )

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: models.User = Depends(get_current_user)
):
    """
    Получение данных о текущем аутентифицированном пользователе.
    Этот эндпоинт идеален: вся логика (получение токена, поиск юзера) скрыта в зависимости.
    Рефакторинг не требуется.
    """
    return current_user

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # Эта зависимость гарантирует, что эндпоинт доступен только суперпользователю.
    current_user: models.User = Depends(get_current_active_superuser), 
):
    """
    Получение списка всех пользователей (доступно только для администраторов).
    Для простой операции чтения списка вызов CRUD напрямую из роутера является
    допустимым и прагматичным решением.
    """
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users