# api/routes/session.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from api.core.db import get_db
from api.core.timewin import normalize_mac
from api.repositories.sessions import get_status
from api.schemas.session import SessionStatusOut

router = APIRouter()

@router.get("/session-status", response_model=SessionStatusOut)
def session_status(mac: str, router_id: str, db: Session = Depends(get_db)):
    mac_n = normalize_mac(mac)
    rid_n = normalize_mac(router_id)
    s = get_status(db, mac_n, rid_n)
    return SessionStatusOut(**s)
