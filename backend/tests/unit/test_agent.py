# tests/unit/test_agent.py
"""Unit tests for agent system components."""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from api.integrations.agent import AgentService, MockAgent, create_agent
from api.integrations.types import (
    AgentContext, 
    ChallengePayload, 
    Answer, 
    ValidationResult,
    PersonaType, 
    SubjectType, 
    DifficultyLevel
)


class TestAgentService:
    """Test AgentService abstract base class."""
    
    @pytest.mark.unit
    def test_agent_service_abstract_methods(self):
        """Test that AgentService is abstract and cannot be instantiated."""
        with pytest.raises(TypeError):
            AgentService()
    
    @pytest.mark.unit
    def test_agent_service_interface(self):
        """Test that AgentService defines the correct interface."""
        # Check that abstract methods exist
        assert hasattr(AgentService, 'generate_challenge')
        assert hasattr(AgentService, 'validate_answers')
        assert hasattr(AgentService, 'get_supported_personas')
        assert hasattr(AgentService, 'get_supported_subjects')


class TestMockAgent:
    """Test MockAgent implementation."""
    
    @pytest.mark.unit
    def test_mock_agent_creation(self):
        """Test MockAgent can be instantiated."""
        agent = MockAgent()
        assert isinstance(agent, MockAgent)
        assert isinstance(agent, AgentService)
    
    @pytest.mark.unit
    def test_mock_agent_supported_personas(self):
        """Test MockAgent supported personas."""
        agent = MockAgent()
        personas = agent.get_supported_personas()
        assert PersonaType.TUTOR in personas
        assert PersonaType.MATERNAL in personas
        assert PersonaType.GENERAL in personas
    
    @pytest.mark.unit
    def test_mock_agent_supported_subjects(self):
        """Test MockAgent supported subjects."""
        agent = MockAgent()
        subjects = agent.get_supported_subjects()
        assert SubjectType.MATH in subjects
        assert SubjectType.HISTORY in subjects
        assert SubjectType.GEOGRAPHY in subjects
        assert SubjectType.ENGLISH in subjects
        assert SubjectType.PHYSICS in subjects
    
    @pytest.mark.asyncio
    @pytest.mark.unit
    async def test_mock_agent_generate_challenge(self):
        """Test MockAgent challenge generation."""
        agent = MockAgent()
        context = AgentContext(
            locale="pt-BR",
            mac="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY
        )
        
        result = await agent.generate_challenge(context)
        
        # Check dictionary structure instead of isinstance
        assert isinstance(result, dict)
        assert "questions" in result
        assert "answer_key" in result
        assert "metadata" in result
        assert len(result["questions"]) > 0
        assert result["metadata"]["persona"] == "tutor"
        assert result["metadata"]["subject"] == "math"
        assert result["metadata"]["difficulty"] == "easy"
        assert result["metadata"]["agent_type"] == "mock"
    
    @pytest.mark.asyncio
    @pytest.mark.unit
    async def test_mock_agent_validate_answers_correct(self):
        """Test MockAgent answer validation with correct answers."""
        agent = MockAgent()
        
        # Create a challenge payload
        payload = ChallengePayload(
            questions=[
                {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_len": 1
                }
            ],
            answer_key={"q1": "4"},
            metadata={
                "persona": "tutor",
                "subject": "math",
                "difficulty": "easy",
                "agent_type": "mock"
            }
        )
        
        # Correct answer
        answers = [Answer(id="q1", value="4")]
        
        result = await agent.validate_answers(payload, answers)
        
        # Check dictionary structure instead of isinstance
        assert isinstance(result, dict)
        assert result["correct"] is True
        assert result["score"] > 0.7
        assert "feedback" in result
        assert "explanation" in result
    
    @pytest.mark.asyncio
    @pytest.mark.unit
    async def test_mock_agent_validate_answers_incorrect(self):
        """Test MockAgent answer validation with incorrect answers."""
        agent = MockAgent()
        
        # Create a challenge payload
        payload = ChallengePayload(
            questions=[
                {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_len": 1
                }
            ],
            answer_key={"q1": "4"},
            metadata={
                "persona": "tutor",
                "subject": "math",
                "difficulty": "easy",
                "agent_type": "mock"
            }
        )
        
        # Incorrect answer
        answers = [Answer(id="q1", value="3")]
        
        result = await agent.validate_answers(payload, answers)
        
        # Check dictionary structure instead of isinstance
        assert isinstance(result, dict)
        assert result["correct"] is False
        assert result["score"] < 0.7
        assert "feedback" in result
        assert "explanation" in result
    
    @pytest.mark.asyncio
    @pytest.mark.unit
    async def test_mock_agent_validate_answers_partial(self):
        """Test MockAgent answer validation with partial answers."""
        agent = MockAgent()
        
        # Create a challenge payload with multiple questions
        payload = ChallengePayload(
            questions=[
                {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_len": 1
                },
                {
                    "id": "q2",
                    "type": "mc",
                    "prompt": "What is 3 + 3?",
                    "options": ["5", "6", "7", "8"],
                    "answer_len": 1
                }
            ],
            answer_key={"q1": "4", "q2": "6"},
            metadata={
                "persona": "tutor",
                "subject": "math",
                "difficulty": "easy",
                "agent_type": "mock"
            }
        )
        
        # One correct, one incorrect
        answers = [
            Answer(id="q1", value="4"),  # Correct
            Answer(id="q2", value="5")   # Incorrect
        ]
        
        result = await agent.validate_answers(payload, answers)
        
        # Check dictionary structure instead of isinstance
        assert isinstance(result, dict)
        assert result["correct"] is False  # Partial credit doesn't make it correct
        assert 0.4 < result["score"] < 0.6  # Should be around 0.5
        assert "feedback" in result
        assert "explanation" in result


