from fastapi import FastAPI
from app.routes.health import router as health_router

app = FastAPI(title="Wi-Fi Kids API", version="0.1.0")

@app.get("/")
def root():
    return {"ok": True, "service": "wifikids-api"}

app.include_router(health_router, prefix="/health", tags=["health"])
