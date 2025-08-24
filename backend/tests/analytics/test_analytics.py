# tests/analytics/test_analytics.py
"""Tests for analytics system."""

import pytest
from api.repositories.analytics import AnalyticsRepository
from api.db.analytics import (
    StudentPerformance, 
    ChallengeAnalytics, 
    LearningPath, 
    AgentPerformance, 
    SystemMetrics
)


class TestAnalyticsRepository:
    """Test AnalyticsRepository class."""
    
    @pytest.mark.analytics
    def test_analytics_repository_creation(self, db_session):
        """Test AnalyticsRepository can be instantiated."""
        repo = AnalyticsRepository(db_session)
        assert isinstance(repo, AnalyticsRepository)
        assert repo.db == db_session
    
    @pytest.mark.analytics
    def test_get_or_create_student_performance_new(self, db_session):
        """Test creating new student performance record."""
        repo = AnalyticsRepository(db_session)
        
        performance = repo.get_or_create_student_performance(
            mac="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff"
        )
        
        assert isinstance(performance, StudentPerformance)
        assert performance.mac_address == "11:22:33:44:55:66"
        assert performance.router_id == "aa:bb:cc:dd:ee:ff"
        assert performance.total_challenges == 0
        assert performance.average_score == 0.0
        assert performance.learning_streak == 0
    
    @pytest.mark.analytics
    def test_get_or_create_student_performance_existing(self, db_session, create_student_performance):
        """Test getting existing student performance record."""
        repo = AnalyticsRepository(db_session)
        
        # Create initial performance
        initial_performance = create_student_performance
        
        # Get the same performance again
        performance = repo.get_or_create_student_performance(
            mac=initial_performance.mac_address,
            router_id=initial_performance.router_id
        )
        
        assert performance.id == initial_performance.id
        assert performance.total_challenges == initial_performance.total_challenges
    
    @pytest.mark.analytics
    def test_update_student_performance_success(self, db_session, create_student_performance):
        """Test updating student performance with successful challenge."""
        repo = AnalyticsRepository(db_session)
        performance = create_student_performance
        
        # Update with successful challenge
        updated_performance = repo.update_student_performance(
            mac=performance.mac_address,
            router_id=performance.router_id,
            challenge_result={
                "passed": True,
                "score": 0.85,
                "subject": "math",
                "difficulty": "medium"
            }
        )
        
        assert updated_performance.total_challenges == performance.total_challenges + 1
        assert updated_performance.successful_challenges == performance.successful_challenges + 1
        assert updated_performance.learning_streak == performance.learning_streak + 1
        assert updated_performance.average_score > 0.0
        assert "math" in updated_performance.subject_performance
    
    @pytest.mark.analytics
    def test_update_student_performance_failure(self, db_session, create_student_performance):
        """Test updating student performance with failed challenge."""
        repo = AnalyticsRepository(db_session)
        performance = create_student_performance
        
        # Update with failed challenge
        updated_performance = repo.update_student_performance(
            mac=performance.mac_address,
            router_id=performance.router_id,
            challenge_result={
                "passed": False,
                "score": 0.3,
                "subject": "history",
                "difficulty": "hard"
            }
        )
        
        assert updated_performance.total_challenges == performance.total_challenges + 1
        assert updated_performance.failed_challenges == performance.failed_challenges + 1
        assert updated_performance.learning_streak == 0  # Reset streak
        assert "history" in updated_performance.subject_performance
    
    @pytest.mark.analytics
    def test_get_student_analytics(self, db_session, create_student_performance, create_learning_path):
        """Test getting comprehensive student analytics."""
        repo = AnalyticsRepository(db_session)
        performance = create_student_performance
        learning_path = create_learning_path
        
        analytics = repo.get_student_analytics(
            mac=performance.mac_address,
            router_id=performance.router_id
        )
        
        assert isinstance(analytics, dict)
        assert "performance" in analytics
        assert "subject_performance" in analytics
        assert "difficulty_history" in analytics
        assert "recent_challenges" in analytics
        assert "learning_path" in analytics
        
        # Check performance data
        perf_data = analytics["performance"]
        assert perf_data["total_challenges"] == performance.total_challenges
        assert perf_data["successful_challenges"] == performance.successful_challenges
        assert perf_data["average_score"] == performance.average_score
        
        # Check learning path data
        learning_data = analytics["learning_path"]
        assert learning_data["current_subject"] == learning_path.current_subject
        assert learning_data["current_difficulty"] == learning_path.current_difficulty
        assert learning_data["learning_phase"] == learning_path.learning_phase
    
    @pytest.mark.analytics
    def test_create_challenge_analytics(self, db_session, create_challenge):
        """Test creating challenge analytics."""
        repo = AnalyticsRepository(db_session)
        challenge = create_challenge
        
        analytics = repo.create_challenge_analytics(
            challenge_id=challenge.id,
            mac=challenge.mac,
            router_id=challenge.router_id,
            challenge_data={
                "persona": "tutor",
                "subject": "math",
                "difficulty": "medium",
                "agent_type": "langchain",
                "total_questions": 3,
                "correct_answers": 2,
                "score": 0.67,
                "passed": True,
                "time_to_complete": 120000,
                "time_per_question": 40.0,
                "feedback": "Great job!",
                "attempts_made": 1
            }
        )
        
        assert isinstance(analytics, ChallengeAnalytics)
        assert analytics.challenge_id == challenge.id
        assert analytics.mac_address == challenge.mac
        assert analytics.persona_used == "tutor"
        assert analytics.subject == "math"
        assert analytics.difficulty == "medium"
        assert analytics.agent_type == "langchain"
        assert analytics.total_questions == 3
        assert analytics.correct_answers == 2
        assert analytics.score == 0.67
        assert analytics.passed is True
        assert analytics.time_to_complete == 120000
        assert analytics.feedback_received == "Great job!"
    
    @pytest.mark.analytics
    def test_update_learning_path(self, db_session, create_learning_path):
        """Test updating learning path."""
        repo = AnalyticsRepository(db_session)
        learning_path = create_learning_path
        
        updated_path = repo.update_learning_path(
            mac=learning_path.mac_address,
            router_id=learning_path.router_id,
            performance_data={
                "subject": "math",
                "score": 0.85,
                "difficulty": "medium"
            }
        )
        
        assert updated_path.current_subject == "math"
        assert updated_path.current_difficulty == "medium"
        assert "math" in updated_path.subject_mastery
        assert updated_path.subject_mastery["math"] > 0.0
        assert updated_path.recommended_subject is not None
        assert updated_path.recommended_difficulty is not None
        assert updated_path.recommended_persona is not None
    
    @pytest.mark.analytics
    def test_update_agent_performance(self, db_session):
        """Test updating agent performance."""
        repo = AnalyticsRepository(db_session)
        
        agent_perf = repo.update_agent_performance(
            agent_type="langchain",
            persona="tutor",
            model="gpt-5",
            performance_data={
                "successful": True,
                "response_time": 2.5,
                "student_score": 0.85,
                "subject": "math",
                "difficulty": "medium"
            }
        )
        
        assert isinstance(agent_perf, AgentPerformance)
        assert agent_perf.agent_type == "langchain"
        assert agent_perf.persona == "tutor"
        assert agent_perf.model_used == "gpt-5"
        assert agent_perf.total_challenges_generated == 1
        assert agent_perf.successful_validations == 1
        assert agent_perf.average_response_time == 2.5
        assert agent_perf.average_student_score == 0.85
        assert "math" in agent_perf.usage_by_subject
        assert "medium" in agent_perf.usage_by_difficulty
    
    @pytest.mark.analytics
    def test_record_system_metrics(self, db_session):
        """Test recording system metrics."""
        repo = AnalyticsRepository(db_session)
        
        metrics = repo.record_system_metrics({
            "total_requests": 100,
            "successful_requests": 95,
            "failed_requests": 5,
            "unique_users": 25,
            "active_routers": 3,
            "response_time": 1.2,
            "challenges_completed": 50,
            "challenge_score": 0.78,
            "cpu_usage": 45.5,
            "memory_usage": 67.2,
            "database_connections": 12
        })
        
        assert isinstance(metrics, SystemMetrics)
        assert metrics.total_requests == 100
        assert metrics.successful_requests == 95
        assert metrics.failed_requests == 5
        assert metrics.unique_users == 25
        assert metrics.active_routers == 3
        assert metrics.average_response_time == 1.2
        assert metrics.total_challenges_completed == 50
        assert metrics.average_challenge_score == 0.78
        assert metrics.cpu_usage == 45.5
        assert metrics.memory_usage == 67.2
        assert metrics.database_connections == 12
    
    @pytest.mark.analytics
    def test_get_system_analytics(self, db_session):
        """Test getting system analytics."""
        repo = AnalyticsRepository(db_session)
        
        # Record some metrics first
        repo.record_system_metrics({
            "total_requests": 100,
            "successful_requests": 95,
            "challenges_completed": 50,
            "challenge_score": 0.78
        })
        
        analytics = repo.get_system_analytics(days=1)
        
        assert isinstance(analytics, dict)
        assert "period_days" in analytics
        assert "total_requests" in analytics
        assert "total_challenges_completed" in analytics
        assert "average_response_time" in analytics
        assert "average_challenge_score" in analytics
        assert "success_rate" in analytics
        assert "daily_metrics" in analytics


