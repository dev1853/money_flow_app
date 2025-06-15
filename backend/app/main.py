# backend/app/main.py (ФИНАЛЬНАЯ ВЕРСИЯ)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .routers import auth, users, workspaces, accounts, dds_articles, transactions, statement, reports, dashboard

# Раскомментируйте, если нужно создавать таблицы при старте (не для Alembic)
# from . import models


app = FastAPI(
    title="Money Flow API",
    description="API для сервиса управления личными финансами.",
    version="1.0.0",
)

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем все роутеры
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workspaces.router)
app.include_router(accounts.router)
app.include_router(dds_articles.router)
app.include_router(transactions.router)
app.include_router(statement.router)
app.include_router(reports.router)
app.include_router(dashboard.router)

@app.get("/api/healthcheck", tags=["System"])
def health_check():
    return {"status": "ok"}