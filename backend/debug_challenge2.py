#!/usr/bin/env python3
"""
Debug script to test multi-question challenge progression
"""
import requests
import json

BASE_URL = "http://localhost:8002"

def test_multi_question_flow():
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
    print(f"Question 1: {questions[0]['prompt'][:50]}...")
    
    # Answer first question CORRECTLY to trigger next question
    print("\n=== Answering First Question CORRECTLY ===")
    # Try all options until we get a correct one
    for option in ["A", "B", "C", "D"]:
        answer_payload = {
            "challenge_id": challenge_id,
            "answers": [{"id": questions[0]["id"], "value": option}]
        }
        
        response = requests.post(f"{BASE_URL}/challenge/answer", json=answer_payload)
        if response.status_code != 200:
            print(f"Error: {response.text}")
            continue
            
        answer_result = response.json()
        print(f"Option {option}: {answer_result.get('decision')} - {answer_result.get('feedback', '')[:50]}...")
        
        if answer_result.get("decision") == "CONTINUE":
            print("Got CONTINUE - proceeding to next question!")
            new_questions = answer_result.get("questions", [])
            if new_questions:
                print(f"Question 2: {new_questions[0]['prompt'][:50]}...")
                
                # Answer second question - this is where bug should manifest
                print("\n=== Answering Second Question ===")
                second_answer_payload = {
                    "challenge_id": challenge_id,
                    "answers": [{"id": new_questions[0]["id"], "value": "A"}]  
                }
                
                response = requests.post(f"{BASE_URL}/challenge/answer", json=second_answer_payload)
                print(f"Status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"Error: {response.text}")
                else:
                    second_result = response.json()
                    print(f"Decision: {second_result.get('decision')}")
                    print(f"Full feedback: {second_result.get('feedback', '')}")
                    
                    # The bug is if the feedback references the FIRST question instead of the SECOND
                    
            return
        elif answer_result.get("decision") == "ALLOW":
            print("Got ALLOW - challenge completed!")
            return
        elif answer_result.get("decision") == "DENY":
            # This option was wrong, try the next one
            continue

if __name__ == "__main__":
    test_multi_question_flow()