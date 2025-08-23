# tests/e2e/test_complete_workflow.py
"""End-to-end tests for complete workflow."""

import pytest
from fastapi.testclient import TestClient


class TestCompleteChallengeWorkflow:
    """Test complete challenge workflow from generation to completion."""
    
    @pytest.mark.e2e
    def test_complete_challenge_workflow_success(self, client, create_router, create_device):
        """Test complete successful challenge workflow."""
        # Step 1: Generate challenge
        generate_response = client.post(
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
        
        assert generate_response.status_code == 200
        challenge_data = generate_response.json()
        
        challenge_id = challenge_data["challenge_id"]
        questions = challenge_data["questions"]
        answer_key = challenge_data["answer_key"]
        
        assert challenge_id is not None
        assert len(questions) > 0
        assert len(answer_key) > 0
        
        # Step 2: Submit correct answers
        correct_answers = []
        for question in questions:
            question_id = question["id"]
            if question_id in answer_key:
                correct_answers.append({
                    "id": question_id,
                    "value": answer_key[question_id]
                })
        
        answer_response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge_id,
                "answers": correct_answers
            }
        )
        
        assert answer_response.status_code == 200
        answer_data = answer_response.json()
        
        assert answer_data["correct"] is True
        assert answer_data["score"] > 0.7
        assert "session_id" in answer_data
        assert "ttl_sec" in answer_data
        assert "feedback" in answer_data
    
    @pytest.mark.e2e
    def test_complete_challenge_workflow_failure_retry(self, client, create_router, create_device):
        """Test complete challenge workflow with failure and retry."""
        # Step 1: Generate challenge
        generate_response = client.post(
            "/challenge/generate",
            json={
                "locale": "pt-BR",
                "mac": "11:22:33:44:55:66",
                "router_id": "aa:bb:cc:dd:ee:ff",
                "persona": "maternal",
                "subject": "history",
                "difficulty": "medium"
            }
        )
        
        assert generate_response.status_code == 200
        challenge_data = generate_response.json()
        
        challenge_id = challenge_data["challenge_id"]
        questions = challenge_data["questions"]
        answer_key = challenge_data["answer_key"]
        
        # Step 2: Submit incorrect answers (first attempt)
        incorrect_answers = []
        for question in questions:
            question_id = question["id"]
            if question_id in answer_key:
                # Submit wrong answer
                wrong_answer = "wrong_answer"
                incorrect_answers.append({
                    "id": question_id,
                    "value": wrong_answer
                })
        
        answer_response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge_id,
                "answers": incorrect_answers
            }
        )
        
        assert answer_response.status_code == 200
        answer_data = answer_response.json()
        
        assert answer_data["correct"] is False
        assert answer_data["score"] < 0.7
        assert "attempts_left" in answer_data
        assert answer_data["attempts_left"] > 0
        
        # Step 3: Submit correct answers (second attempt)
        correct_answers = []
        for question in questions:
            question_id = question["id"]
            if question_id in answer_key:
                correct_answers.append({
                    "id": question_id,
                    "value": answer_key[question_id]
                })
        
        retry_response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge_id,
                "answers": correct_answers
            }
        )
        
        assert retry_response.status_code == 200
        retry_data = retry_response.json()
        
        assert retry_data["correct"] is True
        assert retry_data["score"] > 0.7
        assert "session_id" in retry_data
    
    @pytest.mark.e2e
    def test_complete_challenge_workflow_different_personas(self, client, create_router, create_device):
        """Test complete workflow with different personas."""
        personas = ["tutor", "maternal", "general"]
        
        for persona in personas:
            # Generate challenge
            generate_response = client.post(
                "/challenge/generate",
                json={
                    "locale": "pt-BR",
                    "mac": "11:22:33:44:55:66",
                    "router_id": "aa:bb:cc:dd:ee:ff",
                    "persona": persona,
                    "subject": "math",
                    "difficulty": "easy"
                }
            )
            
            assert generate_response.status_code == 200
            challenge_data = generate_response.json()
            
            # Submit correct answers
            questions = challenge_data["questions"]
            answer_key = challenge_data["answer_key"]
            
            correct_answers = []
            for question in questions:
                question_id = question["id"]
                if question_id in answer_key:
                    correct_answers.append({
                        "id": question_id,
                        "value": answer_key[question_id]
                    })
            
            answer_response = client.post(
                "/challenge/answer",
                json={
                    "challenge_id": challenge_data["challenge_id"],
                    "answers": correct_answers
                }
            )
            
            assert answer_response.status_code == 200
            answer_data = answer_response.json()
            
            assert answer_data["correct"] is True
            assert answer_data["score"] > 0.7
    
    @pytest.mark.e2e
    def test_complete_challenge_workflow_different_subjects(self, client, create_router, create_device):
        """Test complete workflow with different subjects."""
        subjects = ["math", "history", "geography", "english", "physics"]
        
        for subject in subjects:
            # Generate challenge
            generate_response = client.post(
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
            
            assert generate_response.status_code == 200
            challenge_data = generate_response.json()
            
            # Submit correct answers
            questions = challenge_data["questions"]
            answer_key = challenge_data["answer_key"]
            
            correct_answers = []
            for question in questions:
                question_id = question["id"]
                if question_id in answer_key:
                    correct_answers.append({
                        "id": question_id,
                        "value": answer_key[question_id]
                    })
            
            answer_response = client.post(
                "/challenge/answer",
                json={
                    "challenge_id": challenge_data["challenge_id"],
                    "answers": correct_answers
                }
            )
            
            assert answer_response.status_code == 200
            answer_data = answer_response.json()
            
            assert answer_data["correct"] is True
            assert answer_data["score"] > 0.7


class TestAnalyticsIntegration:
    """Test analytics integration in complete workflow."""
    
    @pytest.mark.e2e
    @pytest.mark.analytics
    def test_analytics_tracking_in_workflow(self, client, create_router, create_device):
        """Test that analytics are properly tracked during workflow."""
        # Step 1: Generate challenge
        generate_response = client.post(
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
        
        assert generate_response.status_code == 200
        challenge_data = generate_response.json()
        
        # Step 2: Submit answers
        questions = challenge_data["questions"]
        answer_key = challenge_data["answer_key"]
        
        correct_answers = []
        for question in questions:
            question_id = question["id"]
            if question_id in answer_key:
                correct_answers.append({
                    "id": question_id,
                    "value": answer_key[question_id]
                })
        
        answer_response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": challenge_data["challenge_id"],
                "answers": correct_answers
            }
        )
        
        assert answer_response.status_code == 200
        
        # Step 3: Check analytics endpoints
        # Get student analytics
        analytics_response = client.get(
            f"/analytics/students/11:22:33:44:55:66/analytics?router_id=aa:bb:cc:dd:ee:ff"
        )
        
        assert analytics_response.status_code == 200
        analytics_data = analytics_response.json()
        
        assert "performance" in analytics_data
        assert "learning_path" in analytics_data
        assert analytics_data["performance"]["total_challenges"] >= 1
        
        # Get challenge analytics
        challenge_analytics_response = client.get(
            "/analytics/challenges/analytics?mac=11:22:33:44:55:66&limit=10"
        )
        
        assert challenge_analytics_response.status_code == 200
        challenge_analytics = challenge_analytics_response.json()
        
        assert isinstance(challenge_analytics, list)
        assert len(challenge_analytics) >= 1
        
        # Get agent performance
        agent_performance_response = client.get(
            "/analytics/agents/performance?agent_type=mock"
        )
        
        assert agent_performance_response.status_code == 200
        agent_performance = agent_performance_response.json()
        
        assert isinstance(agent_performance, list)
        assert len(agent_performance) >= 1