class TestCreateAgent:
    """Test agent factory function."""
    
    @pytest.mark.unit
    def test_create_mock_agent(self):
        """Test creating mock agent."""
        agent = create_agent("mock")
        assert isinstance(agent, MockAgent)
    
    @pytest.mark.unit
    def test_create_unknown_agent_fallback(self):
        """Test creating unknown agent type falls back to mock."""
        agent = create_agent("unknown")
        assert isinstance(agent, MockAgent)
    
    @pytest.mark.unit
    @patch('api.integrations.langchain_agent.LangChainAgent')
    def test_create_langchain_agent_success(self, mock_langchain_agent):
        """Test creating LangChain agent successfully."""
        mock_agent = Mock()
        mock_langchain_agent.return_value = mock_agent
        
        agent = create_agent("langchain")
        
        assert agent == mock_agent
        mock_langchain_agent.assert_called_once()
    
    @pytest.mark.unit
    @patch('api.integrations.langchain_agent.LangChainAgent')
    def test_create_langchain_agent_import_error(self, mock_langchain_agent):
        """Test creating LangChain agent with import error."""
        mock_langchain_agent.side_effect = ImportError("Module not found")
        
        agent = create_agent("langchain")
        
        assert isinstance(agent, MockAgent)
    
    @pytest.mark.unit
    @patch('api.integrations.langchain_agent.LangChainAgent')
    def test_create_langchain_agent_value_error(self, mock_langchain_agent):
        """Test creating LangChain agent with value error."""
        mock_langchain_agent.side_effect = ValueError("Configuration error")
        
        agent = create_agent("langchain")
        
        assert isinstance(agent, MockAgent)


class TestAgentContext:
    """Test AgentContext type."""
    
    @pytest.mark.unit
    def test_agent_context_creation(self):
        """Test AgentContext creation with valid data."""
        context = AgentContext(
            locale="pt-BR",
            mac="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff",
            persona=PersonaType.TUTOR,
            subject=SubjectType.MATH,
            difficulty=DifficultyLevel.EASY,
            previous_performance={"math": 0.8}
        )
        
        assert context["locale"] == "pt-BR"
        assert context["mac"] == "11:22:33:44:55:66"
        assert context["router_id"] == "aa:bb:cc:dd:ee:ff"
        assert context["persona"] == PersonaType.TUTOR
        assert context["subject"] == SubjectType.MATH
        assert context["difficulty"] == DifficultyLevel.EASY
        assert context["previous_performance"] == {"math": 0.8}
    
    @pytest.mark.unit
    def test_agent_context_optional_fields(self):
        """Test AgentContext with optional fields."""
        context = AgentContext(
            locale="pt-BR",
            mac="11:22:33:44:55:66",
            router_id="aa:bb:cc:dd:ee:ff"
        )
        
        assert context["locale"] == "pt-BR"
        assert context["mac"] == "11:22:33:44:55:66"
        assert context["router_id"] == "aa:bb:cc:dd:ee:ff"
        assert context.get("persona") is None
        assert context.get("subject") is None
        assert context.get("difficulty") is None
        assert context.get("previous_performance") is None


class TestAgentTypes:
    """Test agent type definitions."""
    
    @pytest.mark.unit
    def test_persona_types(self):
        """Test PersonaType enum values."""
        assert PersonaType.TUTOR == "tutor"
        assert PersonaType.MATERNAL == "maternal"
        assert PersonaType.GENERAL == "general"
    
    @pytest.mark.unit
    def test_subject_types(self):
        """Test SubjectType enum values."""
        assert SubjectType.MATH == "math"
        assert SubjectType.HISTORY == "history"
        assert SubjectType.GEOGRAPHY == "geography"
        assert SubjectType.ENGLISH == "english"
        assert SubjectType.PHYSICS == "physics"
    
    @pytest.mark.unit
    def test_difficulty_levels(self):
        """Test DifficultyLevel enum values."""
        assert DifficultyLevel.EASY == "easy"
        assert DifficultyLevel.MEDIUM == "medium"
        assert DifficultyLevel.HARD == "hard"
