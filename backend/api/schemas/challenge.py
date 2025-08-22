# api/schemas/challenge.py
from pydantic import BaseModel
from typing import List

class Answer(BaseModel):
    id: str
    value: str

class ChallengeAnswerIn(BaseModel):
    challenge_id: str
    answers: List[Answer]

class ChallengeApprovedOut(BaseModel):
    allowed: bool = True
    ttl_sec: int
    session_id: str

class ChallengePendingOut(BaseModel):
    allowed: bool = False
    attempts_left: int
    reason: str  # "wrong_answer"
