# api/integrations/agent.py
import random
from typing import Dict, List, Optional
from abc import ABC, abstractmethod

from api.integrations.types import (
    AgentContext, 
    ChallengePayload, 
    Answer, 
    ValidationResult,
    PersonaType,
    SubjectType,
    DifficultyLevel,
    Question
)
from api.integrations.validation import answer_validator
from utils.logger import agent_logger

class AgentService(ABC):
    """
    Abstract base class for agent services (LangChain, Mock, etc.).
    """
    
    @abstractmethod
    async def generate_challenge(self, context: AgentContext) -> ChallengePayload:
        """
        Generate a challenge based on the provided context.
        
        Args:
            context: Agent context including locale, device info, persona, etc.
            
        Returns:
            Challenge payload with questions and answer key
        """
        raise NotImplementedError

    @abstractmethod
    async def validate_answers(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """
        Validate student answers and provide feedback.
        
        Args:
            payload: Original challenge payload
            answers: Student answers to validate
            
        Returns:
            Validation result with score and feedback
        """
        raise NotImplementedError
    
    def get_supported_personas(self) -> List[PersonaType]:
        """Get list of supported personas for this agent."""
        return [PersonaType.TUTOR, PersonaType.MATERNAL, PersonaType.GENERAL]
    
    def get_supported_subjects(self) -> List[SubjectType]:
        """Get list of supported subjects for this agent."""
        return [SubjectType.MATH, SubjectType.HISTORY, SubjectType.GEOGRAPHY, 
                SubjectType.ENGLISH, SubjectType.PHYSICS, SubjectType.SCIENCE,
                SubjectType.LITERATURE, SubjectType.ART]

class MockAgent(AgentService):
    """
    Mock agent for testing - generates simple math questions.
    """
    
    async def generate_challenge(self, context: AgentContext) -> ChallengePayload:
        """Generate 1-3 simple math questions."""
        agent_logger.info(f"Generating mock challenge for {context['mac']} with persona {context['persona']}")
        
        n = random.randint(1, 3)
        questions: List[Question] = []
        answer_key: Dict[str, str] = {}
        
        for i in range(1, n + 1):
            a, b = random.randint(1, 9), random.randint(1, 9)
            qid = f"q{i}"
            
            questions.append({
                "id": qid,
                "type": "mc",
                "prompt": f"Quanto é {a}+{b}?",
                "options": [str(a+b), str(a+b+1), str(a+b-1)],
                "answer_len": None,
                "subject": SubjectType.MATH,
                "difficulty": DifficultyLevel.EASY,
                "explanation": f"A soma de {a} + {b} = {a+b}"
            })
            answer_key[qid] = str(a + b)
        
        return {
            "questions": questions, 
            "answer_key": answer_key,
            "metadata": {
                "persona": context["persona"].value,
                "subject": SubjectType.MATH.value,
                "difficulty": DifficultyLevel.EASY.value,
                "agent_type": "mock"
            }
        }

    async def validate_answers(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """Validate answers using enhanced validation system."""
        agent_logger.info(f"Validating {len(answers)} answers with enhanced validation")
        
        total_score = 0.0
        total_questions = len(payload["questions"])
        feedback_messages = []
        
        # Get persona and subject from metadata
        persona = PersonaType(payload.get("metadata", {}).get("persona", "general"))
        subject = SubjectType(payload.get("metadata", {}).get("subject", "math"))
        
        for answer in answers:
            # Find the corresponding question
            question = next((q for q in payload["questions"] if q["id"] == answer["id"]), None)
            if not question:
                continue
            
            # Use enhanced validation
            validation_result = answer_validator.validate_answer(
                question=question,
                student_answer=answer["value"],
                correct_answer=payload["answer_key"].get(answer["id"], ""),
                persona=persona,
                subject=subject
            )
            
            total_score += validation_result["score"]
            if validation_result.get("feedback"):
                feedback_messages.append(validation_result["feedback"])
        
        # Calculate overall score
        final_score = total_score / total_questions if total_questions > 0 else 0.0
        
        # Determine if overall challenge is passed
        # Use persona-specific threshold
        threshold_map = {
            PersonaType.TUTOR: 0.8,
            PersonaType.MATERNAL: 0.7,
            PersonaType.GENERAL: 0.75
        }
        threshold = threshold_map.get(persona, 0.75)
        correct = final_score >= threshold
        
        # Combine feedback
        combined_feedback = " ".join(feedback_messages) if feedback_messages else (
            "Parabéns! Você acertou!" if correct else "Tente novamente!"
        )
        
        return {
            "correct": correct,
            "score": final_score,
            "feedback": combined_feedback,
            "explanation": f"Score: {final_score:.2f}/1.0 (threshold: {threshold})"
        }

# Factory function for creating agents
def create_agent(agent_type: str = "mock") -> AgentService:
    """
    Factory function to create agent instances.
    
    Args:
        agent_type: Type of agent ("mock", "langchain", etc.)
        
    Returns:
        Agent service instance
    """
    if agent_type == "mock":
        return MockAgent()
    elif agent_type == "langchain":
        try:
            from api.integrations.langchain_agent import LangChainAgent
            return LangChainAgent()
        except ImportError as e:
            agent_logger.error(f"Failed to import LangChain agent: {e}")
            return MockAgent()
        except ValueError as e:
            agent_logger.error(f"LangChain agent configuration error: {e}")
            return MockAgent()
    else:
        agent_logger.error(f"Unknown agent type: {agent_type}, using mock")
        return MockAgent()
