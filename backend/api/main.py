# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.core.settings import CORS_ORIGINS

from api.routes.access import router as access_router
from api.routes.challenge import router as challenge_router
from api.routes.commands import router as commands_router
from api.routes.session import router as session_router
from api.routes.analytics import router as analytics_router

app = FastAPI(title="WiFi-Kids API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
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
