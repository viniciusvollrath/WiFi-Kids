#!/usr/bin/env python3
"""
Direct OpenAI API test to isolate the issue
"""
import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load environment
load_dotenv()

async def test_openai_direct():
    """Test OpenAI API directly"""
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    print(f"=== DIRECT OPENAI TEST ===")
    print(f"API Key present: {'Yes' if api_key else 'No'}")
    print(f"API Key length: {len(api_key) if api_key else 0}")
    print(f"Model: {model}")
    print(f"========================")
    
    try:
        # Test 1: Simple ChatOpenAI call
        print("\n🧪 Test 1: Basic ChatOpenAI")
        llm = ChatOpenAI(
            model=model,
            temperature=0.2,
            max_tokens=100,
            api_key=api_key,
            request_timeout=30
        )
        
        response = await llm.ainvoke("Say 'Hello World' in JSON format like {\"message\": \"Hello World\"}")
        print(f"✅ SUCCESS: {response.content}")
        
        # Test 2: Try the exact same prompt as the agent
        print(f"\n🧪 Test 2: Agent-style prompt")
        agent_prompt = """You are a helpful educational assistant.
        
        Create exactly 1 multiple-choice question about math.
        
        Return ONLY this JSON format:
        {
            "questions": [
                {
                    "id": "q1",
                    "type": "mc",
                    "prompt": "What is 2+2?",
                    "options": ["3", "4", "5", "6"],
                    "subject": "math",
                    "difficulty": "easy",
                    "explanation": "2+2 equals 4"
                }
            ],
            "answer_key": {
                "q1": "4"
            }
        }
        
        Do not include any text outside this JSON structure."""
        
        response2 = await llm.ainvoke(agent_prompt)
        print(f"✅ SUCCESS: {response2.content}")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_openai_direct())