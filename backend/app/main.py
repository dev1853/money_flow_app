# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import (
    auth, users, workspaces, accounts, dds_articles, transactions, statement, reports, dashboard
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
app.include_router(users.router, prefix=f"{api_prefix}/users", tags=["users"]) 
app.include_router(workspaces.router, prefix=f"{api_prefix}/workspaces", tags=["workspaces"]) 
app.include_router(accounts.router, prefix=f"{api_prefix}/accounts", tags=["accounts"]) 
app.include_router(dds_articles.router, prefix=f"{api_prefix}/dds-articles", tags=["dds_articles"]) 
app.include_router(transactions.router, prefix=f"{api_prefix}/transactions", tags=["transactions"]) 
app.include_router(statement.router, prefix=f"{api_prefix}/statement", tags=["statement"]) 
app.include_router(reports.router, prefix=f"{api_prefix}/reports", tags=["reports"]) 
app.include_router(dashboard.router, prefix=f"{api_prefix}/dashboard", tags=["dashboard"])