import sys
import os

# Добавляем корневую папку проекта в пути Python для корректных импортов
current_path = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_path, ".."))
sys.path.append(project_root)

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

# Импортируем наши модули
from app.database import SessionLocal  # <-- 1. Импортируем SessionLocal
from app.initial_data import init_db   # <-- 2. Импортируем нашу новую функцию
from app.routers import (
    auth,
    users,
    workspaces,
    accounts,
    dds_articles,
    transactions,
    statement,
    reports,
    dashboard,
    mapping_rules,
    budgets,
    planned_payments,
    payment_calendar,
    contracts,
    counterparties,
    categorization_ml
)
from app.core.logging_config import setup_logging

# Настраиваем логирование
setup_logging()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base.metadata.create_all(bind=engine) # <-- 3. УБИРАЕМ ЭТУ СТРОКУ. Alembic теперь главный.

app = FastAPI(
    title="Money Flow App API",
    description="API for Money Flow App, a personal finance management tool",
    version="1.0.0",
)


# --- 4. ДОБАВЛЯЕМ ОБРАБОТЧИК СОБЫТИЯ "STARTUP" ---
@app.on_event("startup")
def on_startup():
    """
    Выполняется один раз при запуске приложения.
    Идеальное место для создания начальных данных.
    """
    logger.info("Выполняется запуск приложения...")
    try:
        db = SessionLocal()
        # Вызываем нашу функцию для создания ролей (и других данных)
        init_db(db)
        logger.info("Инициализация базы данных успешно завершена.")
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
    finally:
        # Важно всегда закрывать сессию
        db.close()


# Middleware для перехвата всех исключений
@app.middleware("http")
async def log_and_handle_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        logger.exception("Произошла необработанная ошибка на сервере")
        return JSONResponse(
            status_code=500,
            content={"detail": "Произошла внутренняя ошибка на сервере."},
        )


origins = [
    "https://money.dev1853.ru",
    "http://money.dev1853.ru",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api"

app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{api_prefix}/users", tags=["users"])
app.include_router(workspaces.router, prefix=f"{api_prefix}/workspaces", tags=["workspaces"])
app.include_router(accounts.router, prefix=f"{api_prefix}/accounts", tags=["accounts"])
app.include_router(dds_articles.router, prefix=f"{api_prefix}/dds-articles", tags=["dds_articles"])
app.include_router(transactions.router, prefix=f"{api_prefix}/transactions", tags=["transactions"])
app.include_router(statement.router, prefix=f"{api_prefix}/statement", tags=["statement"])
app.include_router(reports.router, prefix=f"{api_prefix}/reports", tags=["reports"])
app.include_router(dashboard.router, prefix=f"{api_prefix}/dashboard", tags=["dashboard"])
app.include_router(mapping_rules.router, prefix=f"{api_prefix}/mapping_rules", tags=["mapping_rules"])
app.include_router(budgets.router, prefix=f"{api_prefix}/budgets", tags=["budgets"])
app.include_router(planned_payments.router, prefix=f"{api_prefix}/planned-payments", tags=["planned-payments"])
app.include_router(payment_calendar.router, prefix=f"{api_prefix}/payment-calendar", tags=["payment_calendar"])
app.include_router(contracts.router, prefix=f"{api_prefix}/contracts", tags=["contracts"])
app.include_router(counterparties.router, prefix=f"{api_prefix}/counterparties", tags=["counterparties"])
app.include_router(categorization_ml.router, prefix=f"{api_prefix}/categorization_ml", tags=["categorization_ml"])