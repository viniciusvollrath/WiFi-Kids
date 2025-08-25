# api/repositories/challenges.py
from sqlalchemy.orm import Session
from api.db.models import Device
from api.db.models import Challenge
from api.core.timewin import normalize_mac

def create_challenge(db: Session, mac: str, router_id: str, payload: dict, attempts_left: int) -> Challenge:
    c = Challenge(mac=mac, router_id=router_id, payload=payload, attempts_left=attempts_left, status="open")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

def load_challenge(db: Session, challenge_id: str) -> Challenge | None:
    return db.get(Challenge, challenge_id)

def decrement_attempts(db: Session, ch: Challenge) -> Challenge:
    ch.attempts_left = max(0, (ch.attempts_left or 0) - 1)
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch

def set_status(db: Session, ch: Challenge, status: str) -> Challenge:
    ch.status = status
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch

def upsert_device(db: Session, mac: str, router_id: str) -> Device:
    """
    Registra/atualiza o device (MAC da criança) vinculado a um roteador.
    - Normaliza ambos para minúsculo com ':'
    - Se já existir, atualiza o router_id
    - Se não existir, cria
    - Commit e refresh para devolver o objeto persistido
    """
    mac_n = normalize_mac(mac)
    rid_n = normalize_mac(router_id)

    d = db.get(Device, mac_n)  # busca pela PK (mac)
    if d:
        d.router_id = rid_n
        db.add(d)
    else:
        d = Device(mac=mac_n, router_id=rid_n)
        db.add(d)

    db.commit()
    db.refresh(d)
    return d