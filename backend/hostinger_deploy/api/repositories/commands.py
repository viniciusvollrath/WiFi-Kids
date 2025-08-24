# api/repositories/commands.py
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.db.models import Command

def enqueue_grant_session(db: Session, router_id: str, mac: str, ttl_sec: int) -> Command:
    cmd = Command(router_id=router_id, mac=mac, ttl_sec=ttl_sec, action="grant_session")
    db.add(cmd)
    db.commit()
    db.refresh(cmd)
    return cmd

def list_pending_for_router(db: Session, router_id: str) -> list[Command]:
    return db.query(Command).filter(
        Command.router_id == router_id,
        Command.delivered_at.is_(None)
    ).order_by(Command.created_at.asc()).all()

def mark_delivered(db: Session, ids: list[str]) -> None:
    now = datetime.now(timezone.utc)
    db.query(Command).filter(Command.id.in_(ids)).update({Command.delivered_at: now}, synchronize_session=False)
    db.commit()
