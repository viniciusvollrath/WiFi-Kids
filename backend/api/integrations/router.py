# api/integrations/router.py
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass

from api.integrations.types import (
    AgentContext, 
    PersonaType, 
    SubjectType, 
    DifficultyLevel
)
from api.integrations.agent import AgentService, create_agent
from api.core.settings import (
    ROUTER_ENABLED, 
    ROUTER_PREFER_LLM, 
    ROUTER_FALLBACK_TO_MOCK,
    OPENAI_API_KEY
)
from utils.logger import agent_logger
from utils.constants import MODEL_NAME

class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MOCK = "mock"

class PolicyType(str, Enum):
    """Policy types for agent selection."""
    EDUCATIONAL = "educational"
    STRICT = "strict"
    FLEXIBLE = "flexible"
    GAMIFIED = "gamified"

@dataclass
class AgentConfig:
    """Configuration for an agent instance."""
    agent_type: str
    llm_provider: LLMProvider
    model: str
    temperature: float
    max_tokens: int
    persona: PersonaType
    policy: PolicyType
    subjects: List[SubjectType]
    difficulty_range: List[DifficultyLevel]
    description: str

class AgentRouter:
    """
    Router that selects the most appropriate agent based on context, persona, and policies.
    """
    
    def __init__(self):
        """Initialize the agent router with predefined configurations."""
        self.agent_configs = self._initialize_agent_configs()
        self.persona_policies = self._initialize_persona_policies()
        
    def _initialize_agent_configs(self) -> Dict[str, AgentConfig]:
        """Initialize available agent configurations."""
        return {
            "tutor_openai": AgentConfig(
                agent_type="langchain",
                llm_provider=LLMProvider.OPENAI,
                model=MODEL_NAME,
                temperature=0.3,
                max_tokens=1000,
                persona=PersonaType.TUTOR,
                policy=PolicyType.EDUCATIONAL,
                subjects=[SubjectType.MATH, SubjectType.SCIENCE, SubjectType.ENGLISH],
                difficulty_range=[DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD],
                description="Educational tutor with structured learning approach"
            ),
            "maternal_openai": AgentConfig(
                agent_type="langchain",
                llm_provider=LLMProvider.OPENAI,
                model=MODEL_NAME,
                temperature=0.4,
                max_tokens=1200,
                persona=PersonaType.MATERNAL,
                policy=PolicyType.FLEXIBLE,
                subjects=[SubjectType.MATH, SubjectType.HISTORY, SubjectType.LITERATURE, SubjectType.ART],
                difficulty_range=[DifficultyLevel.EASY, DifficultyLevel.MEDIUM],
                description="Caring maternal figure with nurturing approach"
            ),
            "general_openai": AgentConfig(
                agent_type="langchain",
                llm_provider=LLMProvider.OPENAI,
                model=MODEL_NAME,
                temperature=0.2,
                max_tokens=800,
                persona=PersonaType.GENERAL,
                policy=PolicyType.GAMIFIED,
                subjects=list(SubjectType),  # All subjects
                difficulty_range=[DifficultyLevel.MEDIUM, DifficultyLevel.HARD],
                description="General educational assistant with gamified approach"
            ),
            "strict_openai": AgentConfig(
                agent_type="langchain",
                llm_provider=LLMProvider.OPENAI,
                model=MODEL_NAME,
                temperature=0.1,
                max_tokens=600,
                persona=PersonaType.TUTOR,
                policy=PolicyType.STRICT,
                subjects=[SubjectType.MATH, SubjectType.PHYSICS, SubjectType.SCIENCE],
                difficulty_range=[DifficultyLevel.MEDIUM, DifficultyLevel.HARD],
                description="Strict educational approach with high standards"
            ),
            "mock_fallback": AgentConfig(
                agent_type="mock",
                llm_provider=LLMProvider.MOCK,
                model="mock",
                temperature=0.0,
                max_tokens=0,
                persona=PersonaType.GENERAL,
                policy=PolicyType.EDUCATIONAL,
                subjects=[SubjectType.MATH],
                difficulty_range=[DifficultyLevel.EASY],
                description="Mock agent for testing and fallback"
            )
        }
    
    def _initialize_persona_policies(self) -> Dict[PersonaType, Dict[str, Any]]:
        """Initialize policies for each persona."""
        return {
            PersonaType.TUTOR: {
                "max_attempts": 3,
                "score_threshold": 0.8,
                "feedback_style": "educational",
                "difficulty_progression": "adaptive",
                "subjects": [SubjectType.MATH, SubjectType.SCIENCE, SubjectType.ENGLISH]
            },
            PersonaType.MATERNAL: {
                "max_attempts": 5,
                "score_threshold": 0.7,
                "feedback_style": "encouraging",
                "difficulty_progression": "gentle",
                "subjects": [SubjectType.MATH, SubjectType.HISTORY, SubjectType.LITERATURE, SubjectType.ART]
            },
            PersonaType.GENERAL: {
                "max_attempts": 4,
                "score_threshold": 0.75,
                "feedback_style": "balanced",
                "difficulty_progression": "moderate",
                "subjects": list(SubjectType)
            }
        }
    
    def select_agent(self, context: AgentContext) -> AgentService:
        """
        Select the most appropriate agent based on context.
        
        Args:
            context: Agent context with persona, subject, difficulty, etc.
            
        Returns:
            Configured agent service instance
        """
        if not ROUTER_ENABLED:
            agent_logger.info("Router disabled, using default agent")
            return create_agent("mock")
        
        try:
            # Get persona policy
            persona_policy = self.persona_policies.get(context["persona"], {})
            
            # Find matching agent configs
            matching_configs = []
            
            for config_id, config in self.agent_configs.items():
                # Check if persona matches
                if config.persona != context["persona"]:
                    continue
                
                # Check if subject is supported
                if context.get("subject") and context["subject"] not in config.subjects:
                    continue
                
                # Check if difficulty is supported
                if context.get("difficulty") and context["difficulty"] not in config.difficulty_range:
                    continue
                
                # Check if LLM provider is available
                if not self._is_llm_available(config.llm_provider):
                    continue
                
                matching_configs.append((config_id, config))
            
            # Select the best matching config
            if matching_configs:
                # Prefer the configured LLM provider
                preferred_configs = [c for c in matching_configs if c[1].llm_provider.value == ROUTER_PREFER_LLM]
                if preferred_configs:
                    selected_config_id, selected_config = preferred_configs[0]
                else:
                    # Prefer non-mock agents
                    non_mock_configs = [c for c in matching_configs if c[1].llm_provider != LLMProvider.MOCK]
                    if non_mock_configs:
                        selected_config_id, selected_config = non_mock_configs[0]
                    else:
                        selected_config_id, selected_config = matching_configs[0]
                
                agent_logger.info(f"Selected agent: {selected_config_id} for persona {context['persona']}")
                
                # Create and configure agent
                agent = create_agent(selected_config.agent_type)
                
                # Apply persona-specific policies
                self._apply_persona_policies(agent, persona_policy)
                
                return agent
            
            # Fallback to mock agent if enabled
            if ROUTER_FALLBACK_TO_MOCK:
                agent_logger.warning(f"No matching agent found for persona {context['persona']}, using mock")
                return create_agent("mock")
            else:
                raise ValueError(f"No available agent for persona {context['persona']}")
            
        except Exception as e:
            agent_logger.error(f"Error selecting agent: {e}")
            if ROUTER_FALLBACK_TO_MOCK:
                return create_agent("mock")
            else:
                raise
    
    def _is_llm_available(self, provider: LLMProvider) -> bool:
        """Check if the specified LLM provider is available."""
        if provider == LLMProvider.MOCK:
            return True
        
        # Check OpenAI availability
        if provider == LLMProvider.OPENAI:
            return bool(OPENAI_API_KEY)
        
        # Other providers not implemented yet
        return False
    
    def _apply_persona_policies(self, agent: AgentService, policy: Dict[str, Any]) -> None:
        """Apply persona-specific policies to the agent."""
        # This could be extended to configure agent behavior
        # For now, we'll just log the policy
        agent_logger.info(f"Applied policy: {policy}")
    
    def get_available_agents(self, persona: Optional[PersonaType] = None) -> List[Dict[str, Any]]:
        """Get list of available agents for a persona."""
        available = []
        
        for config_id, config in self.agent_configs.items():
            if persona and config.persona != persona:
                continue
            
            if self._is_llm_available(config.llm_provider):
                available.append({
                    "id": config_id,
                    "persona": config.persona.value,
                    "policy": config.policy.value,
                    "subjects": [s.value for s in config.subjects],
                    "difficulty_range": [d.value for d in config.difficulty_range],
                    "description": config.description,
                    "available": True
                })
        
        return available
    
    def get_persona_policy(self, persona: PersonaType) -> Dict[str, Any]:
        """Get the policy configuration for a specific persona."""
        return self.persona_policies.get(persona, {})

# Global router instance
agent_router = AgentRouter()
