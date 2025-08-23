# api/routes/analytics.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from api.core.db import get_db
from api.repositories.analytics import AnalyticsRepository
from api.schemas.analytics import (
    StudentAnalyticsOut,
    ChallengeAnalyticsIn,
    ChallengeAnalyticsOut,
    AgentPerformanceOut,
    SystemAnalyticsOut,
    AnalyticsFilterIn,
    PerformanceUpdateIn,
    LearningPathUpdateIn,
    AgentPerformanceUpdateIn,
    SystemMetricsUpdateIn
)
from utils.logger import agent_logger

router = APIRouter()

# Student Analytics Endpoints
@router.get("/students/{mac}/analytics", response_model=StudentAnalyticsOut)
async def get_student_analytics(
    mac: str,
    router_id: str = Query(..., description="Router ID"),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for a specific student."""
    try:
        analytics_repo = AnalyticsRepository(db)
        analytics = analytics_repo.get_student_analytics(mac, router_id)
        return analytics
    except Exception as e:
        agent_logger.error(f"Error getting student analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get student analytics: {str(e)}")

@router.post("/students/performance/update")
async def update_student_performance(
    data: PerformanceUpdateIn,
    db: Session = Depends(get_db)
):
    """Update student performance after a challenge."""
    try:
        analytics_repo = AnalyticsRepository(db)
        performance = analytics_repo.update_student_performance(
            data.mac,
            data.router_id,
            data.challenge_result
        )
        return {"message": "Performance updated successfully", "student_id": performance.id}
    except Exception as e:
        agent_logger.error(f"Error updating student performance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update performance: {str(e)}")

@router.post("/students/learning-path/update")
async def update_learning_path(
    data: LearningPathUpdateIn,
    db: Session = Depends(get_db)
):
    """Update learning path based on performance."""
    try:
        analytics_repo = AnalyticsRepository(db)
        learning_path = analytics_repo.update_learning_path(
            data.mac,
            data.router_id,
            data.performance_data
        )
        return {"message": "Learning path updated successfully", "learning_path_id": learning_path.id}
    except Exception as e:
        agent_logger.error(f"Error updating learning path: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update learning path: {str(e)}")

# Challenge Analytics Endpoints
@router.post("/challenges/analytics", response_model=ChallengeAnalyticsOut)
async def create_challenge_analytics(
    data: ChallengeAnalyticsIn,
    db: Session = Depends(get_db)
):
    """Create analytics entry for a challenge."""
    try:
        analytics_repo = AnalyticsRepository(db)
        analytics = analytics_repo.create_challenge_analytics(
            data.challenge_id,
            data.mac,
            data.router_id,
            {
                "persona": data.persona,
                "subject": data.subject,
                "difficulty": data.difficulty,
                "agent_type": data.agent_type,
                "total_questions": data.total_questions,
                "correct_answers": data.correct_answers,
                "score": data.score,
                "passed": data.passed,
                "time_to_complete": data.time_to_complete,
                "time_per_question": data.time_per_question,
                "answer_details": data.answer_details,
                "feedback": data.feedback,
                "hints_used": data.hints_used,
                "attempts_made": data.attempts_made
            }
        )
        return analytics
    except Exception as e:
        agent_logger.error(f"Error creating challenge analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create challenge analytics: {str(e)}")

@router.get("/challenges/analytics", response_model=List[ChallengeAnalyticsOut])
async def get_challenge_analytics(
    mac: Optional[str] = Query(None, description="Filter by MAC address"),
    router_id: Optional[str] = Query(None, description="Filter by router ID"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    persona: Optional[str] = Query(None, description="Filter by persona"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    limit: int = Query(100, description="Limit number of results"),
    db: Session = Depends(get_db)
):
    """Get challenge analytics with optional filters."""
    try:
        analytics_repo = AnalyticsRepository(db)
        
        # Build filter conditions
        filters = {}
        if mac:
            filters["mac_address"] = mac
        if router_id:
            filters["router_id"] = router_id
        if subject:
            filters["subject"] = subject
        if persona:
            filters["persona_used"] = persona
        if difficulty:
            filters["difficulty"] = difficulty
        if agent_type:
            filters["agent_type"] = agent_type
        
        # Query challenge analytics
        from api.db.analytics import ChallengeAnalytics
        query = db.query(ChallengeAnalytics)
        
        for key, value in filters.items():
            query = query.filter(getattr(ChallengeAnalytics, key) == value)
        
        analytics = query.order_by(ChallengeAnalytics.created_at.desc()).limit(limit).all()
        
        return analytics
    except Exception as e:
        agent_logger.error(f"Error getting challenge analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get challenge analytics: {str(e)}")

# Agent Performance Endpoints
@router.post("/agents/performance/update")
async def update_agent_performance(
    data: AgentPerformanceUpdateIn,
    db: Session = Depends(get_db)
):
    """Update agent performance metrics."""
    try:
        analytics_repo = AnalyticsRepository(db)
        agent_perf = analytics_repo.update_agent_performance(
            data.agent_type,
            data.persona,
            data.model,
            data.performance_data
        )
        return {"message": "Agent performance updated successfully", "agent_performance_id": agent_perf.id}
    except Exception as e:
        agent_logger.error(f"Error updating agent performance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update agent performance: {str(e)}")

@router.get("/agents/performance", response_model=List[AgentPerformanceOut])
async def get_agent_performance(
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    persona: Optional[str] = Query(None, description="Filter by persona"),
    db: Session = Depends(get_db)
):
    """Get agent performance metrics."""
    try:
        from api.db.analytics import AgentPerformance
        
        query = db.query(AgentPerformance)
        
        if agent_type:
            query = query.filter(AgentPerformance.agent_type == agent_type)
        if persona:
            query = query.filter(AgentPerformance.persona == persona)
        
        agent_performance = query.order_by(AgentPerformance.updated_at.desc()).all()
        return agent_performance
    except Exception as e:
        agent_logger.error(f"Error getting agent performance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent performance: {str(e)}")

# System Analytics Endpoints
@router.post("/system/metrics/update")
async def update_system_metrics(
    data: SystemMetricsUpdateIn,
    db: Session = Depends(get_db)
):
    """Update system-wide metrics."""
    try:
        analytics_repo = AnalyticsRepository(db)
        system_metrics = analytics_repo.record_system_metrics(data.metrics_data)
        return {"message": "System metrics updated successfully", "metrics_id": system_metrics.id}
    except Exception as e:
        agent_logger.error(f"Error updating system metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update system metrics: {str(e)}")

@router.get("/system/analytics", response_model=SystemAnalyticsOut)
async def get_system_analytics(
    days: int = Query(7, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """Get system analytics for the specified period."""
    try:
        analytics_repo = AnalyticsRepository(db)
        analytics = analytics_repo.get_system_analytics(days)
        return analytics
    except Exception as e:
        agent_logger.error(f"Error getting system analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system analytics: {str(e)}")

@router.get("/system/metrics", response_model=List[SystemMetricsOut])
async def get_system_metrics(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    limit: int = Query(100, description="Limit number of results"),
    db: Session = Depends(get_db)
):
    """Get system metrics with optional date filter."""
    try:
        from api.db.analytics import SystemMetrics
        
        query = db.query(SystemMetrics)
        
        if date:
            query = query.filter(SystemMetrics.date == date)
        
        metrics = query.order_by(SystemMetrics.created_at.desc()).limit(limit).all()
        return metrics
    except Exception as e:
        agent_logger.error(f"Error getting system metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {str(e)}")

# Dashboard Endpoints
@router.get("/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary with key metrics."""
    try:
        analytics_repo = AnalyticsRepository(db)
        
        # Get system analytics for last 7 days
        system_analytics = analytics_repo.get_system_analytics(7)
        
        # Get top performing agents
        from api.db.analytics import AgentPerformance
        top_agents = db.query(AgentPerformance).order_by(
            AgentPerformance.average_student_score.desc()
        ).limit(5).all()
        
        # Get recent activity
        from api.db.analytics import ChallengeAnalytics
        recent_activity = db.query(ChallengeAnalytics).order_by(
            ChallengeAnalytics.created_at.desc()
        ).limit(10).all()
        
        return {
            "system_summary": system_analytics,
            "top_agents": [
                {
                    "agent_type": agent.agent_type,
                    "persona": agent.persona,
                    "model": agent.model_used,
                    "avg_score": agent.average_student_score,
                    "total_challenges": agent.total_challenges_generated
                }
                for agent in top_agents
            ],
            "recent_activity": [
                {
                    "id": activity.id,
                    "mac": activity.mac_address,
                    "subject": activity.subject,
                    "score": activity.score,
                    "passed": activity.passed,
                    "created_at": activity.created_at.isoformat()
                }
                for activity in recent_activity
            ]
        }
    except Exception as e:
        agent_logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

@router.get("/dashboard/trends")
async def get_dashboard_trends(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """Get trend analysis for dashboard."""
    try:
        analytics_repo = AnalyticsRepository(db)
        
        # Get system analytics for trend period
        system_analytics = analytics_repo.get_system_analytics(days)
        
        # Get subject popularity trends
        from api.db.analytics import ChallengeAnalytics
        from sqlalchemy import func
        
        subject_trends = db.query(
            ChallengeAnalytics.subject,
            func.count(ChallengeAnalytics.id).label('count')
        ).group_by(ChallengeAnalytics.subject).order_by(
            func.count(ChallengeAnalytics.id).desc()
        ).all()
        
        # Get difficulty distribution
        difficulty_trends = db.query(
            ChallengeAnalytics.difficulty,
            func.count(ChallengeAnalytics.id).label('count'),
            func.avg(ChallengeAnalytics.score).label('avg_score')
        ).group_by(ChallengeAnalytics.difficulty).all()
        
        return {
            "system_trends": system_analytics,
            "subject_popularity": [
                {"subject": trend.subject, "count": trend.count}
                for trend in subject_trends
            ],
            "difficulty_distribution": [
                {
                    "difficulty": trend.difficulty,
                    "count": trend.count,
                    "avg_score": float(trend.avg_score) if trend.avg_score else 0.0
                }
                for trend in difficulty_trends
            ]
        }
    except Exception as e:
        agent_logger.error(f"Error getting dashboard trends: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard trends: {str(e)}")
