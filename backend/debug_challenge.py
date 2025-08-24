#!/usr/bin/env python3
"""
Debug script to test challenge state management
"""
import requests
import json

BASE_URL = "http://localhost:8002"

def test_challenge_flow():
    # Step 1: Generate initial challenge
    print("=== Generating Challenge ===")
    generate_payload = {
        "mac": "AA:BB:CC:DD:EE:FF",
        "router_id": "router_test_001", 
        "persona": "tutor"
    }
    
    response = requests.post(f"{BASE_URL}/challenge/generate", json=generate_payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    challenge_data = response.json()
    challenge_id = challenge_data["challenge_id"]
    questions = challenge_data["questions"]
    
    print(f"Challenge ID: {challenge_id}")
    print(f"First question: {questions[0]['prompt']}")
    print(f"Options: {questions[0]['options']}")
    
    # Step 2: Answer first question correctly (should generate a second question)
    print("\n=== Answering First Question ===")
    answer_payload = {
        "challenge_id": challenge_id,
        "answers": [{"id": questions[0]["id"], "value": "A"}]  # Assume A is correct
    }
    
    response = requests.post(f"{BASE_URL}/challenge/answer", json=answer_payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    answer_result = response.json()
    print(f"Decision: {answer_result.get('decision')}")
    print(f"Feedback: {answer_result.get('feedback')}")
    
    if answer_result.get("decision") == "CONTINUE":
        new_questions = answer_result.get("questions", [])
        if new_questions:
            print(f"Second question: {new_questions[0]['prompt']}")
            print(f"Options: {new_questions[0]['options']}")
            
            # Step 3: Answer second question (this is where the bug occurs)
            print("\n=== Answering Second Question ===")
            second_answer_payload = {
                "challenge_id": challenge_id,
                "answers": [{"id": new_questions[0]["id"], "value": "B"}]  # Try option B
            }
            
            response = requests.post(f"{BASE_URL}/challenge/answer", json=second_answer_payload)
            print(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error: {response.text}")
            else:
                second_result = response.json()
                print(f"Decision: {second_result.get('decision')}")
                print(f"Feedback: {second_result.get('feedback')}")

if __name__ == "__main__":
    test_challenge_flow()