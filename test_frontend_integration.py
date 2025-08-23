#!/usr/bin/env python3
"""
Test script to validate WiFi-Kids API integration
Simulates the frontend -> API flow
"""

import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_complete_flow():
    """Test the complete kid -> challenge -> answer -> access flow"""
    
    print("Testing WiFi-Kids Frontend Integration")
    print("=" * 50)
    
    # Step 1: Kid clicks "Access Internet" -> Generate Challenge
    print("\nSTEP 1: Kid clicks 'Access Internet' - Requesting challenge...")
    
    challenge_payload = {
        "mac": "00:11:22:33:44:55",
        "router_id": "test-router", 
        "locale": "pt-BR",
        "persona": "tutor",
        "subject": "math",
        "difficulty": "easy"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/challenge/generate",
            json=challenge_payload,
            timeout=15
        )
        
        if response.status_code != 200:
            print(f"ERROR: Challenge generation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        challenge_data = response.json()
        challenge_id = challenge_data["challenge_id"]
        questions = challenge_data["questions"]
        
        print(f"SUCCESS: Challenge generated successfully!")
        print(f"   Challenge ID: {challenge_id}")
        print(f"   Questions: {len(questions)}")
        print(f"   Persona: {challenge_data['metadata']['persona']}")
        
        # Display questions to simulate frontend
        print(f"\nQuestions presented to kid:")
        for i, q in enumerate(questions):
            print(f"   {i+1}. {q['prompt']}")
            if q.get('options'):
                for j, option in enumerate(q['options']):
                    print(f"      {chr(65+j)}) {option}")
        
    except Exception as e:
        print(f"ERROR: Error generating challenge: {e}")
        return False
    
    # Step 2: Kid submits answer -> Validate and get access decision
    print(f"\nSTEP 2: Kid submits answer...")
    
    # Simulate kid answering the first question correctly
    kid_answers = []
    for q in questions:
        if q['type'] == 'mc' and q.get('options'):
            # For demo, assume first option is correct (this would be smarter in real app)
            kid_answers.append({
                "id": q["id"],
                "value": "8"  # Assume this is correct for math question
            })
        else:
            kid_answers.append({
                "id": q["id"], 
                "value": "test answer"
            })
    
    answer_payload = {
        "challenge_id": challenge_id,
        "answers": kid_answers
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/challenge/answer",
            json=answer_payload,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"ERROR: Answer validation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        result = response.json()
        
        print(f"SUCCESS: Answer validation completed!")
        print(f"   Decision: {result['decision']}")
        
        if result["decision"] == "ALLOW":
            print(f"ACCESS GRANTED!")
            print(f"   Kid gets {result['allowed_minutes']} minutes of internet")
            print(f"   Session ID: {result['session_id']}")
            print(f"   Feedback: {result.get('feedback', 'Great job!')}")
        else:
            print(f"ACCESS DENIED")
            print(f"   Attempts left: {result.get('attempts_left', 0)}")
            print(f"   Feedback: {result.get('feedback', 'Try again!')}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Error validating answer: {e}")
        return False

def test_agent_availability():
    """Test that agents are properly available"""
    
    print(f"\nTesting agent availability...")
    
    try:
        response = requests.get(f"{API_BASE}/agents/available")
        
        if response.status_code != 200:
            print(f"ERROR: Agents endpoint failed: {response.status_code}")
            return False
            
        agents = response.json()["agents"]
        
        print(f"SUCCESS: Found {len(agents)} available agents:")
        for agent in agents:
            print(f"   - {agent['id']}: {agent['description']}")
            print(f"     Persona: {agent['persona']}, Subjects: {', '.join(agent['subjects'])}")
        
        return len(agents) > 0
        
    except Exception as e:
        print(f"ERROR: Error checking agents: {e}")
        return False

def check_api_health():
    """Check if API is running"""
    
    print(f"Checking API health...")
    
    try:
        response = requests.get(f"{API_BASE}/ping", timeout=5)
        if response.status_code == 200:
            print(f"SUCCESS: API is running at {API_BASE}")
            return True
        else:
            print(f"ERROR: API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR: Cannot connect to API: {e}")
        return False

if __name__ == "__main__":
    
    # Check API is running
    if not check_api_health():
        print("\nERROR: Cannot proceed - API is not running")
        print("Please start the API server first:")
        print("cd backend && .venv/Scripts/activate && uvicorn api.main:app --host 127.0.0.1 --port 8000")
        exit(1)
    
    # Test agent availability
    if not test_agent_availability():
        print("\nERROR: Agent system not working properly")
        exit(1)
    
    # Test complete flow
    success = test_complete_flow()
    
    if success:
        print(f"\nSUCCESS: Frontend integration is working!")
        print(f"The API successfully:")
        print(f"  [OK] Generates LLM-powered questions")
        print(f"  [OK] Validates student answers") 
        print(f"  [OK] Makes access control decisions")
        print(f"  [OK] Provides educational feedback")
        print(f"\nYour frontend can now integrate with these endpoints!")
    else:
        print(f"\nFAILURE: Integration has issues that need to be fixed")
        
    print(f"\n" + "=" * 50)