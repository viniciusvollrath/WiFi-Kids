# api/integrations/langchain_agent.py
import json
import random
from typing import Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from api.core.settings import (
    OPENAI_API_KEY, 
    OPENAI_MODEL, 
    OPENAI_TEMPERATURE, 
    OPENAI_MAX_TOKENS,
    AGENT_DEFAULT_PERSONA,
    AGENT_SUBJECTS
)
from api.integrations.types import (
    AgentContext, 
    ChallengePayload, 
    Answer, 
    ValidationResult,
    PersonaType,
    SubjectType,
    DifficultyLevel,
    Question
)
from utils.logger import agent_logger

class LangChainAgent:
    """
    LangChain-powered agent for generating educational questions and validating answers.
    """
    
    def __init__(self):
        """Initialize the LangChain agent with OpenAI configuration."""
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for LangChain agent")
        
        self.llm = ChatOpenAI(
            model=OPENAI_MODEL,
            temperature=OPENAI_TEMPERATURE,
            max_tokens=OPENAI_MAX_TOKENS,
            api_key=OPENAI_API_KEY
        )
        
        # Persona-specific system prompts
        self.persona_prompts = {
            PersonaType.TUTOR: """You are a friendly, encouraging tutor who helps students learn through engaging questions. 
            Be supportive and educational in your tone. Provide clear explanations and positive reinforcement.""",
            
            PersonaType.MATERNAL: """You are a caring, maternal figure who guides children with warmth and patience. 
            Use gentle, nurturing language and show understanding when they make mistakes.""",
            
            PersonaType.GENERAL: """You are a helpful educational assistant who creates engaging learning experiences. 
            Be clear, encouraging, and focused on making learning fun and accessible."""
        }
        
        # Question generation prompt template
        self.question_prompt = ChatPromptTemplate.from_template("""
        {persona_prompt}
        
        Generate {num_questions} educational question(s) for a student. The questions should be:
        - Subject: {subject}
        - Difficulty: {difficulty}
        - Language: {language}
        - Age-appropriate and engaging
        
        For each question, provide:
        1. A clear, engaging prompt
        2. Multiple choice options (if applicable)
        3. The correct answer
        4. A brief explanation
        
        Return the response as a JSON object with this exact structure:
        {{
            "questions": [
                {{
                    "id": "q1",
                    "type": "mc",
                    "prompt": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer_len": null,
                    "subject": "{subject}",
                    "difficulty": "{difficulty}",
                    "explanation": "Brief explanation of the answer"
                }}
            ],
            "answer_key": {{
                "q1": "correct_answer_here"
            }}
        }}
        
        Make sure the questions are educational, age-appropriate, and match the specified difficulty level.
        """)
        
        # Answer validation prompt template
        self.validation_prompt = ChatPromptTemplate.from_template("""
        You are an educational assistant evaluating a student's answer.
        
        Question: {question_prompt}
        Correct Answer: {correct_answer}
        Student's Answer: {student_answer}
        
        Evaluate the student's answer considering:
        1. Accuracy (is it correct?)
        2. Partial credit (if applicable)
        3. Understanding (do they show knowledge of the concept?)
        
        Return your evaluation as a JSON object:
        {{
            "correct": true/false,
            "score": 0.0-1.0,
            "feedback": "Encouraging feedback message",
            "explanation": "Brief explanation of why the answer is correct/incorrect"
        }}
        
        Be encouraging and educational in your feedback, especially for incorrect answers.
        """)
        
        self.output_parser = JsonOutputParser()
    
    def _get_persona_prompt(self, persona: PersonaType) -> str:
        """Get the system prompt for the specified persona."""
        return self.persona_prompts.get(persona, self.persona_prompts[PersonaType.GENERAL])
    
    def _select_subject(self, context: AgentContext) -> SubjectType:
        """Select a subject based on context or randomly."""
        if context.get("subject"):
            return context["subject"]
        
        # Random selection from available subjects
        return random.choice(list(SubjectType))
    
    def _determine_difficulty(self, context: AgentContext) -> DifficultyLevel:
        """Determine question difficulty based on context."""
        if context.get("difficulty"):
            return context["difficulty"]
        
        # Simple logic: use previous performance to adjust difficulty
        performance = context.get("previous_performance", {})
        if performance:
            avg_score = sum(performance.values()) / len(performance)
            if avg_score > 0.8:
                return DifficultyLevel.MEDIUM
            elif avg_score < 0.5:
                return DifficultyLevel.EASY
            else:
                return DifficultyLevel.MEDIUM
        
        return DifficultyLevel.EASY
    
    async def generate_challenge(self, context: AgentContext) -> ChallengePayload:
        """Generate educational questions using LangChain and GPT."""
        try:
            agent_logger.info(f"Generating LangChain challenge for {context['mac']} with persona {context['persona']}")
            
            # Determine question parameters
            subject = self._select_subject(context)
            difficulty = self._determine_difficulty(context)
            num_questions = random.randint(1, 3)  # 1-3 questions per challenge
            
            # Prepare prompt
            persona_prompt = self._get_persona_prompt(context["persona"])
            
            # Generate questions using LangChain
            chain = self.question_prompt | self.llm | self.output_parser
            
            response = await chain.ainvoke({
                "persona_prompt": persona_prompt,
                "num_questions": num_questions,
                "subject": subject.value,
                "difficulty": difficulty.value,
                "language": context["locale"]
            })
            
            # Validate and structure the response
            questions = response.get("questions", [])
            answer_key = response.get("answer_key", {})
            
            # Ensure proper structure
            structured_questions = []
            for i, q in enumerate(questions):
                structured_questions.append({
                    "id": q.get("id", f"q{i+1}"),
                    "type": q.get("type", "mc"),
                    "prompt": q.get("prompt", ""),
                    "options": q.get("options"),
                    "answer_len": q.get("answer_len"),
                    "subject": SubjectType(q.get("subject", subject.value)),
                    "difficulty": DifficultyLevel(q.get("difficulty", difficulty.value)),
                    "explanation": q.get("explanation", "")
                })
            
            agent_logger.info(f"Generated {len(structured_questions)} questions for subject {subject.value}")
            
            return {
                "questions": structured_questions,
                "answer_key": answer_key,
                "metadata": {
                    "persona": context["persona"].value,
                    "subject": subject.value,
                    "difficulty": difficulty.value,
                    "agent_type": "langchain",
                    "model": OPENAI_MODEL
                }
            }
            
        except Exception as e:
            agent_logger.error(f"Error generating challenge: {e}")
            raise
    
    async def validate_answers(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """Validate student answers using AI-powered evaluation."""
        try:
            agent_logger.info(f"Validating {len(answers)} answers with LangChain")
            
            total_score = 0.0
            total_questions = len(payload["questions"])
            feedback_messages = []
            
            for answer in answers:
                # Find the corresponding question
                question = next((q for q in payload["questions"] if q["id"] == answer["id"]), None)
                if not question:
                    continue
                
                # Validate individual answer
                validation_chain = self.validation_prompt | self.llm | self.output_parser
                
                validation_response = await validation_chain.ainvoke({
                    "question_prompt": question["prompt"],
                    "correct_answer": payload["answer_key"].get(answer["id"], ""),
                    "student_answer": answer["value"]
                })
                
                total_score += validation_response.get("score", 0.0)
                if validation_response.get("feedback"):
                    feedback_messages.append(validation_response["feedback"])
            
            # Calculate overall score
            final_score = total_score / total_questions if total_questions > 0 else 0.0
            correct = final_score >= 0.8  # 80% threshold
            
            # Combine feedback
            combined_feedback = " ".join(feedback_messages) if feedback_messages else (
                "Good Job! You got it!" if correct else "Almost there! Try again!"
            )
            
            return {
                "correct": correct,
                "score": final_score,
                "feedback": combined_feedback,
                "explanation": f"Score: {final_score:.2f}/1.0"
            }
            
        except Exception as e:
            agent_logger.error(f"Error validating answers: {e}")
            # Fallback to simple validation
            return self._fallback_validation(payload, answers)
    
    def _fallback_validation(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """Fallback validation when AI validation fails."""
        agent_logger.warning("Using fallback validation")
        
        key = payload.get("answer_key", {})
        correct_count = 0
        total_questions = len(payload["questions"])
        
        for answer in answers:
            if key.get(answer["id"]) == str(answer["value"]).strip():
                correct_count += 1
        
        score = correct_count / total_questions if total_questions > 0 else 0.0
        correct = score >= 0.8
        
        return {
            "correct": correct,
            "score": score,
            "feedback": f"You got {correct_count} out of {total_questions} questions right.",
            "explanation": "Good job!" if correct else "Try again!"
        }
