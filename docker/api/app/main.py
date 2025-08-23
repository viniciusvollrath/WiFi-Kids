from fastapi import FastAPI, Depends, Request
from app.routes.health import router as health_router
from app.routes.decision import router as decision_router
from app.routes.agent import router as agent_router
from app.routes.opennds import router as opennds_router

app = FastAPI(title="Wi-Fi Kids API", version="0.1.0")

@app.get("/")
def root():
    return {"ok": True, "service": "wifikids-api"}

app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(decision_router, prefix="/decision", tags=["decision"])
app.include_router(agent_router, prefix="/agent", tags=["agent"])
app.include_router(opennds_router, prefix="/opennds", tags=["opennds"])
