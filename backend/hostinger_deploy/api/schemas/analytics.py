# api/schemas/analytics.py
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

class StudentPerformanceOut(BaseModel):
    """Student performance analytics response."""
    total_challenges: int
    successful_challenges: int
    failed_challenges: int
    average_score: float
    learning_streak: int
    best_streak: int
    current_difficulty: str
    last_activity: Optional[str]

class SubjectPerformanceOut(BaseModel):
    """Subject-specific performance data."""
    correct: int
    total: int
    avg_score: float

class DifficultyHistoryEntry(BaseModel):
    """Difficulty progression history entry."""
    date: str
    difficulty: str
    score: float

class RecentChallengeOut(BaseModel):
    """Recent challenge summary."""
    id: int
    subject: str
    difficulty: str
    score: float
    passed: bool
    created_at: str

class LearningPathOut(BaseModel):
    """Learning path and recommendations."""
    current_subject: Optional[str]
    current_difficulty: Optional[str]
    learning_phase: Optional[str]
    subject_mastery: Dict[str, float]
    recommendations: Dict[str, Optional[str]]

class StudentAnalyticsOut(BaseModel):
    """Complete student analytics response."""
    performance: StudentPerformanceOut
    subject_performance: Dict[str, SubjectPerformanceOut]
    difficulty_history: List[DifficultyHistoryEntry]
    recent_challenges: List[RecentChallengeOut]
    learning_path: LearningPathOut

class ChallengeAnalyticsIn(BaseModel):
    """Challenge analytics input data."""
    challenge_id: str
    mac: str
    router_id: str
    persona: str
    subject: str
    difficulty: str
    agent_type: str
    total_questions: int
    correct_answers: int
    score: float
    passed: bool
    time_to_complete: Optional[int] = None
    time_per_question: Optional[float] = None
    answer_details: Optional[List[Dict[str, Any]]] = None
    feedback: Optional[str] = None
    hints_used: int = 0
    attempts_made: int = 1

class ChallengeAnalyticsOut(BaseModel):
    """Challenge analytics response."""
    id: int
    challenge_id: str
    mac_address: str
    router_id: str
    persona_used: str
    subject: str
    difficulty: str
    agent_type: str
    total_questions: int
    correct_answers: int
    score: float
    passed: bool
    time_to_complete: Optional[int]
    time_per_question: Optional[float]
    feedback_received: Optional[str]
    hints_used: int
    attempts_made: int
    created_at: str

class AgentPerformanceOut(BaseModel):
    """Agent performance metrics."""
    agent_type: str
    persona: str
    model_used: str
    total_challenges_generated: int
    successful_validations: int
    failed_validations: int
    average_response_time: float
    average_student_score: float
    student_satisfaction: float
    challenge_difficulty_accuracy: float
    error_count: int
    usage_by_subject: Dict[str, int]
    usage_by_difficulty: Dict[str, int]
    created_at: str
    updated_at: str

class SystemMetricsOut(BaseModel):
    """System-wide metrics."""
    date: str
    hour: int
    total_requests: int
    successful_requests: int
    failed_requests: int
    unique_users: int
    active_routers: int
    average_response_time: float
    total_challenges_completed: int
    average_challenge_score: float
    most_popular_subject: Optional[str]
    most_popular_persona: Optional[str]
    cpu_usage: float
    memory_usage: float
    database_connections: int
    created_at: str

class SystemAnalyticsOut(BaseModel):
    """System analytics summary."""
    period_days: int
    total_requests: int
    total_challenges_completed: int
    average_response_time: float
    average_challenge_score: float
    success_rate: float
    daily_metrics: List[Dict[str, Any]]

class AnalyticsFilterIn(BaseModel):
    """Analytics filter parameters."""
    mac: Optional[str] = None
    router_id: Optional[str] = None
    subject: Optional[str] = None
    persona: Optional[str] = None
    difficulty: Optional[str] = None
    agent_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: int = 100

class PerformanceUpdateIn(BaseModel):
    """Performance update input."""
    mac: str
    router_id: str
    challenge_result: Dict[str, Any]

class LearningPathUpdateIn(BaseModel):
    """Learning path update input."""
    mac: str
    router_id: str
    performance_data: Dict[str, Any]

class AgentPerformanceUpdateIn(BaseModel):
    """Agent performance update input."""
    agent_type: str
    persona: str
    model: str
    performance_data: Dict[str, Any]

class SystemMetricsUpdateIn(BaseModel):
    """System metrics update input."""
    metrics_data: Dict[str, Any]
