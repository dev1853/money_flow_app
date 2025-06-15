# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ...
from .routers import (
    auth, # <-- Убедись, что 'auth' импортируется здесь
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
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
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