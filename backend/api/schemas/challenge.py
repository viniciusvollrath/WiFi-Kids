# api/schemas/challenge.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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

class ChallengeGenerateIn(BaseModel):
    mac: str
    router_id: str
    locale: Optional[str] = "pt-BR"
    persona: Optional[str] = "tutor"
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    previous_performance: Optional[Dict[str, float]] = None

class ChallengeGenerateOut(BaseModel):
    challenge_id: str
    questions: List[Dict[str, Any]]
    metadata: Dict[str, str]
