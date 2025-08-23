# api/integrations/validation.py
import random
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass

from api.integrations.types import (
    Answer, 
    ValidationResult, 
    PersonaType, 
    SubjectType, 
    DifficultyLevel,
    Question
)
from utils.logger import agent_logger

class FeedbackStyle(str, Enum):
    """Different feedback styles based on persona."""
    EDUCATIONAL = "educational"
    ENCOURAGING = "encouraging"
    BALANCED = "balanced"
    STRICT = "strict"

class ValidationStrategy(str, Enum):
    """Different validation strategies."""
    EXACT_MATCH = "exact_match"
    FUZZY_MATCH = "fuzzy_match"
    SEMANTIC_MATCH = "semantic_match"
    PARTIAL_CREDIT = "partial_credit"
    BALANCED = "balanced"

@dataclass
class ValidationConfig:
    """Configuration for validation behavior."""
    strategy: ValidationStrategy
    feedback_style: FeedbackStyle
    score_threshold: float
    allow_partial_credit: bool
    max_partial_credit: float
    case_sensitive: bool
    ignore_whitespace: bool

class AnswerValidator:
    """
    Enhanced answer validation with intelligent feedback and partial credit.
    """
    
    def __init__(self):
        """Initialize the validator with persona-specific configurations."""
        self.persona_configs = self._initialize_persona_configs()
        
    def _initialize_persona_configs(self) -> Dict[PersonaType, ValidationConfig]:
        """Initialize validation configurations for each persona."""
        return {
            PersonaType.TUTOR: ValidationConfig(
                strategy=ValidationStrategy.PARTIAL_CREDIT,
                feedback_style=FeedbackStyle.EDUCATIONAL,
                score_threshold=0.8,
                allow_partial_credit=True,
                max_partial_credit=0.7,
                case_sensitive=False,
                ignore_whitespace=True
            ),
            PersonaType.MATERNAL: ValidationConfig(
                strategy=ValidationStrategy.FUZZY_MATCH,
                feedback_style=FeedbackStyle.ENCOURAGING,
                score_threshold=0.7,
                allow_partial_credit=True,
                max_partial_credit=0.8,
                case_sensitive=False,
                ignore_whitespace=True
            ),
            PersonaType.GENERAL: ValidationConfig(
                strategy=ValidationStrategy.BALANCED,
                feedback_style=FeedbackStyle.BALANCED,
                score_threshold=0.75,
                allow_partial_credit=True,
                max_partial_credit=0.6,
                case_sensitive=False,
                ignore_whitespace=True
            )
        }
    
    def validate_answer(
        self, 
        question: Question, 
        student_answer: str, 
        correct_answer: str,
        persona: PersonaType,
        subject: SubjectType
    ) -> ValidationResult:
        """
        Validate a single answer with intelligent feedback.
        
        Args:
            question: The question being answered
            student_answer: Student's response
            correct_answer: Expected correct answer
            persona: Persona for feedback style
            subject: Subject for context-specific feedback
            
        Returns:
            Validation result with score and feedback
        """
        config = self.persona_configs.get(persona, self.persona_configs[PersonaType.GENERAL])
        
        # Normalize answers
        normalized_student = self._normalize_answer(student_answer, config)
        normalized_correct = self._normalize_answer(correct_answer, config)
        
        # Calculate score based on strategy
        score = self._calculate_score(
            normalized_student, 
            normalized_correct, 
            config, 
            question, 
            subject
        )
        
        # Determine if answer is correct
        correct = score >= config.score_threshold
        
        # Generate feedback
        feedback = self._generate_feedback(
            question, 
            student_answer, 
            correct_answer, 
            score, 
            correct, 
            config, 
            persona, 
            subject
        )
        
        # Generate explanation
        explanation = self._generate_explanation(
            question, 
            correct_answer, 
            score, 
            correct, 
            config, 
            subject
        )
        
        return {
            "correct": correct,
            "score": score,
            "feedback": feedback,
            "explanation": explanation
        }
    
    def _normalize_answer(self, answer: str, config: ValidationConfig) -> str:
        """Normalize answer based on configuration."""
        if answer is None:
            return ""
        
        normalized = answer.strip()
        
        if not config.case_sensitive:
            normalized = normalized.lower()
        
        if config.ignore_whitespace:
            normalized = " ".join(normalized.split())
        
        return normalized
    
    def _calculate_score(
        self, 
        student_answer: str, 
        correct_answer: str, 
        config: ValidationConfig,
        question: Question,
        subject: SubjectType
    ) -> float:
        """Calculate score based on validation strategy."""
        
        if config.strategy == ValidationStrategy.EXACT_MATCH:
            return 1.0 if student_answer == correct_answer else 0.0
        
        elif config.strategy == ValidationStrategy.FUZZY_MATCH:
            return self._fuzzy_match_score(student_answer, correct_answer)
        
        elif config.strategy == ValidationStrategy.SEMANTIC_MATCH:
            return self._semantic_match_score(student_answer, correct_answer, subject)
        
        elif config.strategy == ValidationStrategy.PARTIAL_CREDIT:
            return self._partial_credit_score(student_answer, correct_answer, config)
        
        else:  # BALANCED
            exact_score = 1.0 if student_answer == correct_answer else 0.0
            if exact_score == 1.0:
                return 1.0
            
            fuzzy_score = self._fuzzy_match_score(student_answer, correct_answer)
            return max(exact_score, fuzzy_score * config.max_partial_credit)
    
    def _fuzzy_match_score(self, student_answer: str, correct_answer: str) -> float:
        """Calculate fuzzy matching score."""
        if not student_answer or not correct_answer:
            return 0.0
        
        # Simple character-based similarity
        student_chars = set(student_answer.lower())
        correct_chars = set(correct_answer.lower())
        
        if not correct_chars:
            return 0.0
        
        intersection = student_chars.intersection(correct_chars)
        union = student_chars.union(correct_chars)
        
        jaccard_similarity = len(intersection) / len(union)
        
        # Also consider length similarity for short answers
        length_similarity = 1.0 - abs(len(student_answer) - len(correct_answer)) / max(len(student_answer), len(correct_answer), 1)
        
        # Weighted combination
        return 0.7 * jaccard_similarity + 0.3 * length_similarity
    
    def _semantic_match_score(self, student_answer: str, correct_answer: str, subject: SubjectType) -> float:
        """Calculate semantic similarity score."""
        # This could be enhanced with embeddings or semantic analysis
        # For now, use a simple keyword-based approach
        
        student_words = set(student_answer.lower().split())
        correct_words = set(correct_answer.lower().split())
        
        if not correct_words:
            return 0.0
        
        intersection = student_words.intersection(correct_words)
        return len(intersection) / len(correct_words)
    
    def _partial_credit_score(self, student_answer: str, correct_answer: str, config: ValidationConfig) -> float:
        """Calculate partial credit score."""
        if student_answer == correct_answer:
            return 1.0
        
        if not config.allow_partial_credit:
            return 0.0
        
        # Calculate multiple similarity metrics
        exact_score = 1.0 if student_answer == correct_answer else 0.0
        fuzzy_score = self._fuzzy_match_score(student_answer, correct_answer)
        semantic_score = self._semantic_match_score(student_answer, correct_answer, SubjectType.MATH)
        
        # Weighted combination
        weighted_score = (
            exact_score * 0.5 +
            fuzzy_score * 0.3 +
            semantic_score * 0.2
        )
        
        return min(weighted_score, config.max_partial_credit)
    
    def _generate_feedback(
        self, 
        question: Question, 
        student_answer: str, 
        correct_answer: str, 
        score: float, 
        correct: bool, 
        config: ValidationConfig, 
        persona: PersonaType, 
        subject: SubjectType
    ) -> str:
        """Generate persona-specific feedback."""
        
        if correct:
            return self._generate_success_feedback(persona, score, subject)
        else:
            return self._generate_encouragement_feedback(
                question, 
                student_answer, 
                correct_answer, 
                score, 
                config, 
                persona, 
                subject
            )
    
    def _generate_success_feedback(self, persona: PersonaType, score: float, subject: SubjectType) -> str:
        """Generate feedback for correct answers."""
        feedback_templates = {
            PersonaType.TUTOR: [
                "Excellent work! You've mastered this concept.",
                "Perfect! Your understanding of {subject} is solid.",
                "Great job! You're making excellent progress."
            ],
            PersonaType.MATERNAL: [
                "Wonderful! I'm so proud of you!",
                "You did it! You're learning so well.",
                "Fantastic! You're doing amazing with {subject}."
            ],
            PersonaType.GENERAL: [
                "Correct! Well done!",
                "Great answer! You got it right.",
                "Perfect! Keep up the good work."
            ]
        }
        
        templates = feedback_templates.get(persona, feedback_templates[PersonaType.GENERAL])
        template = random.choice(templates)
        
        return template.format(subject=subject.value)
    
    def _generate_encouragement_feedback(
        self, 
        question: Question, 
        student_answer: str, 
        correct_answer: str, 
        score: float, 
        config: ValidationConfig,
        persona: PersonaType, 
        subject: SubjectType
    ) -> str:
        """Generate encouraging feedback for incorrect answers."""
        base_feedback = ""
        
        if persona == PersonaType.MATERNAL:
            base_feedback = "Não se preocupe, vamos tentar novamente. "
        elif persona == PersonaType.TUTOR:
            base_feedback = "Vamos revisar isso juntos. "
        else:  # GENERAL
            base_feedback = "Let me help you understand this better. "
        
        # Add hint or explanation
        if question.get("explanation"):
            base_feedback += f"{question['explanation']}"
        else:
            base_feedback += f"The correct answer is '{correct_answer}'. Keep practicing!"
        
        return base_feedback

    def _generate_hint(self, question: Question, correct_answer: str, subject: SubjectType) -> str:
        """Generate a hint for the question."""
        if subject == SubjectType.GEOGRAPHY:
            return "Dica: pense na localização ou característica geográfica"
        elif subject == SubjectType.MATH:
            return "Dica: verifique os cálculos passo a passo"
        elif subject == SubjectType.HISTORY:
            return "Dica: lembre-se do período histórico"
        else:
            return "Dica: revise o conteúdo estudado"
    
    def _generate_simple_explanation(self, question: Question, correct_answer: str, subject: SubjectType) -> str:
        """Generate a simple explanation."""
        if question.get("explanation"):
            return question["explanation"]
        
        return f"The correct answer is '{correct_answer}'. Keep practicing!"
    
    def _generate_explanation(
        self, 
        question: Question, 
        correct_answer: str, 
        score: float, 
        correct: bool, 
        config: ValidationConfig,
        subject: SubjectType
    ) -> str:
        """Generate explanation for the answer."""
        if correct:
            return f"Score: {score:.2f}/1.0 - Perfect! Explicação: {question.get('explanation', 'Resposta correta!')}"
        else:
            return f"Score: {score:.2f}/1.0 (threshold: {config.score_threshold}) - {question.get('explanation', 'Resposta incorreta.')}"

# Global validator instance
answer_validator = AnswerValidator()
