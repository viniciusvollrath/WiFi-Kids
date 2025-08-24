# api/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.access import router as access_router
from api.routes.challenge import router as challenge_router
from api.routes.commands import router as commands_router
from api.routes.session import router as session_router
from api.routes.analytics import router as analytics_router

app = FastAPI(title="WiFi-Kids API", version="0.1.0")

# Get CORS origins from environment
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Saúde
@app.get("/ping")
def ping():
    return {"message": "pong"}

# Rotas principais do MVP
app.include_router(access_router, tags=["access"])
app.include_router(challenge_router, tags=["challenge"])
app.include_router(commands_router, tags=["router"])
app.include_router(session_router, tags=["session"])

# Analytics routes
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