class TestValidationIntegration:
    """Test validation system integration."""
    
    @pytest.mark.e2e
    @pytest.mark.validation
    def test_validation_system_integration(self, client):
        """Test validation system integration with different scenarios."""
        # Test exact match validation
        exact_match_response = client.post(
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
        
        assert exact_match_response.status_code == 200
        exact_match_data = exact_match_response.json()
        assert exact_match_data["validation_result"]["correct"] is True
        assert exact_match_data["validation_result"]["score"] == 1.0
        
        # Test case insensitive validation
        case_insensitive_response = client.post(
            "/challenge/validation/test",
            json={
                "question": {
                    "id": "q1",
                    "type": "short",
                    "prompt": "What is the capital of France?",
                    "answer_len": 5,
                    "explanation": "Paris is the capital"
                },
                "student_answer": "PARIS",
                "correct_answer": "Paris",
                "persona": "maternal",
                "subject": "geography"
            }
        )
        
        assert case_insensitive_response.status_code == 200
        case_insensitive_data = case_insensitive_response.json()
        assert case_insensitive_data["validation_result"]["correct"] is True
        
        # Test partial credit validation
        partial_credit_response = client.post(
            "/challenge/validation/test",
            json={
                "question": {
                    "id": "q1",
                    "type": "short",
                    "prompt": "What is the capital of Brazil?",
                    "answer_len": 8,
                    "explanation": "Brasília is the capital"
                },
                "student_answer": "Brasilia",
                "correct_answer": "Brasília",
                "persona": "tutor",
                "subject": "geography"
            }
        )
        
        assert partial_credit_response.status_code == 200
        partial_credit_data = partial_credit_response.json()
        assert partial_credit_data["validation_result"]["correct"] is True
        assert partial_credit_data["validation_result"]["score"] > 0.7


class TestAgentRouterIntegration:
    """Test agent router integration."""
    
    @pytest.mark.e2e
    @pytest.mark.router
    def test_agent_router_integration(self, client):
        """Test agent router integration with different scenarios."""
        # Get available agents
        agents_response = client.get("/challenge/agents/available")
        assert agents_response.status_code == 200
        agents = agents_response.json()
        assert len(agents) > 0
        
        # Get persona policies
        for persona in ["tutor", "maternal", "general"]:
            policy_response = client.get(f"/challenge/agents/policy/{persona}")
            assert policy_response.status_code == 200
            policy_data = policy_response.json()
            assert policy_data["persona"] == persona
            assert "policy" in policy_data
        
        # Test agent selection with different personas
        personas = ["tutor", "maternal", "general"]
        for persona in personas:
            generate_response = client.post(
                "/challenge/generate",
                json={
                    "locale": "pt-BR",
                    "mac": "11:22:33:44:55:66",
                    "router_id": "aa:bb:cc:dd:ee:ff",
                    "persona": persona,
                    "subject": "math",
                    "difficulty": "easy"
                }
            )
            
            assert generate_response.status_code == 200
            challenge_data = generate_response.json()
            assert challenge_data["metadata"]["persona"] == persona


class TestErrorHandling:
    """Test error handling in complete workflow."""
    
    @pytest.mark.e2e
    def test_error_handling_invalid_inputs(self, client):
        """Test error handling with invalid inputs."""
        # Test invalid MAC address
        invalid_mac_response = client.post(
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
        
        assert invalid_mac_response.status_code == 422
        
        # Test invalid persona
        invalid_persona_response = client.post(
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
        
        assert invalid_persona_response.status_code == 422
        
        # Test invalid challenge ID
        invalid_challenge_response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": "invalid-challenge-id",
                "answers": [{"id": "q1", "value": "4"}]
            }
        )
        
        assert invalid_challenge_response.status_code == 404
    
    @pytest.mark.e2e
    def test_error_handling_missing_data(self, client):
        """Test error handling with missing data."""
        # Test missing required fields
        missing_fields_response = client.post(
            "/challenge/generate",
            json={
                "locale": "pt-BR",
                "mac": "11:22:33:44:55:66"
                # Missing router_id, persona, subject, difficulty
            }
        )
        
        assert missing_fields_response.status_code == 422
        
        # Test empty answers
        empty_answers_response = client.post(
            "/challenge/answer",
            json={
                "challenge_id": "test-id",
                "answers": []
            }
        )
        
        assert empty_answers_response.status_code == 422
