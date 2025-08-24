# api/routes/challenge.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.core.db import get_db
from api.core.settings import SESSION_TTL_SEC, AGENT_DEFAULT_PERSONA
from api.integrations.router import agent_router
from api.integrations.validation import answer_validator
from api.integrations.types import AgentContext, PersonaType, SubjectType, DifficultyLevel
from api.repositories.challenges import load_challenge, decrement_attempts, set_status, create_challenge
from api.repositories.sessions import create_session
from api.repositories.commands import enqueue_grant_session
from api.repositories.analytics import AnalyticsRepository
from api.schemas.challenge import ChallengeAnswerIn, ChallengeApprovedOut, ChallengePendingOut, ChallengeGenerateIn, ChallengeGenerateOut, ChallengeContinueOut
from utils.logger import agent_logger
import time

router = APIRouter()

@router.get("/agents/available")
async def get_available_agents(persona: str = None):
    """Get list of available agents, optionally filtered by persona."""
    try:
        persona_enum = PersonaType(persona) if persona else None
        agents = agent_router.get_available_agents(persona_enum)
        return {"agents": agents}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid persona: {persona}")

@router.get("/agents/policy/{persona}")
async def get_persona_policy(persona: str):
    """Get the policy configuration for a specific persona."""
    try:
        persona_enum = PersonaType(persona)
        policy = agent_router.get_persona_policy(persona_enum)
        return {"persona": persona, "policy": policy}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid persona: {persona}")

