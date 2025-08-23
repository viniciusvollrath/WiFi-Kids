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
from api.schemas.challenge import ChallengeAnswerIn, ChallengeApprovedOut, ChallengePendingOut, ChallengeGenerateIn, ChallengeGenerateOut

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
        
        return ChallengeGenerateOut(
            challenge_id=challenge.id,
            questions=challenge_payload["questions"],
            metadata=challenge_payload["metadata"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate challenge: {str(e)}")

@router.post("/challenge/answer", response_model=ChallengeApprovedOut | ChallengePendingOut)
async def challenge_answer(body: ChallengeAnswerIn, db: Session = Depends(get_db)):
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
    validation_result = await agent.validate_answers(ch.payload, [a.dict() for a in body.answers])

    if validation_result["correct"]:
        set_status(db, ch, "passed")
        sess = create_session(db, ch.mac, ch.router_id, ttl_sec=SESSION_TTL_SEC)
        enqueue_grant_session(db, ch.router_id, ch.mac, SESSION_TTL_SEC)
        return ChallengeApprovedOut(
            decision="ALLOW", 
            allowed_minutes=SESSION_TTL_SEC//60, 
            session_id=sess.id,
            feedback=validation_result.get("feedback")
        )

    # Wrong answer -> decrement attempts
    decrement_attempts(db, ch)
    reason = "wrong_answer"
    if ch.attempts_left <= 0:
        set_status(db, ch, "failed")
    
    return ChallengePendingOut(
        decision="DENY", 
        attempts_left=ch.attempts_left, 
        reason=reason,
        feedback=validation_result.get("feedback")
    )
