# api/routes/commands.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from api.core.db import get_db
from api.repositories.routers import check_router_auth
from api.repositories.commands import list_pending_for_router, mark_delivered
from api.schemas.commands import CommandOut
from api.core.timewin import normalize_mac

router = APIRouter()

@router.get("/pull-commands", response_model=list[CommandOut])
def pull_commands(
    router_id: str,
    db: Session = Depends(get_db),
    x_router_auth: str = Header(alias="X-Router-Auth"),
):
    rid = check_router_auth(db, x_router_auth)
    router_id_n = normalize_mac(router_id)
    if not rid or rid != router_id_n:
        raise HTTPException(status_code=401, detail="invalid_router_auth")

    cmds = list_pending_for_router(db, router_id_n)
    out = [CommandOut(cmd_id=c.id, action=c.action, mac=c.mac, ttl_sec=c.ttl_sec) for c in cmds]
    mark_delivered(db, [c.id for c in cmds])
    return out
