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
from utils.logger import agent_logger

class AgentService(ABC):
    """
    Abstract base class for agent services (LangChain, Mock, etc.).
    """
    
    @abstractmethod
    def generate_challenge(self, context: AgentContext) -> ChallengePayload:
        """
        Generate a challenge based on the provided context.
        
        Args:
            context: Agent context including locale, device info, persona, etc.
            
        Returns:
            Challenge payload with questions and answer key
        """
        raise NotImplementedError

    @abstractmethod
    def validate_answers(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
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
    
    def generate_challenge(self, context: AgentContext) -> ChallengePayload:
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

    def validate_answers(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """Validate answers against the answer key."""
        agent_logger.info(f"Validating {len(answers)} answers")
        
        key: Dict[str, str] = payload.get("answer_key", {})
        correct_count = 0
        total_questions = len(payload["questions"])
        
        for answer in answers:
            if key.get(answer["id"]) == str(answer["value"]).strip():
                correct_count += 1
        
        score = correct_count / total_questions if total_questions > 0 else 0.0
        correct = score >= 0.8  # 80% threshold
        
        return {
            "correct": correct,
            "score": score,
            "feedback": f"Você acertou {correct_count} de {total_questions} questões.",
            "explanation": "Parabéns!" if correct else "Tente novamente!"
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
        # Will be implemented in PR #2
        agent_logger.warning("LangChain agent not yet implemented, falling back to mock")
        return MockAgent()
    else:
        agent_logger.error(f"Unknown agent type: {agent_type}, using mock")
        return MockAgent()
