# tests/conftest.py
"""Pytest configuration and fixtures for WiFi-Kids Backend tests."""

import os
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Set test environment
os.environ["DEFAULT_TIMEZONE"] = "UTC"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["OPENAI_API_KEY"] = "test-key"
os.environ["AGENT_TYPE"] = "mock"

from api.core.db import get_db, Base
from api.main import app
from api.db.models import Router, Device, Session as SessionModel, Command, Challenge
from api.db.analytics import (
    StudentPerformance, 
    ChallengeAnalytics, 
    LearningPath, 
    AgentPerformance, 
    SystemMetrics
)

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_db():
    """Create test database and tables."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up
    Base.metadata.drop_all(bind=engine)
    # Try to remove test database file, but ignore Windows file locking errors
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except (PermissionError, OSError):
            # Ignore Windows file locking issues
            pass

@pytest.fixture
def db_session(test_db) -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session) -> Generator[TestClient, None, None]:
    """Create a test client with database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
async def async_client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

# Test data fixtures
@pytest.fixture
def sample_router() -> dict:
    """Sample router data for testing."""
    return {
        "id": "aa:bb:cc:dd:ee:ff",
        "router_key": "test-router-key-123"
    }

@pytest.fixture
def sample_device() -> dict:
    """Sample device data for testing."""
    return {
        "mac": "11:22:33:44:55:66",
        "router_id": "aa:bb:cc:dd:ee:ff"
    }

@pytest.fixture
def sample_challenge() -> dict:
    """Sample challenge data for testing."""
    return {
        "id": "test-challenge-001",
        "mac": "11:22:33:44:55:66",
        "router_id": "aa:bb:cc:dd:ee:ff",
        "payload": {
            "questions": [
                {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_len": 1
                }
            ],
            "answer_key": {"q1": "4"},
            "metadata": {
                "persona": "tutor",
                "subject": "math",
                "difficulty": "easy",
                "agent_type": "mock"
            }
        },
        "attempts_left": 2,
        "status": "open"
    }

@pytest.fixture
def sample_analytics_data() -> dict:
    """Sample analytics data for testing."""
    return {
        "student_performance": {
            "mac": "11:22:33:44:55:66",
            "router_id": "aa:bb:cc:dd:ee:ff",
            "total_challenges": 5,
            "successful_challenges": 4,
            "failed_challenges": 1,
            "average_score": 0.8,
            "learning_streak": 3
        },
        "challenge_analytics": {
            "challenge_id": "test-challenge-001",
            "mac": "11:22:33:44:55:66",
            "router_id": "aa:bb:cc:dd:ee:ff",
            "persona": "tutor",
            "subject": "math",
            "difficulty": "medium",
            "agent_type": "langchain",
            "total_questions": 3,
            "correct_answers": 2,
            "score": 0.67,
            "passed": True
        },
        "learning_path": {
            "mac": "11:22:33:44:55:66",
            "router_id": "aa:bb:cc:dd:ee:ff",
            "current_subject": "math",
            "current_difficulty": "medium",
            "learning_phase": "intermediate",
            "subject_mastery": {"math": 0.75, "history": 0.45}
        }
    }

# Database helpers
@pytest.fixture
def create_router(db_session, sample_router) -> Router:
    """Create a test router in the database."""
    router = Router(**sample_router)
    db_session.add(router)
    db_session.commit()
    db_session.refresh(router)
    return router

@pytest.fixture
def create_device(db_session, sample_device) -> Device:
    """Create a test device in the database."""
    device = Device(**sample_device)
    db_session.add(device)
    db_session.commit()
    db_session.refresh(device)
    return device

@pytest.fixture
def create_challenge(db_session, sample_challenge) -> Challenge:
    """Create a test challenge in the database."""
    challenge = Challenge(**sample_challenge)
    db_session.add(challenge)
    db_session.commit()
    db_session.refresh(challenge)
    return challenge

@pytest.fixture
def create_student_performance(db_session, sample_analytics_data) -> StudentPerformance:
    """Create test student performance data."""
    performance = StudentPerformance(**sample_analytics_data["student_performance"])
    db_session.add(performance)
    db_session.commit()
    db_session.refresh(performance)
    return performance

@pytest.fixture
def create_challenge_analytics(db_session, sample_analytics_data) -> ChallengeAnalytics:
    """Create test challenge analytics data."""
    analytics = ChallengeAnalytics(**sample_analytics_data["challenge_analytics"])
    db_session.add(analytics)
    db_session.commit()
    db_session.refresh(analytics)
    return analytics

@pytest.fixture
def create_learning_path(db_session, sample_analytics_data) -> LearningPath:
    """Create test learning path data."""
    learning_path = LearningPath(**sample_analytics_data["learning_path"])
    db_session.add(learning_path)
    db_session.commit()
    db_session.refresh(learning_path)
    return learning_path

# Mock data generators
@pytest.fixture
def mock_agent_response() -> dict:
    """Mock agent response for testing."""
    return {
        "questions": [
            {
                "id": "q1",
                "type": "mc",
                "prompt": "What is the capital of France?",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "answer_len": 1
            }
        ],
        "answer_key": {"q1": "Paris"},
        "metadata": {
            "persona": "tutor",
            "subject": "geography",
            "difficulty": "easy",
            "agent_type": "mock"
        }
    }

@pytest.fixture
def mock_validation_result() -> dict:
    """Mock validation result for testing."""
    return {
        "correct": True,
        "score": 1.0,
        "feedback": "Excellent! You got it right!",
        "explanation": "Perfect answer"
    }

# Test markers
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "e2e: End-to-end tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "analytics: Analytics related tests")
    config.addinivalue_line("markers", "agent: Agent system tests")
    config.addinivalue_line("markers", "validation: Validation system tests")
    config.addinivalue_line("markers", "router: Agent router tests")
