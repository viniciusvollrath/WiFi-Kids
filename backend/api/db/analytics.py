# api/db/analytics.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from api.db.models import Base

class StudentPerformance(Base):
    """Track student performance over time."""
    __tablename__ = "student_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String(17), nullable=False, index=True)
    router_id = Column(String(50), nullable=False, index=True)
    
    # Performance metrics
    total_challenges = Column(Integer, default=0)
    successful_challenges = Column(Integer, default=0)
    failed_challenges = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    total_time_spent = Column(Integer, default=0)  # in seconds
    
    # Subject performance
    subject_performance = Column(JSON, default=dict)  # {"math": {"correct": 10, "total": 15, "avg_score": 0.67}}
    
    # Difficulty progression
    current_difficulty = Column(String(20), default="easy")
    difficulty_history = Column(JSON, default=list)  # [{"date": "2024-01-01", "difficulty": "medium", "score": 0.8}]
    
    # Learning analytics
    learning_streak = Column(Integer, default=0)  # consecutive successful challenges
    best_streak = Column(Integer, default=0)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ChallengeAnalytics(Base):
    """Detailed analytics for individual challenges."""
    __tablename__ = "challenge_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    mac_address = Column(String(17), nullable=False, index=True)
    router_id = Column(String(50), nullable=False, index=True)
    
    # Challenge details
    persona_used = Column(String(20), nullable=False)
    subject = Column(String(20), nullable=False)
    difficulty = Column(String(20), nullable=False)
    agent_type = Column(String(20), nullable=False)  # "langchain", "mock"
    
    # Performance metrics
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, default=0)
    score = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    
    # Timing
    time_to_complete = Column(Integer)  # in seconds
    time_per_question = Column(Float)  # average time per question
    
    # Answer details
    answer_details = Column(JSON, default=list)  # [{"question_id": "q1", "correct": true, "score": 1.0, "time": 5}]
    
    # Feedback and learning
    feedback_received = Column(Text)
    hints_used = Column(Integer, default=0)
    attempts_made = Column(Integer, default=1)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    challenge = relationship("Challenge", back_populates="analytics")

class LearningPath(Base):
    """Track learning progression and recommendations."""
    __tablename__ = "learning_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String(17), nullable=False, index=True)
    router_id = Column(String(50), nullable=False, index=True)
    
    # Current learning state
    current_subject = Column(String(20), nullable=False)
    current_difficulty = Column(String(20), nullable=False)
    learning_phase = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    
    # Subject mastery levels (0.0 to 1.0)
    subject_mastery = Column(JSON, default=dict)  # {"math": 0.75, "history": 0.45}
    
    # Recommended next steps
    recommended_subject = Column(String(20))
    recommended_difficulty = Column(String(20))
    recommended_persona = Column(String(20))
    
    # Learning goals and achievements
    learning_goals = Column(JSON, default=list)  # [{"goal": "master_math", "progress": 0.8, "target": 0.9}]
    achievements = Column(JSON, default=list)  # [{"achievement": "math_master", "earned_at": "2024-01-01"}]
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AgentPerformance(Base):
    """Track agent performance and effectiveness."""
    __tablename__ = "agent_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Agent identification
    agent_type = Column(String(20), nullable=False, index=True)  # "langchain", "mock"
    persona = Column(String(20), nullable=False, index=True)
    model_used = Column(String(50))  # "gpt-4o-mini", "mock"
    
    # Performance metrics
    total_challenges_generated = Column(Integer, default=0)
    successful_validations = Column(Integer, default=0)
    failed_validations = Column(Integer, default=0)
    average_response_time = Column(Float, default=0.0)  # in seconds
    
    # Quality metrics
    average_student_score = Column(Float, default=0.0)
    student_satisfaction = Column(Float, default=0.0)  # based on feedback
    challenge_difficulty_accuracy = Column(Float, default=0.0)  # how well difficulty matches performance
    
    # Error tracking
    error_count = Column(Integer, default=0)
    error_types = Column(JSON, default=dict)  # {"timeout": 5, "api_error": 2}
    
    # Usage patterns
    usage_by_subject = Column(JSON, default=dict)  # {"math": 150, "history": 75}
    usage_by_difficulty = Column(JSON, default=dict)  # {"easy": 100, "medium": 80, "hard": 45}
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SystemMetrics(Base):
    """System-wide performance and usage metrics."""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Time period
    date = Column(String(10), nullable=False, index=True)  # "2024-01-01"
    hour = Column(Integer, nullable=False, index=True)  # 0-23
    
    # Usage metrics
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    active_routers = Column(Integer, default=0)
    
    # Performance metrics
    average_response_time = Column(Float, default=0.0)
    peak_concurrent_users = Column(Integer, default=0)
    total_data_transferred = Column(Integer, default=0)  # in bytes
    
    # Educational metrics
    total_challenges_completed = Column(Integer, default=0)
    average_challenge_score = Column(Float, default=0.0)
    most_popular_subject = Column(String(20))
    most_popular_persona = Column(String(20))
    
    # System health
    cpu_usage = Column(Float, default=0.0)
    memory_usage = Column(Float, default=0.0)
    database_connections = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
