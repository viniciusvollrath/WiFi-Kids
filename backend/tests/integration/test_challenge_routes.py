# tests/integration/test_challenge_routes.py
"""Integration tests for challenge API routes."""

import pytest
from fastapi.testclient import TestClient
from api.integrations.types import PersonaType, SubjectType, DifficultyLevel


class TestChallengeGenerate:
    """Test challenge generation endpoint."""
    
    @pytest.mark.integration
    def test_generate_challenge_success(self, client, create_router, create_device):
        """Test successful challenge generation."""
        response = client.post(
            "/challenge/generate",
            json={
                "locale": "pt-BR",
                "mac": "11:22:33:44:55:66",
                "router_id": "aa:bb:cc:dd:ee:ff",
                "persona": "tutor",
                "subject": "math",
                "difficulty": "easy"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "challenge_id" in data
        assert "questions" in data
        assert "answer_key" in data
        assert "metadata" in data
        assert len(data["questions"]) > 0
        assert data["metadata"]["persona"] == "tutor"
        assert data["metadata"]["subject"] == "math"
        assert data["metadata"]["difficulty"] == "easy"
        assert data["metadata"]["agent_type"] == "mock"
    
    @pytest.mark.integration
    def test_generate_challenge_invalid_mac(self, client):
        """Test challenge generation with invalid MAC address."""
        response = client.post(
            "/challenge/generate",
            json={
                "locale": "pt-BR",
                "mac": "invalid-mac",
                "router_id": "aa:bb:cc:dd:ee:ff",
                "persona": "tutor",
                "subject": "math",
                "difficulty": "easy"
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.integration
    def test_generate_challenge_missing_fields(self, client):
        """Test challenge generation with missing required fields."""
        response = client.post(
            "/challenge/generate",
            json={
                "locale": "pt-BR",
                "mac": "11:22:33:44:55:66"
                # Missing router_id, persona, subject, difficulty
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.integration
    def test_generate_challenge_invalid_persona(self, client, create_router, create_device):
        """Test challenge generation with invalid persona."""
        response = client.post(
            "/challenge/generate",
            json={
                "locale": "pt-BR",
                "mac": "11:22:33:44:55:66",
                "router_id": "aa:bb:cc:dd:ee:ff",
                "persona": "invalid_persona",
                "subject": "math",
                "difficulty": "easy"
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.integration
    def test_generate_challenge_different_subjects(self, client, create_router, create_device):
        """Test challenge generation with different subjects."""
        subjects = ["math", "history", "geography", "english", "physics"]
        
        for subject in subjects:
            response = client.post(
                "/challenge/generate",
                json={
                    "locale": "pt-BR",
                    "mac": "11:22:33:44:55:66",
                    "router_id": "aa:bb:cc:dd:ee:ff",
                    "persona": "tutor",
                    "subject": subject,
                    "difficulty": "easy"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["metadata"]["subject"] == subject
    
    @pytest.mark.integration
    def test_generate_challenge_different_difficulties(self, client, create_router, create_device):
        """Test challenge generation with different difficulties."""
        difficulties = ["easy", "medium", "hard"]
        
        for difficulty in difficulties:
            response = client.post(
                "/challenge/generate",
                json={
                    "locale": "pt-BR",
                    "mac": "11:22:33:44:55:66",
                    "router_id": "aa:bb:cc:dd:ee:ff",
                    "persona": "tutor",
                    "subject": "math",
                    "difficulty": difficulty
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["metadata"]["difficulty"] == difficulty


class TestChallengeAnswer:
    """Test challenge answer submission endpoint."""
    
    @pytest.mark.integration
    def test_submit_correct_answers(self, client, create_challenge):
        """Test submitting correct answers."""
        challenge = create_challenge
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": [
                    {"id": "q1", "value": "4"}
                ]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["correct"] is True
        assert data["score"] > 0.7
        assert "feedback" in data
        assert "explanation" in data
        assert "session_id" in data
        assert "ttl_sec" in data
    
    @pytest.mark.integration
    def test_submit_incorrect_answers(self, client, create_challenge):
        """Test submitting incorrect answers."""
        challenge = create_challenge
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": [
                    {"id": "q1", "value": "3"}
                ]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["correct"] is False
        assert data["score"] < 0.7
        assert "feedback" in data
        assert "explanation" in data
        assert "attempts_left" in data
    
    @pytest.mark.integration
    def test_submit_partial_answers(self, client, create_challenge):
        """Test submitting partial answers."""
        challenge = create_challenge
        
        # Modify challenge to have multiple questions
        challenge.payload["questions"].append({
            "id": "q2",
            "type": "mc",
            "prompt": "What is 3 + 3?",
            "options": ["5", "6", "7", "8"],
            "answer_len": 1
        })
        challenge.payload["answer_key"]["q2"] = "6"
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": [
                    {"id": "q1", "value": "4"},  # Correct
                    {"id": "q2", "value": "5"}   # Incorrect
                ]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should get partial score
        assert 0.3 < data["score"] < 0.8
        assert "feedback" in data
        assert "explanation" in data
    
    @pytest.mark.integration
    def test_submit_invalid_challenge_id(self, client):
        """Test submitting answers with invalid challenge ID."""
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": "invalid-challenge-id",
                "answers": [
                    {"id": "q1", "value": "4"}
                ]
            }
        )
        
        assert response.status_code == 404
    
    @pytest.mark.integration
    def test_submit_missing_answers(self, client, create_challenge):
        """Test submitting challenge without answers."""
        challenge = create_challenge
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": []
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.integration
    def test_submit_invalid_answer_format(self, client, create_challenge):
        """Test submitting answers with invalid format."""
        challenge = create_challenge
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": [
                    {"id": "q1"}  # Missing value
                ]
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.integration
    def test_submit_expired_challenge(self, client, create_challenge):
        """Test submitting answers to expired challenge."""
        challenge = create_challenge
        challenge.status = "expired"
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": [
                    {"id": "q1", "value": "4"}
                ]
            }
        )
        
        assert response.status_code == 400  # Bad request
    
    @pytest.mark.integration
    def test_submit_no_attempts_left(self, client, create_challenge):
        """Test submitting answers when no attempts left."""
        challenge = create_challenge
        challenge.attempts_left = 0
        
        response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge.id,
                "answers": [
                    {"id": "q1", "value": "4"}
                ]
            }
        )
        
        assert response.status_code == 400  # Bad request


class TestValidationEndpoint:
    """Test validation testing endpoint."""
    
    @pytest.mark.integration
    def test_validation_test_endpoint(self, client):
        """Test the validation testing endpoint."""
        response = client.post(
            "/challenge/validation/test",
            json={
                "question": {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_len": 1,
                    "explanation": "Basic addition"
                },
                "student_answer": "4",
                "correct_answer": "4",
                "persona": "tutor",
                "subject": "math"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "question" in data
        assert "student_answer" in data
        assert "correct_answer" in data
        assert "persona" in data
        assert "subject" in data
        assert "validation_result" in data
        
        validation_result = data["validation_result"]
        assert "correct" in validation_result
        assert "score" in validation_result
        assert "feedback" in validation_result
    
    @pytest.mark.integration
    def test_validation_test_invalid_input(self, client):
        """Test validation testing endpoint with invalid input."""
        response = client.post(
            "/challenge/validation/test",
            json={
                "question": {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_len": 1
                },
                "student_answer": "4",
                "correct_answer": "4",
                "persona": "invalid_persona",  # Invalid persona
                "subject": "math"
            }
        )
        
        assert response.status_code == 400


class TestAgentRouterEndpoints:
    """Test agent router endpoints."""
    
    @pytest.mark.integration
    def test_get_available_agents(self, client):
        """Test getting available agents."""
        response = client.get("/challenge/agents/available")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check agent structure
        agent = data[0]
        assert "agent_type" in agent
        assert "persona" in agent
        assert "model" in agent
        assert "description" in agent
    
    @pytest.mark.integration
    def test_get_available_agents_with_persona_filter(self, client):
        """Test getting available agents filtered by persona."""
        response = client.get("/challenge/agents/available?persona=tutor")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        for agent in data:
            assert agent["persona"] == "tutor"
    
    @pytest.mark.integration
    def test_get_persona_policy(self, client):
        """Test getting persona policy."""
        response = client.get("/challenge/agents/policy/tutor")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, dict)
        assert "persona" in data
        assert "policy" in data
        assert data["persona"] == "tutor"
    
    @pytest.mark.integration
    def test_get_invalid_persona_policy(self, client):
        """Test getting policy for invalid persona."""
        response = client.get("/challenge/agents/policy/invalid_persona")
        
        assert response.status_code == 404
