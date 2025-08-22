# api/schemas/session.py
from pydantic import BaseModel

class SessionStatusOut(BaseModel):
    active: bool
    remaining_sec: int
