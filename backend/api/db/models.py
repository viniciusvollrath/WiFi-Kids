# api/db/models.py
import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, Index, func
from sqlalchemy.orm import validates
from api.core.db import Base

def _uuid() -> str:
    return str(uuid.uuid4())

def _normalize_mac(v: str) -> str:
    if not v: return v
    return v.strip().lower().replace("-", ":")

class Router(Base):
    __tablename__ = "routers"
    id = Column(String(17), primary_key=True)  # MAC do roteador
    router_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    @validates("id")
    def _v(self, _, v): return _normalize_mac(v)

class Device(Base):
    __tablename__ = "devices"
    mac = Column(String(17), primary_key=True)
    router_id = Column(String(17), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    @validates("mac","router_id")
    def _v(self, _, v): return _normalize_mac(v)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(36), primary_key=True, default=_uuid)
    mac = Column(String(17), nullable=False)
    router_id = Column(String(17), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ttl_sec = Column(Integer, nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)  # calcule na app
    status = Column(String(16), nullable=False, default="active")  # active|expired
    __table_args__ = (Index("ix_sessions_mac_status", "mac", "status"),)

class Command(Base):
    __tablename__ = "commands"
    id = Column(String(36), primary_key=True, default=_uuid)
    router_id = Column(String(17), nullable=False)
    action = Column(String(32), nullable=False)  # "grant_session"
    mac = Column(String(17), nullable=False
    )
    ttl_sec = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    delivered_at = Column(DateTime(timezone=True))
    __table_args__ = (Index("ix_commands_router_created", "router_id", "created_at"),)

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(String(36), primary_key=True, default=_uuid)
    mac = Column(String(17), nullable=False)
    router_id = Column(String(17), nullable=False)
    payload = Column(JSON, nullable=False)  # perguntas/alternativas + gabarito
    attempts_left = Column(Integer, nullable=False, default=2)
    status = Column(String(16), nullable=False, default="open")  # open|passed|failed|expired
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    @validates("mac","router_id")
    def _v(self, _, v): return _normalize_mac(v)

def compute_ends_at(start: datetime, ttl_sec: int) -> datetime:
    return start + timedelta(seconds=ttl_sec)
