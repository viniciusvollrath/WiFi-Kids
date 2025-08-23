# api/schemas/access.py
from pydantic import BaseModel
from typing import List, Optional, Literal

class AccessRequest(BaseModel):
    mac: str
    router_id: str
    locale: str

QuestionType = Literal["mc", "short"]

class Question(BaseModel):
    id: str
    type: QuestionType
    prompt: str
    options: Optional[List[str]] = None
    answer_len: Optional[int] = None

class ChallengeOut(BaseModel):
    challenge_id: str
    questions: List[Question]
    attempts_left: int

class AccessApprovedOut(BaseModel):
    decision: str = "ALLOW"
    allowed_minutes: int
    session_id: str

class AccessDeniedOut(BaseModel):
    decision: str = "DENY"
    reason: str  # "outside_schedule"