class TestAnalyticsModels:
    """Test analytics models."""
    
    @pytest.mark.analytics
    def test_student_performance_model(self, db_session):
        """Test StudentPerformance model."""
        performance = StudentPerformance(
            mac_address="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff",
            total_challenges=5,
            successful_challenges=4,
            failed_challenges=1,
            average_score=0.8,
            learning_streak=3,
            subject_performance={"math": {"correct": 2, "total": 3, "avg_score": 0.67}},
            difficulty_history=[{"date": "2024-01-01", "difficulty": "medium", "score": 0.8}]
        )
        
        db_session.add(performance)
        db_session.commit()
        db_session.refresh(performance)
        
        assert performance.id is not None
        assert performance.mac_address == "11:22:33:44:55:66"
        assert performance.total_challenges == 5
        assert performance.average_score == 0.8
        assert performance.learning_streak == 3
        assert "math" in performance.subject_performance
        assert len(performance.difficulty_history) == 1
    
    @pytest.mark.analytics
    def test_challenge_analytics_model(self, db_session, create_challenge):
        """Test ChallengeAnalytics model."""
        challenge = create_challenge
        
        analytics = ChallengeAnalytics(
            challenge_id=challenge.id,
            mac_address=challenge.mac,
            router_id=challenge.router_id,
            persona_used="tutor",
            subject="math",
            difficulty="medium",
            agent_type="langchain",
            total_questions=3,
            correct_answers=2,
            score=0.67,
            passed=True,
            time_to_complete=120000,
            time_per_question=40.0,
            feedback_received="Great job!",
            attempts_made=1
        )
        
        db_session.add(analytics)
        db_session.commit()
        db_session.refresh(analytics)
        
        assert analytics.id is not None
        assert analytics.challenge_id == challenge.id
        assert analytics.persona_used == "tutor"
        assert analytics.score == 0.67
        assert analytics.passed is True
    
    @pytest.mark.analytics
    def test_learning_path_model(self, db_session):
        """Test LearningPath model."""
        learning_path = LearningPath(
            mac_address="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff",
            current_subject="math",
            current_difficulty="medium",
            learning_phase="intermediate",
            subject_mastery={"math": 0.75, "history": 0.45},
            recommended_subject="history",
            recommended_difficulty="easy",
            recommended_persona="maternal",
            learning_goals=[{"goal": "master_math", "progress": 0.8, "target": 0.9}],
            achievements=[{"achievement": "math_master", "earned_at": "2024-01-01"}]
        )
        
        db_session.add(learning_path)
        db_session.commit()
        db_session.refresh(learning_path)
        
        assert learning_path.id is not None
        assert learning_path.current_subject == "math"
        assert learning_path.learning_phase == "intermediate"
        assert "math" in learning_path.subject_mastery
        assert learning_path.recommended_subject == "history"
        assert len(learning_path.learning_goals) == 1
        assert len(learning_path.achievements) == 1
    
    @pytest.mark.analytics
    def test_agent_performance_model(self, db_session):
        """Test AgentPerformance model."""
        agent_perf = AgentPerformance(
            agent_type="langchain",
            persona="tutor",
            model_used="gpt-5",
            total_challenges_generated=10,
            successful_validations=8,
            failed_validations=2,
            average_response_time=2.5,
            average_student_score=0.85,
            usage_by_subject={"math": 5, "history": 3, "geography": 2},
            usage_by_difficulty={"easy": 3, "medium": 5, "hard": 2}
        )
        
        db_session.add(agent_perf)
        db_session.commit()
        db_session.refresh(agent_perf)
        
        assert agent_perf.id is not None
        assert agent_perf.agent_type == "langchain"
        assert agent_perf.persona == "tutor"
        assert agent_perf.total_challenges_generated == 10
        assert agent_perf.average_response_time == 2.5
        assert "math" in agent_perf.usage_by_subject
        assert "medium" in agent_perf.usage_by_difficulty
    
    @pytest.mark.analytics
    def test_system_metrics_model(self, db_session):
        """Test SystemMetrics model."""
        metrics = SystemMetrics(
            date="2024-01-01",
            hour=12,
            total_requests=1000,
            successful_requests=950,
            failed_requests=50,
            unique_users=100,
            active_routers=5,
            average_response_time=1.2,
            total_challenges_completed=500,
            average_challenge_score=0.78,
            most_popular_subject="math",
            most_popular_persona="tutor",
            cpu_usage=45.5,
            memory_usage=67.2,
            database_connections=12
        )
        
        db_session.add(metrics)
        db_session.commit()
        db_session.refresh(metrics)
        
        assert metrics.id is not None
        assert metrics.date == "2024-01-01"
        assert metrics.hour == 12
        assert metrics.total_requests == 1000
        assert metrics.successful_requests == 950
        assert metrics.average_response_time == 1.2
        assert metrics.most_popular_subject == "math"
        assert metrics.cpu_usage == 45.5
