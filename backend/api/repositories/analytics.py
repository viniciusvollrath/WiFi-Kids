# api/repositories/analytics.py
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta

from api.db.analytics import (
    StudentPerformance, 
    ChallengeAnalytics, 
    LearningPath, 
    AgentPerformance, 
    SystemMetrics
)
from api.db.models import Challenge
from api.integrations.types import PersonaType, SubjectType, DifficultyLevel
from utils.logger import agent_logger

class AnalyticsRepository:
    """Repository for managing analytics and performance data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Student Performance Methods
    def get_or_create_student_performance(self, mac: str, router_id: str) -> StudentPerformance:
        """Get existing student performance or create new one."""
        performance = self.db.query(StudentPerformance).filter(
            and_(
                StudentPerformance.mac_address == mac,
                StudentPerformance.router_id == router_id
            )
        ).first()
        
        if not performance:
            performance = StudentPerformance(
                mac_address=mac,
                router_id=router_id
            )
            self.db.add(performance)
            self.db.commit()
            self.db.refresh(performance)
        
        return performance
    
    def update_student_performance(
        self, 
        mac: str, 
        router_id: str, 
        challenge_result: Dict[str, Any]
    ) -> StudentPerformance:
        """Update student performance after a challenge."""
        performance = self.get_or_create_student_performance(mac, router_id)
        
        # Update basic metrics
        performance.total_challenges += 1
        if challenge_result["passed"]:
            performance.successful_challenges += 1
            performance.learning_streak += 1
            if performance.learning_streak > performance.best_streak:
                performance.best_streak = performance.learning_streak
        else:
            performance.failed_challenges += 1
            performance.learning_streak = 0
        
        # Update average score
        total_score = performance.average_score * (performance.total_challenges - 1) + challenge_result["score"]
        performance.average_score = total_score / performance.total_challenges
        
        # Update subject performance
        subject = challenge_result.get("subject", "unknown")
        if subject not in performance.subject_performance:
            performance.subject_performance[subject] = {
                "correct": 0,
                "total": 0,
                "avg_score": 0.0
            }
        
        subject_data = performance.subject_performance[subject]
        subject_data["total"] += 1
        if challenge_result["passed"]:
            subject_data["correct"] += 1
        
        # Update subject average score
        total_subject_score = subject_data["avg_score"] * (subject_data["total"] - 1) + challenge_result["score"]
        subject_data["avg_score"] = total_subject_score / subject_data["total"]
        
        # Update difficulty history
        difficulty_entry = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "difficulty": challenge_result.get("difficulty", "easy"),
            "score": challenge_result["score"]
        }
        performance.difficulty_history.append(difficulty_entry)
        
        # Update last activity
        performance.last_activity = datetime.now()
        
        self.db.commit()
        self.db.refresh(performance)
        return performance
    
    def get_student_analytics(self, mac: str, router_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics for a student."""
        performance = self.get_or_create_student_performance(mac, router_id)
        
        # Get recent challenges
        recent_challenges = self.db.query(ChallengeAnalytics).filter(
            and_(
                ChallengeAnalytics.mac_address == mac,
                ChallengeAnalytics.router_id == router_id
            )
        ).order_by(desc(ChallengeAnalytics.created_at)).limit(10).all()
        
        # Get learning path
        learning_path = self.db.query(LearningPath).filter(
            and_(
                LearningPath.mac_address == mac,
                LearningPath.router_id == router_id
            )
        ).first()
        
        return {
            "performance": {
                "total_challenges": performance.total_challenges,
                "successful_challenges": performance.successful_challenges,
                "failed_challenges": performance.failed_challenges,
                "average_score": performance.average_score,
                "learning_streak": performance.learning_streak,
                "best_streak": performance.best_streak,
                "current_difficulty": performance.current_difficulty,
                "last_activity": performance.last_activity.isoformat() if performance.last_activity else None
            },
            "subject_performance": performance.subject_performance,
            "difficulty_history": performance.difficulty_history[-10:],  # Last 10 entries
            "recent_challenges": [
                {
                    "id": ca.id,
                    "subject": ca.subject,
                    "difficulty": ca.difficulty,
                    "score": ca.score,
                    "passed": ca.passed,
                    "created_at": ca.created_at.isoformat()
                }
                for ca in recent_challenges
            ],
            "learning_path": {
                "current_subject": learning_path.current_subject if learning_path else None,
                "current_difficulty": learning_path.current_difficulty if learning_path else None,
                "learning_phase": learning_path.learning_phase if learning_path else None,
                "subject_mastery": learning_path.subject_mastery if learning_path else {},
                "recommendations": {
                    "subject": learning_path.recommended_subject if learning_path else None,
                    "difficulty": learning_path.recommended_difficulty if learning_path else None,
                    "persona": learning_path.recommended_persona if learning_path else None
                } if learning_path else {}
            }
        }
    
    # Challenge Analytics Methods
    def create_challenge_analytics(
        self, 
        challenge_id: str, 
        mac: str, 
        router_id: str, 
        challenge_data: Dict[str, Any]
    ) -> ChallengeAnalytics:
        """Create analytics entry for a challenge."""
        analytics = ChallengeAnalytics(
            challenge_id=challenge_id,
            mac_address=mac,
            router_id=router_id,
            persona_used=challenge_data["persona"],
            subject=challenge_data["subject"],
            difficulty=challenge_data["difficulty"],
            agent_type=challenge_data["agent_type"],
            total_questions=challenge_data["total_questions"],
            correct_answers=challenge_data["correct_answers"],
            score=challenge_data["score"],
            passed=challenge_data["passed"],
            time_to_complete=challenge_data.get("time_to_complete"),
            time_per_question=challenge_data.get("time_per_question"),
            answer_details=challenge_data.get("answer_details", []),
            feedback_received=challenge_data.get("feedback"),
            hints_used=challenge_data.get("hints_used", 0),
            attempts_made=challenge_data.get("attempts_made", 1)
        )
        
        self.db.add(analytics)
        self.db.commit()
        self.db.refresh(analytics)
        return analytics
    
    # Learning Path Methods
    def get_or_create_learning_path(self, mac: str, router_id: str) -> LearningPath:
        """Get existing learning path or create new one."""
        learning_path = self.db.query(LearningPath).filter(
            and_(
                LearningPath.mac_address == mac,
                LearningPath.router_id == router_id
            )
        ).first()
        
        if not learning_path:
            learning_path = LearningPath(
                mac_address=mac,
                router_id=router_id,
                current_subject="math",
                current_difficulty="easy"
            )
            self.db.add(learning_path)
            self.db.commit()
            self.db.refresh(learning_path)
        
        return learning_path
    
    def update_learning_path(
        self, 
        mac: str, 
        router_id: str, 
        performance_data: Dict[str, Any]
    ) -> LearningPath:
        """Update learning path based on performance."""
        learning_path = self.get_or_create_learning_path(mac, router_id)
        
        # Update subject mastery
        subject = performance_data.get("subject", "math")
        score = performance_data.get("score", 0.0)
        
        if subject not in learning_path.subject_mastery:
            learning_path.subject_mastery[subject] = 0.0
        
        # Update mastery level (weighted average)
        current_mastery = learning_path.subject_mastery[subject]
        new_mastery = (current_mastery * 0.7) + (score * 0.3)  # 70% history, 30% new
        learning_path.subject_mastery[subject] = min(new_mastery, 1.0)
        
        # Update current subject and difficulty
        learning_path.current_subject = subject
        learning_path.current_difficulty = performance_data.get("difficulty", "easy")
        
        # Determine learning phase
        avg_mastery = sum(learning_path.subject_mastery.values()) / len(learning_path.subject_mastery)
        if avg_mastery >= 0.8:
            learning_path.learning_phase = "advanced"
        elif avg_mastery >= 0.5:
            learning_path.learning_phase = "intermediate"
        else:
            learning_path.learning_phase = "beginner"
        
        # Generate recommendations
        self._generate_recommendations(learning_path)
        
        # Check for achievements
        self._check_achievements(learning_path, performance_data)
        
        self.db.commit()
        self.db.refresh(learning_path)
        return learning_path
    
    def _generate_recommendations(self, learning_path: LearningPath) -> None:
        """Generate learning recommendations."""
        # Find weakest subject
        weakest_subject = min(learning_path.subject_mastery.items(), key=lambda x: x[1])
        
        # Recommend subject with lowest mastery
        learning_path.recommended_subject = weakest_subject[0]
        
        # Recommend difficulty based on current performance
        avg_mastery = sum(learning_path.subject_mastery.values()) / len(learning_path.subject_mastery)
        if avg_mastery >= 0.8:
            learning_path.recommended_difficulty = "hard"
        elif avg_mastery >= 0.5:
            learning_path.recommended_difficulty = "medium"
        else:
            learning_path.recommended_difficulty = "easy"
        
        # Recommend persona based on learning phase
        if learning_path.learning_phase == "beginner":
            learning_path.recommended_persona = "maternal"
        elif learning_path.learning_phase == "intermediate":
            learning_path.recommended_persona = "general"
        else:
            learning_path.recommended_persona = "tutor"
    
    def _check_achievements(self, learning_path: LearningPath, performance_data: Dict[str, Any]) -> None:
        """Check and award achievements."""
        achievements = learning_path.achievements or []
        
        # Math Master achievement
        if (learning_path.subject_mastery.get("math", 0) >= 0.9 and 
            "math_master" not in [a.get("achievement") for a in achievements]):
            achievements.append({
                "achievement": "math_master",
                "earned_at": datetime.now().strftime("%Y-%m-%d"),
                "description": "Mastered mathematics with 90%+ proficiency"
            })
        
        # Streak achievements
        if performance_data.get("learning_streak", 0) >= 5 and "streak_master" not in [a.get("achievement") for a in achievements]:
            achievements.append({
                "achievement": "streak_master",
                "earned_at": datetime.now().strftime("%Y-%m-%d"),
                "description": "Completed 5 challenges in a row"
            })
        
        learning_path.achievements = achievements
    
    # Agent Performance Methods
    def update_agent_performance(
        self, 
        agent_type: str, 
        persona: str, 
        model: str, 
        performance_data: Dict[str, Any]
    ) -> AgentPerformance:
        """Update agent performance metrics."""
        agent_perf = self.db.query(AgentPerformance).filter(
            and_(
                AgentPerformance.agent_type == agent_type,
                AgentPerformance.persona == persona,
                AgentPerformance.model_used == model
            )
        ).first()
        
        if not agent_perf:
            agent_perf = AgentPerformance(
                agent_type=agent_type,
                persona=persona,
                model_used=model
            )
            self.db.add(agent_perf)
        
        # Update metrics
        agent_perf.total_challenges_generated += 1
        if performance_data.get("successful"):
            agent_perf.successful_validations += 1
        else:
            agent_perf.failed_validations += 1
        
        # Update average response time
        response_time = performance_data.get("response_time", 0.0)
        total_time = agent_perf.average_response_time * (agent_perf.total_challenges_generated - 1) + response_time
        agent_perf.average_response_time = total_time / agent_perf.total_challenges_generated
        
        # Update student score
        student_score = performance_data.get("student_score", 0.0)
        total_score = agent_perf.average_student_score * (agent_perf.total_challenges_generated - 1) + student_score
        agent_perf.average_student_score = total_score / agent_perf.total_challenges_generated
        
        # Update usage by subject
        subject = performance_data.get("subject", "unknown")
        if subject not in agent_perf.usage_by_subject:
            agent_perf.usage_by_subject[subject] = 0
        agent_perf.usage_by_subject[subject] += 1
        
        # Update usage by difficulty
        difficulty = performance_data.get("difficulty", "easy")
        if difficulty not in agent_perf.usage_by_difficulty:
            agent_perf.usage_by_difficulty[difficulty] = 0
        agent_perf.usage_by_difficulty[difficulty] += 1
        
        self.db.commit()
        self.db.refresh(agent_perf)
        return agent_perf
    
    # System Metrics Methods
    def record_system_metrics(self, metrics_data: Dict[str, Any]) -> SystemMetrics:
        """Record system-wide metrics."""
        date = datetime.now().strftime("%Y-%m-%d")
        hour = datetime.now().hour
        
        # Check if metrics for this hour already exist
        system_metrics = self.db.query(SystemMetrics).filter(
            and_(
                SystemMetrics.date == date,
                SystemMetrics.hour == hour
            )
        ).first()
        
        if not system_metrics:
            system_metrics = SystemMetrics(
                date=date,
                hour=hour
            )
            self.db.add(system_metrics)
        
        # Update metrics
        system_metrics.total_requests += metrics_data.get("total_requests", 0)
        system_metrics.successful_requests += metrics_data.get("successful_requests", 0)
        system_metrics.failed_requests += metrics_data.get("failed_requests", 0)
        system_metrics.unique_users = max(system_metrics.unique_users, metrics_data.get("unique_users", 0))
        system_metrics.active_routers = max(system_metrics.active_routers, metrics_data.get("active_routers", 0))
        system_metrics.total_challenges_completed += metrics_data.get("challenges_completed", 0)
        
        # Update averages
        if metrics_data.get("response_time"):
            total_time = system_metrics.average_response_time * (system_metrics.total_requests - 1) + metrics_data["response_time"]
            system_metrics.average_response_time = total_time / system_metrics.total_requests
        
        if metrics_data.get("challenge_score"):
            total_score = system_metrics.average_challenge_score * (system_metrics.total_challenges_completed - 1) + metrics_data["challenge_score"]
            system_metrics.average_challenge_score = total_score / system_metrics.total_challenges_completed
        
        # Update system health
        if metrics_data.get("cpu_usage"):
            system_metrics.cpu_usage = metrics_data["cpu_usage"]
        if metrics_data.get("memory_usage"):
            system_metrics.memory_usage = metrics_data["memory_usage"]
        if metrics_data.get("database_connections"):
            system_metrics.database_connections = metrics_data["database_connections"]
        
        self.db.commit()
        self.db.refresh(system_metrics)
        return system_metrics
    
    def get_system_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get system analytics for the specified number of days."""
        start_date = datetime.now() - timedelta(days=days)
        
        metrics = self.db.query(SystemMetrics).filter(
            SystemMetrics.created_at >= start_date
        ).all()
        
        if not metrics:
            return {}
        
        # Aggregate metrics
        total_requests = sum(m.total_requests for m in metrics)
        total_challenges = sum(m.total_challenges_completed for m in metrics)
        avg_response_time = sum(m.average_response_time for m in metrics) / len(metrics)
        avg_challenge_score = sum(m.average_challenge_score for m in metrics) / len(metrics)
        
        return {
            "period_days": days,
            "total_requests": total_requests,
            "total_challenges_completed": total_challenges,
            "average_response_time": avg_response_time,
            "average_challenge_score": avg_challenge_score,
            "success_rate": (sum(m.successful_requests for m in metrics) / total_requests * 100) if total_requests > 0 else 0,
            "daily_metrics": [
                {
                    "date": m.date,
                    "requests": m.total_requests,
                    "challenges": m.total_challenges_completed,
                    "avg_score": m.average_challenge_score
                }
                for m in metrics
            ]
        }
