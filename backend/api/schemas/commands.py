# api/schemas/commands.py
from pydantic import BaseModel

class CommandOut(BaseModel):
    cmd_id: str
    action: str
    mac: str
    ttl_sec: int