@router.post("/validation/test")
async def test_validation(
    question: dict,
    student_answer: str,
    correct_answer: str,
    persona: str = "general",
    subject: str = "math"
):
    """Test the validation system with custom inputs."""
    try:
        persona_enum = PersonaType(persona)
        subject_enum = SubjectType(subject)
        
        # Create a mock question structure
        question_obj = {
            "id": "test",
            "type": "mc",
            "prompt": question.get("prompt", "Test question?"),
            "options": question.get("options", []),
            "answer_len": question.get("answer_len"),
            "subject": subject_enum,
            "difficulty": DifficultyLevel.EASY,
            "explanation": question.get("explanation", "")
        }
        
        # Test validation
        result = answer_validator.validate_answer(
            question=question_obj,
            student_answer=student_answer,
            correct_answer=correct_answer,
            persona=persona_enum,
            subject=subject_enum
        )
        
        return {
            "question": question_obj,
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "persona": persona,
            "subject": subject,
            "validation_result": result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@router.post("/challenge/generate", response_model=ChallengeGenerateOut)
async def generate_challenge(body: ChallengeGenerateIn, db: Session = Depends(get_db)):
    """Generate a new challenge using the agent router."""
    start_time = time.time()
    
    try:
        # Build context
        context = AgentContext(
            locale=body.locale or "pt-BR",
            mac=body.mac,
            router_id=body.router_id,
            persona=PersonaType(body.persona) if body.persona else PersonaType(AGENT_DEFAULT_PERSONA),
            subject=SubjectType(body.subject) if body.subject else None,
            difficulty=DifficultyLevel(body.difficulty) if body.difficulty else None,
            previous_performance=body.previous_performance
        )
        
        # Select appropriate agent using router
        agent = agent_router.select_agent(context)
        
        # Generate challenge
        challenge_payload = await agent.generate_challenge(context)
        
        # Store challenge in database
        challenge = create_challenge(
            db=db,
            mac=body.mac,
            router_id=body.router_id,
            payload=challenge_payload
        )
        
        # Track agent performance
        response_time = time.time() - start_time
        analytics_repo = AnalyticsRepository(db)
        analytics_repo.update_agent_performance(
            agent_type=challenge_payload["metadata"]["agent_type"],
            persona=challenge_payload["metadata"]["persona"],
            model=challenge_payload["metadata"].get("model", "unknown"),
            performance_data={
                "successful": True,
                "response_time": response_time,
                "subject": challenge_payload["metadata"]["subject"],
                "difficulty": challenge_payload["metadata"]["difficulty"]
            }
        )
        
        return ChallengeGenerateOut(
            challenge_id=challenge.id,
            questions=challenge_payload["questions"],
            metadata=challenge_payload["metadata"]
        )
        
    except Exception as e:
        # Track failed agent performance
        response_time = time.time() - start_time
        try:
            analytics_repo = AnalyticsRepository(db)
            analytics_repo.update_agent_performance(
                agent_type="unknown",
                persona=body.persona or AGENT_DEFAULT_PERSONA,
                model="unknown",
                performance_data={
                    "successful": False,
                    "response_time": response_time,
                    "error": str(e)
                }
            )
        except:
            pass  # Don't let analytics errors break the main flow
        
        raise HTTPException(status_code=500, detail=f"Failed to generate challenge: {str(e)}")

@router.post("/challenge/answer", response_model=ChallengeApprovedOut | ChallengePendingOut | ChallengeContinueOut)
async def challenge_answer(body: ChallengeAnswerIn, db: Session = Depends(get_db)):
    start_time = time.time()
    
    ch = load_challenge(db, body.challenge_id)
    if not ch:
        raise HTTPException(status_code=404, detail="challenge_not_found")
    if ch.status != "open":
        raise HTTPException(status_code=400, detail="challenge_closed")

    # Get the persona from the challenge metadata to select the same agent
    persona = PersonaType(ch.payload.get("metadata", {}).get("persona", AGENT_DEFAULT_PERSONA))
    
    # Create context for agent selection
    context = AgentContext(
        locale="pt-BR",
        mac=ch.mac,
        router_id=ch.router_id,
        persona=persona
    )
    
    # Select appropriate agent using router
    agent = agent_router.select_agent(context)
    
    # IMPORTANT: Validate against the CURRENT question payload, not stale data
    current_payload = ch.payload.copy()  # Work with current payload
    
    # Debug: Log the current question being validated
    current_question = current_payload.get("questions", [{}])[0]
    agent_logger.info(f"[DEBUG] Validating against question: '{current_question.get('prompt', 'No prompt')}' for answer: '{body.answers[0].value if body.answers else 'No answer'}'")
    
    validation_result = await agent.validate_answers(current_payload, [a.dict() for a in body.answers])
    
    # Get session progress from challenge payload
    session_progress = ch.payload.get("session_progress", {
        "questions_answered_correctly": 0,
        "total_questions_required": 2,
        "questions_attempted": 0
    })
    
    # Update progress
    session_progress["questions_attempted"] += 1
    if validation_result["correct"]:
        session_progress["questions_answered_correctly"] += 1
    
    # Debug session progress
    agent_logger.info(f"[DEBUG] Session progress: {session_progress['questions_answered_correctly']}/{session_progress['total_questions_required']} correct, {session_progress['questions_attempted']} attempted")
    
    # Calculate timing
    response_time = time.time() - start_time
    
    # Update challenge payload with new progress
    # IMPORTANT: For SQLAlchemy JSON fields, we need to create a new dict to trigger change detection
    updated_progress_payload = ch.payload.copy()
    updated_progress_payload["session_progress"] = session_progress
    ch.payload = updated_progress_payload
    db.add(ch)
    db.commit()
    
    # Check if enough questions answered correctly
    if session_progress["questions_answered_correctly"] >= session_progress["total_questions_required"]:
        agent_logger.info(f"[DEBUG] ALLOW condition met: {session_progress['questions_answered_correctly']} >= {session_progress['total_questions_required']}")
    else:
        agent_logger.info(f"[DEBUG] CONTINUE condition: {session_progress['questions_answered_correctly']} < {session_progress['total_questions_required']}")
        
    if session_progress["questions_answered_correctly"] >= session_progress["total_questions_required"]:
        # Grant access - session complete
        set_status(db, ch, "passed")
        sess = create_session(db, ch.mac, ch.router_id, ttl_sec=SESSION_TTL_SEC)
        enqueue_grant_session(db, ch.router_id, ch.mac, SESSION_TTL_SEC)
        
        return ChallengeApprovedOut(
            decision="ALLOW", 
            allowed_minutes=SESSION_TTL_SEC//60, 
            session_id=sess.id,
            feedback=validation_result.get("feedback", "🎉 Parabéns! Você conseguiu acesso à internet!")
        )
    
    # Check if max attempts reached
    if ch.attempts_left <= 1:  # Last attempt used
        decrement_attempts(db, ch)
        set_status(db, ch, "failed")
        return ChallengePendingOut(
            decision="DENY", 
            attempts_left=0, 
            reason="max_attempts_reached",
            feedback="❌ Tentativas esgotadas. Tente novamente mais tarde."
        )
    
    # Handle incorrect answers
    if not validation_result["correct"]:
        decrement_attempts(db, ch)  # Wrong answer decrements attempts
        # For wrong answers, keep the same question for retry
        return ChallengePendingOut(
            decision="DENY", 
            attempts_left=ch.attempts_left - 1, 
            reason="incorrect_answer",
            feedback=validation_result.get("feedback", "❌ Resposta incorreta. Tente novamente.")
        )
    
    # Answer was correct - need to generate next question since we haven't reached the required total
    next_challenge = await agent.generate_challenge(context)
    
    # Update challenge with new question while preserving session progress
    # IMPORTANT: For SQLAlchemy JSON fields, we need to create a new dict to trigger change detection
    updated_payload = ch.payload.copy()
    updated_payload["questions"] = next_challenge["questions"]
    updated_payload["answer_key"] = next_challenge["answer_key"]
    # Keep the existing session_progress (already updated above)
    
    # Assign the new dict to trigger SQLAlchemy change detection
    ch.payload = updated_payload
    db.add(ch)
    db.commit()
    
    # Log what we just saved to the database
    saved_question = updated_payload.get("questions", [{}])[0]
    agent_logger.info(f"[DEBUG] Updated database with NEW question: '{saved_question.get('prompt', 'No prompt')}'")
    
    return ChallengeContinueOut(
        decision="CONTINUE",
        challenge_id=ch.id,
        questions=next_challenge["questions"],
        feedback=validation_result.get("feedback", "✅ Correto! Aqui está sua próxima pergunta:"),
        progress={
            "questions_answered_correctly": session_progress["questions_answered_correctly"],
            "total_questions_required": session_progress["total_questions_required"],
            "questions_attempted": session_progress["questions_attempted"]
        }
    )
