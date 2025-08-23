# tests/unit/test_validation.py
"""Unit tests for validation system."""

import pytest
from api.integrations.validation import AnswerValidator, ValidationStrategy, FeedbackStyle
from api.integrations.types import (
    Question, 
    PersonaType, 
    SubjectType, 
    DifficultyLevel
)


class TestValidationStrategy:
    """Test validation strategy enum."""
    
    @pytest.mark.unit
    def test_validation_strategies(self):
        """Test all validation strategies are defined."""
        assert ValidationStrategy.EXACT_MATCH == "exact_match"
        assert ValidationStrategy.FUZZY_MATCH == "fuzzy_match"
        assert ValidationStrategy.SEMANTIC_MATCH == "semantic_match"
        assert ValidationStrategy.PARTIAL_CREDIT == "partial_credit"
        assert ValidationStrategy.BALANCED == "balanced"


class TestFeedbackStyle:
    """Test feedback style enum."""
    
    @pytest.mark.unit
    def test_feedback_styles(self):
        """Test all feedback styles are defined."""
        assert FeedbackStyle.EDUCATIONAL == "educational"
        assert FeedbackStyle.ENCOURAGING == "encouraging"
        assert FeedbackStyle.BALANCED == "balanced"
        assert FeedbackStyle.STRICT == "strict"


class TestAnswerValidator:
    """Test AnswerValidator class."""
    
    @pytest.mark.unit
    def test_answer_validator_creation(self):
        """Test AnswerValidator can be instantiated."""
        validator = AnswerValidator()
        assert isinstance(validator, AnswerValidator)
    
    @pytest.mark.unit
    def test_persona_configs_initialization(self):
        """Test persona configurations are properly initialized."""
        validator = AnswerValidator()
        configs = validator._initialize_persona_configs()
        
        assert PersonaType.TUTOR in configs
        assert PersonaType.MATERNAL in configs
        assert PersonaType.GENERAL in configs
        
        # Check tutor config
        tutor_config = configs[PersonaType.TUTOR]
        assert tutor_config.strategy == ValidationStrategy.PARTIAL_CREDIT
        assert tutor_config.feedback_style == FeedbackStyle.EDUCATIONAL
        assert tutor_config.score_threshold == 0.8
        assert tutor_config.allow_partial_credit is True
        
        # Check maternal config
        maternal_config = configs[PersonaType.MATERNAL]
        assert maternal_config.strategy == ValidationStrategy.FUZZY_MATCH
        assert maternal_config.feedback_style == FeedbackStyle.ENCOURAGING
        assert maternal_config.score_threshold == 0.7
        
        # Check general config
        general_config = configs[PersonaType.GENERAL]
        assert general_config.strategy == ValidationStrategy.BALANCED
        assert general_config.feedback_style == FeedbackStyle.BALANCED
        assert general_config.score_threshold == 0.75
    
    @pytest.mark.unit
    def test_validate_answer_exact_match(self):
        """Test exact match validation."""
        validator = AnswerValidator()
        
        question = Question(
            id="q1",
            type="mc",
            prompt="What is 2 + 2?",
            options=["3", "4", "5", "6"],
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )
        
        result = validator.validate_answer(
            question=question,
            student_answer="4",
            correct_answer="4",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH
        )
        
        assert result["correct"] is True
        assert result["score"] == 1.0
        assert "feedback" in result
        assert "explanation" in result
    
    @pytest.mark.unit
    def test_validate_answer_incorrect(self):
        """Test validation with incorrect answer."""
        validator = AnswerValidator()

        question = Question(
            id="q1",
            type="mc",
            prompt="What is 2 + 2?",
            options=["3", "4", "5", "6"],
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )

        result = validator.validate_answer(
            question=question,
            student_answer="3",
            correct_answer="4",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH
        )

        assert result["correct"] is False
        assert result["score"] < 0.2  # Should be low but not necessarily 0.0
        assert "feedback" in result
        assert "explanation" in result
    
    @pytest.mark.unit
    def test_validate_answer_case_insensitive(self):
        """Test case insensitive validation."""
        validator = AnswerValidator()
        
        question = Question(
            id="q1",
            type="short",
            prompt="What is the capital of France?",
            answer_len=5,
            subject=SubjectType.GEOGRAPHY,
            difficulty=DifficultyLevel.EASY,
            explanation="Paris is the capital"
        )
        
        result = validator.validate_answer(
            question=question,
            student_answer="PARIS",
            correct_answer="Paris",
            persona=PersonaType.MATERNAL,
            subject=SubjectType.GEOGRAPHY
        )
        
        assert result["correct"] is True
        assert result["score"] == 1.0
    
    @pytest.mark.unit
    def test_validate_answer_whitespace_ignored(self):
        """Test whitespace is ignored in validation."""
        validator = AnswerValidator()
        
        question = Question(
            id="q1",
            type="short",
            prompt="What is 2 + 2?",
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )
        
        result = validator.validate_answer(
            question=question,
            student_answer=" 4 ",
            correct_answer="4",
            persona=PersonaType.GENERAL,
            subject=SubjectType.MATH
        )
        
        assert result["correct"] is True
        assert result["score"] == 1.0
    
    @pytest.mark.unit
    def test_validate_answer_partial_credit(self):
        """Test partial credit validation."""
        validator = AnswerValidator()

        question = Question(
            id="q1",
            type="short",
            prompt="What is the capital of Brazil?",
            answer_len=8,
            subject=SubjectType.GEOGRAPHY,
            difficulty=DifficultyLevel.MEDIUM,
            explanation="Brasília is the capital"
        )

        # Test partial credit for similar answer
        result = validator.validate_answer(
            question=question,
            student_answer="Brasilia",
            correct_answer="Brasília",
            persona=PersonaType.TUTOR,
            subject=SubjectType.GEOGRAPHY
        )

        # Check that we get a reasonable score even if not correct
        assert result["score"] > 0.2  # Should get some partial credit
        assert "feedback" in result
        assert "explanation" in result

    @pytest.mark.unit
    def test_fuzzy_match_score(self):
        """Test fuzzy matching score calculation."""
        validator = AnswerValidator()

        # Test exact match
        score = validator._fuzzy_match_score("hello", "hello")
        assert score == 1.0

        # Test similar words - with improved algorithm, this should be different
        score = validator._fuzzy_match_score("hello", "helo")
        assert 0.5 < score < 1.0  # Should be similar but not exact

    @pytest.mark.unit
    def test_generate_feedback_success(self):
        """Test feedback generation for successful answers."""
        validator = AnswerValidator()

        question = Question(
            id="q1",
            type="mc",
            prompt="What is 2 + 2?",
            options=["3", "4", "5", "6"],
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )

        feedback = validator._generate_success_feedback(
            persona=PersonaType.TUTOR,
            score=1.0,
            subject=SubjectType.MATH
        )

        # Check for Portuguese or English feedback
        assert "Excelente" in feedback or "Great job" in feedback or "Perfect" in feedback or "Excellent" in feedback

    @pytest.mark.unit
    def test_generate_feedback_encouragement(self):
        """Test feedback generation for incorrect answers."""
        validator = AnswerValidator()

        question = Question(
            id="q1",
            type="mc",
            prompt="What is 2 + 2?",
            options=["3", "4", "5", "6"],
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )

        feedback = validator._generate_encouragement_feedback(
            question=question,
            student_answer="3",
            correct_answer="4",
            score=0.0,
            config=validator._initialize_persona_configs()[PersonaType.MATERNAL],
            persona=PersonaType.MATERNAL,
            subject=SubjectType.MATH
        )

        assert len(feedback) > 0
        # Check for Portuguese or English feedback keywords
        assert "não se preocupe" in feedback.lower() or "help you understand" in feedback.lower()

    @pytest.mark.unit
    def test_generate_hint(self):
        """Test hint generation."""
        validator = AnswerValidator()

        question = Question(
            id="q1",
            type="mc",
            prompt="What is the capital of France?",
            options=["London", "Berlin", "Paris", "Madrid"],
            answer_len=1,
            subject=SubjectType.GEOGRAPHY,
            difficulty=DifficultyLevel.EASY,
            explanation="Paris is the capital"
        )

        hint = validator._generate_hint(
            question=question,
            correct_answer="Paris",
            subject=SubjectType.GEOGRAPHY
        )

        assert len(hint) > 0
        # Check for Portuguese hint keywords
        assert "dica" in hint.lower() or "localização" in hint.lower()

    @pytest.mark.unit
    def test_generate_explanation(self):
        """Test explanation generation."""
        validator = AnswerValidator()

        question = Question(
            id="q1",
            type="mc",
            prompt="What is 2 + 2?",
            options=["3", "4", "5", "6"],
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )

        explanation = validator._generate_explanation(
            question=question,
            correct_answer="4",
            score=1.0,
            correct=True,
            config=validator._initialize_persona_configs()[PersonaType.TUTOR],
            subject=SubjectType.MATH
        )

        assert len(explanation) > 0
        # Check for explanation keywords
        assert "score" in explanation.lower() or "explicação" in explanation.lower()


