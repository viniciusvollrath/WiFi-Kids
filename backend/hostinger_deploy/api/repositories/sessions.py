# api/repositories/sessions.py
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.db.models import Session as Sess
from api.db.models import compute_ends_at

def create_session(db: Session, mac: str, router_id: str, ttl_sec: int) -> Sess:
    started_at = datetime.now(timezone.utc)
    ends_at = compute_ends_at(started_at, ttl_sec)
    s = Sess(mac=mac, router_id=router_id, ttl_sec=ttl_sec, started_at=started_at, ends_at=ends_at, status="active")
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

def get_status(db: Session, mac: str, router_id: str) -> dict:
    # Sessão “ativa” mais recente (simplificado)
    q = db.query(Sess).filter(Sess.mac == mac, Sess.router_id == router_id).order_by(Sess.started_at.desc())
    s = q.first()
    if not s:
        return {"active": False, "remaining_sec": 0}
    now = datetime.now(timezone.utc)
    remaining = int((s.ends_at - now).total_seconds())
    if remaining <= 0 or s.status != "active":
        return {"active": False, "remaining_sec": 0}
    return {"active": True, "remaining_sec": remaining}
