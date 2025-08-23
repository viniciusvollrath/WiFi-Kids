from pydantic import BaseModel

class Decision(BaseModel):
    decision: str
    allowed_minutes: int
    reason: str

async def evaluate_access(ctx: dict) -> Decision:
    # regras rápidas: horários/limites por perfil (ex: manha/tarde/noite)
    # TODO: ler políticas do Supabase por router_id/responsável
    # MVP: libera 15 min se "tarefas_feitas" estiver true; senão 5 min
    tarefas = ctx.get("tarefas_feitas", False)
    return Decision(
        decision="ALLOW",
        allowed_minutes=15 if tarefas else 5,
        reason="tarefas ok" if tarefas else "modo teste",
    )
