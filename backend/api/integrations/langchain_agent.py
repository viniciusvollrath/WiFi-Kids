# api/integrations/langchain_agent.py
import json
import random
import time
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
from api.integrations.validation import answer_validator
from utils.logger import agent_logger

# Import AI validator with error handling
try:
    from api.integrations.ai_validator import ai_validator
    ai_validator_available = True
    agent_logger.info("AI validator imported successfully")
except Exception as e:
    agent_logger.error(f"Failed to import AI validator: {e}")
    ai_validator = None
    ai_validator_available = False

class LangChainAgent:
    """
    LangChain-powered agent for generating educational questions and validating answers.
    Includes conversation history for more contextual interactions.
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
        
        # Conversation history storage (mac_address -> conversation_history)
        self.conversation_histories = {}
        
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
        
        You are creating ONE SINGLE educational question for an interactive, conversational learning experience like ChatGPT.
        
        {conversation_context}
        
        Topic: {subject}
        Difficulty: {difficulty}
        Language: {language}
        
        CRITICAL LANGUAGE REQUIREMENT: Create the question and all options ENTIRELY in {language} language.
        - If language is "en-US" or "en", write EVERYTHING in English only.
        - If language is "pt-BR" or "pt", write EVERYTHING in Portuguese only.
        - NO language mixing is allowed.
        
        QUESTION STYLE REQUIREMENTS:
        - Make it engaging and thought-provoking
        - Use clear, conversational language
        - Include interesting context when relevant
        - Make sure it's educational and age-appropriate
        - Consider the conversation history when creating follow-up questions
        - Build on previous topics naturally when appropriate
        
        Create exactly 1 multiple-choice question with 4 realistic options where only one is clearly correct.
        
        Return ONLY this JSON format:
        {{
            "questions": [
                {{
                    "id": "q1",
                    "type": "mc", 
                    "prompt": "Your engaging, conversational question here?",
                    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
                    "answer_len": null,
                    "subject": "{subject}",
                    "difficulty": "{difficulty}",
                    "explanation": "Detailed explanation of why this answer is correct, with additional educational context"
                }}
            ],
            "answer_key": {{
                "q1": "A"
            }}
        }}
        
        CRITICAL: The "questions" array must contain EXACTLY ONE question object. Return valid JSON only.
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
    
    def _get_conversation_history(self, mac: str) -> list:
        """Get conversation history for a user (MAC address)."""
        return self.conversation_histories.get(mac, [])
    
    def _add_to_conversation_history(self, mac: str, role: str, content: str):
        """Add a message to the conversation history."""
        if mac not in self.conversation_histories:
            self.conversation_histories[mac] = []
        
        self.conversation_histories[mac].append({
            "role": role,
            "content": content,
            "timestamp": time.time()
        })
        
        # Keep only the last 10 interactions to prevent context overflow
        if len(self.conversation_histories[mac]) > 20:  # 10 Q&A pairs
            self.conversation_histories[mac] = self.conversation_histories[mac][-20:]
    
    def _format_conversation_context(self, mac: str, language: str) -> str:
        """Format conversation history as context for the LLM."""
        history = self._get_conversation_history(mac)
        if not history:
            return ""
        
        if language == "en":
            context = "Previous conversation context:\n"
        else:
            context = "Contexto da conversa anterior:\n"
        
        for item in history[-6:]:  # Last 3 Q&A pairs
            role_label = "Assistant" if item["role"] == "assistant" else "Student"
            if language == "pt":
                role_label = "Assistente" if item["role"] == "assistant" else "Estudante"
            context += f"{role_label}: {item['content'][:100]}...\n"
        
        return context + "\n"
    
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
            num_questions = 1  # Always generate one question at a time for conversational flow
            
            # Prepare prompt with conversation context
            persona_prompt = self._get_persona_prompt(context["persona"])
            conversation_context = self._format_conversation_context(
                context["mac"], 
                "en" if "en" in str(context["locale"]).lower() else "pt"
            )
            
            # Generate questions using LangChain
            chain = self.question_prompt | self.llm | self.output_parser
            
            response = await chain.ainvoke({
                "persona_prompt": persona_prompt,
                "conversation_context": conversation_context,
                "num_questions": num_questions,
                "subject": subject.value,
                "difficulty": difficulty.value,
                "language": context["locale"]
            })
            
            # Validate and structure the response
            questions = response.get("questions", [])
            answer_key = response.get("answer_key", {})
            
            # ENFORCE SINGLE QUESTION: Only take the first question if AI generates multiple
            if len(questions) > 1:
                agent_logger.warning(f"AI generated {len(questions)} questions, keeping only the first one for conversational flow")
                questions = questions[:1]  # Keep only the first question
                # Also filter answer_key to match
                first_question_id = questions[0].get("id", "q1") if questions else "q1"
                answer_key = {first_question_id: answer_key.get(first_question_id, list(answer_key.values())[0] if answer_key else "")}
            
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
            
            # Add question to conversation history for future context
            if structured_questions:
                question_text = structured_questions[0].get("prompt", "")
                self._add_to_conversation_history(context["mac"], "assistant", f"Question: {question_text}")
            
            # For demo: Always require only 1 question for access
            required_questions = 1
            
            return {
                "questions": structured_questions,
                "answer_key": answer_key,
                "session_progress": {
                    "questions_answered_correctly": 0,
                    "total_questions_required": required_questions,
                    "questions_attempted": 0
                },
                "metadata": {
                    "persona": context["persona"].value,
                    "subject": subject.value,
                    "difficulty": difficulty.value,
                    "locale": context["locale"],
                    "agent_type": "langchain",
                    "model": OPENAI_MODEL
                }
            }
            
        except Exception as e:
            agent_logger.error(f"Error generating challenge: {e}")
            raise
    
    async def validate_answers(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """Validate student answers using enhanced validation system."""
        try:
            agent_logger.info(f"Validating {len(answers)} answers with enhanced validation")
            
            total_score = 0.0
            total_questions = len(payload["questions"])
            feedback_messages = []
            
            # Get persona, subject, and language from metadata
            persona = PersonaType(payload.get("metadata", {}).get("persona", "general"))
            subject = SubjectType(payload.get("metadata", {}).get("subject", "math"))
            # Extract language from metadata, default to Portuguese for backward compatibility
            metadata = payload.get("metadata", {})
            locale = metadata.get("locale", "pt-BR")
            language = "en" if "en" in str(locale).lower() else "pt"
            agent_logger.info(f"Language detection: locale='{locale}' -> language='{language}'")
            
            # Get MAC address for conversation tracking (if available)
            mac_address = metadata.get("mac_address", "")
            
            for answer in answers:
                # Find the corresponding question
                question = next((q for q in payload["questions"] if q["id"] == answer["id"]), None)
                if not question:
                    continue
                
                # Add student answer to conversation history
                if mac_address:
                    self._add_to_conversation_history(mac_address, "user", f"Answer: {answer['value']}")
                
                # Use AI-powered validation for flexible answer evaluation
                if ai_validator_available and ai_validator:
                    try:
                        # Try AI validation first
                        agent_logger.info(f"Attempting AI validation for question {question.get('id')} with answer '{answer['value']}', language='{language}', persona='{persona}'")
                        validation_result = ai_validator.validate_answer(
                            question=question,
                            student_answer=answer["value"],
                            persona=persona,
                            language=language
                        )
                        agent_logger.info(f"AI validation result: correct={validation_result.get('correct')}, score={validation_result.get('score')}, feedback='{validation_result.get('feedback', '')}'")
                    except Exception as e:
                        agent_logger.error(f"AI validation failed, falling back to basic validation: {e}")
                        import traceback
                        agent_logger.error(f"Full traceback: {traceback.format_exc()}")
                        # Fallback to basic validation
                        validation_result = answer_validator.validate_answer(
                            question=question,
                            student_answer=answer["value"],
                            correct_answer=payload["answer_key"].get(answer["id"], ""),
                            persona=persona,
                            subject=subject
                        )
                        agent_logger.info(f"Basic validation result: correct={validation_result.get('correct')}, score={validation_result.get('score')}")
                else:
                    # AI validator not available, use basic validation
                    agent_logger.info(f"AI validator not available, using basic validation for question {question.get('id')} with answer '{answer['value']}'")
                    validation_result = answer_validator.validate_answer(
                        question=question,
                        student_answer=answer["value"],
                        correct_answer=payload["answer_key"].get(answer["id"], ""),
                        persona=persona,
                        subject=subject
                    )
                    agent_logger.info(f"Basic validation result: correct={validation_result.get('correct')}, score={validation_result.get('score')}")
                
                total_score += validation_result["score"]
                if validation_result.get("feedback"):
                    feedback_messages.append(validation_result["feedback"])
            
            # Calculate overall score
            final_score = total_score / total_questions if total_questions > 0 else 0.0
            
            # Determine if overall challenge is passed
            # Use persona-specific threshold
            threshold_map = {
                PersonaType.TUTOR: 0.8,
                PersonaType.MATERNAL: 0.7,
                PersonaType.GENERAL: 0.75
            }
            threshold = threshold_map.get(persona, 0.75)
            correct = final_score >= threshold
            
            agent_logger.info(f"Final validation: score={final_score:.2f}, threshold={threshold}, correct={correct}, total_questions={total_questions}")
            
            # Combine feedback
            combined_feedback = " ".join(feedback_messages) if feedback_messages else (
                "Parabéns! Você acertou!" if correct else "Tente novamente!"
            )
            
            return {
                "correct": correct,
                "score": final_score,
                "feedback": combined_feedback,
                "explanation": f"Score: {final_score:.2f}/1.0 (threshold: {threshold})"
            }
            
        except Exception as e:
            agent_logger.error(f"Error validating answers: {e}")
            # Fallback to simple validation
            return self._fallback_validation(payload, answers)
    
    def _fallback_validation(self, payload: ChallengePayload, answers: List[Answer]) -> ValidationResult:
        """Fallback validation when enhanced validation fails."""
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
            "feedback": f"Você acertou {correct_count} de {total_questions} questões.",
            "explanation": "Parabéns!" if correct else "Tente novamente!"
        }
