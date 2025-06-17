# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import (
    auth,
    users,
    workspaces,
    accounts,
    dds_articles,
    transactions,
    statement,
    reports,
    dashboard
)

app = FastAPI(
    title="Money Flow App API",
    description="API for Money Flow App, a personal finance management tool",
    version="1.0.0",
)

origins = [
    "http://localhost",
    "http://localhost:5173", # Если ты все еще используешь этот порт
    "http://127.0.0.1:5173", # Если ты все еще используешь этот порт
    "http://localhost:3000",   # <--- УБЕДИСЬ, ЧТО ЭТО ЗДЕСЬ ЕСТЬ
    "http://127.0.0.1:3000",   # <--- УБЕДИСЬ, ЧТО ЭТО ЗДЕСЬ ЕСТЬ
    # Если ты разворачиваешь приложение на других доменах, добавь их тоже
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Это позволяет всем методам, включая POST и OPTIONS
    allow_headers=["*"], # Это позволяет всем заголовкам
)

# Включение роутеров:
app.include_router(auth.router, prefix="/api") # <-- ЭТА СТРОКА ДОЛЖНА БЫТЬ ПРАВИЛЬНОЙ!
app.include_router(users.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(dds_articles.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(statement.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Money Flow App API"}

# --- БЛОК ДЛЯ ОТЛАДКИ МАРШРУТОВ ---
from fastapi.routing import APIRoute

print("\n--- ЗАРЕГИСТРИРОВАННЫЕ МАРШРУТЫ ---")
for route in app.routes:
    if isinstance(route, APIRoute):
        print(f"Путь: {route.path}, Имя: {route.name}, Методы: {route.methods}")
print("-------------------------------------\n")
# --- КОНЕЦ БЛОКА ОТЛАДКИ ---