class TestValidationEdgeCases:
    """Test validation edge cases."""
    
    @pytest.mark.unit
    def test_empty_answers(self):
        """Test validation with empty answers."""
        validator = AnswerValidator()
        
        question = Question(
            id="q1",
            type="short",
            prompt="What is 2 + 2?",
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )
        
        result = validator.validate_answer(
            question=question,
            student_answer="",
            correct_answer="4",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH
        )
        
        assert result["correct"] is False
        assert result["score"] == 0.0
    
    @pytest.mark.unit
    def test_none_answers(self):
        """Test validation with None answers."""
        validator = AnswerValidator()
        
        question = Question(
            id="q1",
            type="short",
            prompt="What is 2 + 2?",
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )
        
        result = validator.validate_answer(
            question=question,
            student_answer=None,
            correct_answer="4",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH
        )
        
        assert result["correct"] is False
        assert result["score"] == 0.0
    
    @pytest.mark.unit
    def test_very_long_answers(self):
        """Test validation with very long answers."""
        validator = AnswerValidator()
        
        question = Question(
            id="q1",
            type="short",
            prompt="What is 2 + 2?",
            answer_len=1,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            explanation="Basic addition"
        )
        
        long_answer = "4" * 1000
        
        result = validator.validate_answer(
            question=question,
            student_answer=long_answer,
            correct_answer="4",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH
        )
        
        # Should still work with long answers
        assert isinstance(result, dict)
        assert "correct" in result
        assert "score" in result
