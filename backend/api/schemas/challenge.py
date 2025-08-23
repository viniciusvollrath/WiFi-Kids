# api/schemas/challenge.py
from pydantic import BaseModel
from typing import List, Optional

class Answer(BaseModel):
    id: str
    value: str

class ChallengeAnswerIn(BaseModel):
    challenge_id: str
    answers: List[Answer]

class ChallengeApprovedOut(BaseModel):
    decision: str = "ALLOW"
    allowed_minutes: int
    session_id: str
    feedback: Optional[str] = None

class ChallengePendingOut(BaseModel):
    decision: str = "DENY"
    attempts_left: int
    reason: str  # "wrong_answer"
    feedback: Optional[str] = None
