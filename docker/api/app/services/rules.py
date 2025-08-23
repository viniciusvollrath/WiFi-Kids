from pydantic import BaseModel

class Decision(BaseModel):
    allow: bool
    duration_s: int
    reason: str

async def evaluate_access(ctx: dict) -> Decision:
    return Decision(allow=True, duration_s=300, reason="MVP")
