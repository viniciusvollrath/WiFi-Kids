from fastapi import APIRouter, Request
from app.services.rules import evaluate_access

router = APIRouter()

@router.post("/authorize")
async def authorize(req: Request):
    payload = await req.json()
    decision = await evaluate_access(payload)  # aplica regras/LLM
    # resposta no formato que seu script do OpenNDS espera
    return {
        "status": "ALLOW" if decision.allow else "DENY",
        "duration_s": decision.duration_s,
        "reason": decision.reason,
    }
