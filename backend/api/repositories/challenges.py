# api/repositories/challenges.py
from sqlalchemy.orm import Session
from api.db.models import Challenge

def create_challenge(db: Session, mac: str, router_id: str, payload: dict, attempts_left: int) -> Challenge:
    """
    Cria um challenge "open" com payload (perguntas + gabarito) e número de tentativas.
    """
    ch = Challenge(
        mac=mac,
        router_id=router_id,
        payload=payload,
        attempts_left=attempts_left,
        status="open",
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch

def load_challenge(db: Session, challenge_id: str) -> Challenge | None:
    """
    Busca challenge pela PK (id).
    """
    return db.get(Challenge, challenge_id)

def decrement_attempts(db: Session, ch: Challenge) -> Challenge:
    """
    Decrementa tentativas até o mínimo 0.
    """
    ch.attempts_left = max(0, (ch.attempts_left or 0) - 1)
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch

def set_status(db: Session, ch: Challenge, status: str) -> Challenge:
    """
    Atualiza status: open | passed | failed | expired.
    """
    ch.status = status
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch
