from pydantic import BaseModel

class Decision(BaseModel):
    allow: bool
    duration_s: int
    reason: str

async def evaluate_access(ctx: dict) -> Decision:
    # regras rápidas: horários/limites por perfil (ex: manha/tarde/noite)
    # TODO: ler políticas do Supabase por router_id/responsável
    # MVP: libera 15 min se "tarefas_feitas" estiver true; senão 5 min
    tarefas = ctx.get("tarefas_feitas", False)
    return Decision(
        allow=True,
        duration_s=900 if tarefas else 300,
        reason="tarefas ok" if tarefas else "modo teste",
    )
