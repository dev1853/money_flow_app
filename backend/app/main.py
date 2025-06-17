# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import (
    auth, users, workspaces, accounts, dds_articles,
    transactions, statement, reports, dashboard
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Money Flow App API",
    description="API for Money Flow App, a personal finance management tool",
    version="1.0.0",
)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api"

app.include_router(auth.router, prefix=api_prefix, tags=["auth"])
app.include_router(users.router, prefix=api_prefix, tags=["users"])
app.include_router(workspaces.router, prefix=api_prefix, tags=["workspaces"])
app.include_router(accounts.router, prefix=api_prefix, tags=["accounts"])
app.include_router(dds_articles.router, prefix=api_prefix, tags=["dds_articles"])
app.include_router(transactions.router, prefix=api_prefix, tags=["transactions"])
app.include_router(statement.router, prefix=api_prefix, tags=["statement"])
app.include_router(reports.router, prefix=api_prefix, tags=["reports"])
app.include_router(dashboard.router, prefix=api_prefix, tags=["dashboard"])
