# api/repositories/routers.py
from sqlalchemy.orm import Session
from api.db.models import Router
from api.core.timewin import normalize_mac

def upsert_router(db: Session, router_id: str, router_key: str) -> Router:
    rid = normalize_mac(router_id)
    r = db.get(Router, rid)
    if r:
        r.router_key = router_key
        db.add(r)
    else:
        r = Router(id=rid, router_key=router_key)
        db.add(r)
    db.commit()
    db.refresh(r)
    return r

def check_router_auth(db: Session, header: str) -> str | None:
    """
    Header esperado: 'X-Router-Auth: <router_mac>:<router_key>'
    Retorna router_id (mac) se válido, senão None.
    """
    try:
        mac, key = header.rsplit(":", 1)
    except Exception:
        return None
    mac = normalize_mac(mac)
    r = db.get(Router, mac)
    if not r:
        return None
    return mac if r.router_key == key else None
