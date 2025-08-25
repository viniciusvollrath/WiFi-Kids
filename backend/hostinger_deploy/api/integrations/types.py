# api/integrations/types.py
from enum import Enum
from typing import Dict, List, Literal, Optional, TypedDict

# Question types
QuestionType = Literal["mc", "short", "true_false"]

# Persona types
class PersonaType(str, Enum):
    TUTOR = "tutor"
    MATERNAL = "maternal"
    GENERAL = "general"

# Subject types
class SubjectType(str, Enum):
    MATH = "math"
    HISTORY = "history"
    GEOGRAPHY = "geography"
    ENGLISH = "english"
    PHYSICS = "physics"
    SCIENCE = "science"
    LITERATURE = "literature"
    ART = "art"

# Difficulty levels
class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# Question structure
class Question(TypedDict):
    id: str
    type: QuestionType
    prompt: str
    options: Optional[List[str]]  # For multiple choice
    answer_len: Optional[int]     # For short answer
    subject: SubjectType
    difficulty: DifficultyLevel
    explanation: Optional[str]    # For feedback

# Answer structure
class Answer(TypedDict):
    id: str
    value: str
    confidence: Optional[float]   # For AI validation

# Challenge payload
class ChallengePayload(TypedDict):
    questions: List[Question]
    answer_key: Dict[str, str]
    metadata: Dict[str, str]      # persona, subject, difficulty, etc.

# Agent context
class AgentContext(TypedDict):
    locale: str
    mac: str
    router_id: str
    persona: PersonaType
    subject: Optional[SubjectType]
    difficulty: Optional[DifficultyLevel]
    previous_performance: Optional[Dict[str, float]]  # For adaptive difficulty

# Validation result
class ValidationResult(TypedDict):
    correct: bool
    score: float  # 0.0 to 1.0
    feedback: Optional[str]
    explanation: Optional[str]
