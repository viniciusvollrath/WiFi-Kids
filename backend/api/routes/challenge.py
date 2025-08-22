# api/routes/challenge.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.core.db import get_db
from api.core.settings import SESSION_TTL_SEC
from api.integrations.agent import MockAgent
from api.repositories.challenges import load_challenge, decrement_attempts, set_status
from api.repositories.sessions import create_session
from api.repositories.commands import enqueue_grant_session
from api.schemas.challenge import ChallengeAnswerIn, ChallengeApprovedOut, ChallengePendingOut

router = APIRouter()

@router.post("/challenge/answer", response_model=ChallengeApprovedOut | ChallengePendingOut)
def challenge_answer(body: ChallengeAnswerIn, db: Session = Depends(get_db)):
    ch = load_challenge(db, body.challenge_id)
    if not ch:
        raise HTTPException(status_code=404, detail="challenge_not_found")
    if ch.status != "open":
        raise HTTPException(status_code=400, detail="challenge_closed")

    agent = MockAgent()
    passed = agent.check_answers(ch.payload, [a.dict() for a in body.answers])

    if passed:
        set_status(db, ch, "passed")
        sess = create_session(db, ch.mac, ch.router_id, ttl_sec=SESSION_TTL_SEC)
        enqueue_grant_session(db, ch.router_id, ch.mac, SESSION_TTL_SEC)
        return ChallengeApprovedOut(allowed=True, ttl_sec=SESSION_TTL_SEC, session_id=sess.id)

    # errou -> decrementa
    decrement_attempts(db, ch)
    reason = "wrong_answer"
    if ch.attempts_left <= 0:
        set_status(db, ch, "failed")
    return ChallengePendingOut(allowed=False, attempts_left=ch.attempts_left, reason=reason)
