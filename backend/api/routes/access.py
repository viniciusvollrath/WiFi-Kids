# api/routes/access.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from api.core.db import get_db
from api.core.timewin import normalize_mac
from api.core.settings import ACCESS_WINDOWS, TZ, CHALLENGE_REQUIRED, CHALLENGE_ATTEMPTS, SESSION_TTL_SEC
from api.schemas.access import AccessRequest, ChallengeOut, AccessApprovedOut, AccessDeniedOut
from api.integrations.agent import MockAgent
from api.repositories.devices import upsert_device
from api.repositories.challenges import create_challenge
from api.repositories.sessions import create_session
from api.repositories.commands import enqueue_grant_session

router = APIRouter()

@router.post("/access-request", response_model=ChallengeOut | AccessApprovedOut | AccessDeniedOut)
def access_request(body: AccessRequest, db: Session = Depends(get_db)):
    mac = normalize_mac(body.mac)
    rid = normalize_mac(body.router_id)

    # 1) Janela de acesso
    now = datetime.now(timezone.utc)
    from api.core.timewin import is_within_window
    if not is_within_window(now, ACCESS_WINDOWS, TZ):
        return AccessDeniedOut(allowed=False, reason="outside_schedule")

    # 2) Upsert do device
    upsert_device(db, mac, rid)

    # 3) Se exigir desafio -> gera Challenge
    if CHALLENGE_REQUIRED:
        agent = MockAgent()
        payload = agent.generate_challenge(body.locale, mac, rid)
        ch = create_challenge(db, mac, rid, payload, attempts_left=CHALLENGE_ATTEMPTS)
        return ChallengeOut(
            challenge_id=ch.id,
            questions=payload["questions"],
            attempts_left=ch.attempts_left
        )

    # 4) Caso contrário, libera direto
    sess = create_session(db, mac, rid, ttl_sec=SESSION_TTL_SEC)
    enqueue_grant_session(db, rid, mac, SESSION_TTL_SEC)
    return AccessApprovedOut(allowed=True, ttl_sec=SESSION_TTL_SEC, session_id=sess.id)
