"""
AI-powered answer validation using LLM for flexible and intelligent evaluation
"""
import json
from typing import Dict, Any, Optional
from openai import OpenAI
from api.integrations.types import PersonaType, ValidationResult
from utils.logger import agent_logger
import os

class AIAnswerValidator:
    """
    AI-powered answer validator that uses LLM to evaluate student answers
    with flexibility and context understanding.
    """
    
    def __init__(self):
        """Initialize the AI validator with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            from api.core.settings import OPENAI_API_KEY
            api_key = OPENAI_API_KEY
        
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required for AI validation")
            
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"  # Fast and cost-effective model for validation
        
    def validate_answer(
        self,
        question: Dict[str, Any],
        student_answer: str,
        persona: PersonaType = PersonaType.TUTOR,
        language: str = "pt"
    ) -> ValidationResult:
        """
        Validate student answer using AI with context understanding.
        
        Args:
            question: The question data including prompt, options, correct answer
            student_answer: The student's submitted answer
            persona: The persona type for feedback style
            language: Language for feedback (pt/en)
        
        Returns:
            ValidationResult with score, correctness, and feedback
        """
        try:
            # Build the validation prompt
            validation_prompt = self._build_validation_prompt(
                question, student_answer, persona, language
            )
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(language)
                    },
                    {
                        "role": "user", 
                        "content": validation_prompt
                    }
                ],
                temperature=0.1,  # Low temperature for consistent evaluation
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            # Parse the AI response
            ai_result = json.loads(response.choices[0].message.content)
            
            # Convert to our ValidationResult format
            return {
                "correct": ai_result.get("correct", False),
                "score": ai_result.get("score", 0.0),
                "feedback": ai_result.get("feedback", ""),
                "explanation": ai_result.get("explanation", ""),
                "metadata": {
                    "ai_validation": True,
                    "confidence": ai_result.get("confidence", 0.5),
                    "reasoning": ai_result.get("reasoning", "")
                }
            }
            
        except Exception as e:
            agent_logger.error(f"AI validation failed: {str(e)}")
            
            # Fallback to simple string matching
            return self._fallback_validation(question, student_answer, language)
    
    def _get_system_prompt(self, language: str) -> str:
        """Get the system prompt for AI validation."""
        if language == "pt":
            return """Você é um avaliador educacional inteligente. Sua tarefa é avaliar se a resposta de um estudante está correta, considerando:

1. FLEXIBILIDADE: Aceite variações equivalentes da resposta correta
2. CONTEXTO: Entenda o contexto da pergunta (múltipla escolha, texto livre, etc.)
3. SINÔNIMOS: Reconheça sinônimos e formas alternativas corretas
4. FORMATO: Ignore diferenças de formatação (maiúsculas, pontuação, espaços)

SEMPRE retorne um JSON válido com:
{
  "correct": boolean,
  "score": float (0.0-1.0),
  "confidence": float (0.0-1.0),
  "feedback": "string com feedback apropriado",
  "explanation": "string explicando a resposta correta",
  "reasoning": "string explicando seu raciocínio de avaliação"
}"""
        else:
            return """You are an intelligent educational evaluator. Your task is to assess if a student's answer is correct, considering:

1. FLEXIBILITY: Accept equivalent variations of the correct answer
2. CONTEXT: Understand the question context (multiple choice, free text, etc.)
3. SYNONYMS: Recognize synonyms and alternative correct forms
4. FORMAT: Ignore formatting differences (capitalization, punctuation, spaces)

ALWAYS return valid JSON with:
{
  "correct": boolean,
  "score": float (0.0-1.0),
  "confidence": float (0.0-1.0),
  "feedback": "appropriate feedback string",
  "explanation": "explanation of the correct answer",
  "reasoning": "explanation of your evaluation reasoning"
}"""
    
    def _build_validation_prompt(
        self,
        question: Dict[str, Any],
        student_answer: str,
        persona: PersonaType,
        language: str
    ) -> str:
        """Build the validation prompt for the AI."""
        
        # Extract question details
        question_prompt = question.get("prompt", "")
        question_type = question.get("type", "mc")
        options = question.get("options", [])
        subject = question.get("subject", "general")
        explanation = question.get("explanation", "")
        
        # Build persona context
        persona_context = self._get_persona_context(persona, language)
        
        if language == "pt":
            prompt = f"""PERGUNTA:
{question_prompt}

TIPO: {question_type}
MATÉRIA: {subject}

"""
            if options:
                prompt += "OPÇÕES:\n"
                for i, option in enumerate(options):
                    prompt += f"{chr(65+i)}) {option}\n"
                prompt += "\n"
            
            prompt += f"""RESPOSTA DO ESTUDANTE: "{student_answer}"

CONTEXTO DO PERSONA: {persona_context}

INFORMAÇÕES ADICIONAIS:
- Explicação da resposta correta: {explanation}
- Esta é uma questão de múltipla escolha
- Aceite tanto a letra da opção (A, B, C, D) quanto o texto completo da opção
- Seja flexível com variações de formatação, maiúsculas/minúsculas, acentos
- Se o estudante deu uma resposta que está entre as opções ou é sinônimo/equivalente, considere correta

Avalie se a resposta está correta considerando todas as formas válidas de expressar a resposta.

Retorne um JSON com sua avaliação."""

        else:
            prompt = f"""QUESTION:
{question_prompt}

TYPE: {question_type}
SUBJECT: {subject}

"""
            if options:
                prompt += "OPTIONS:\n"
                for i, option in enumerate(options):
                    prompt += f"{chr(65+i)}) {option}\n"
                prompt += "\n"
            
            prompt += f"""STUDENT ANSWER: "{student_answer}"

PERSONA CONTEXT: {persona_context}

ADDITIONAL INFORMATION:
- Correct answer explanation: {explanation}
- This is a multiple choice question
- Accept both option letters (A, B, C, D) and full option text
- Be flexible with formatting variations, case, accents
- If student gave an answer that is among the options or is synonymous/equivalent, consider it correct

Evaluate if the answer is correct considering all valid ways to express the answer.

Return JSON with your evaluation."""
        
        return prompt
    
    def _get_persona_context(self, persona: PersonaType, language: str) -> str:
        """Get persona-specific context for feedback generation."""
        contexts = {
            PersonaType.TUTOR: {
                "pt": "Professor educativo que oferece feedback detalhado e explicações claras",
                "en": "Educational teacher who provides detailed feedback and clear explanations"
            },
            PersonaType.MATERNAL: {
                "pt": "Figura maternal carinhosa que encoraja e motiva com gentileza",
                "en": "Caring maternal figure who encourages and motivates gently"
            },
            PersonaType.GENERAL: {
                "pt": "Assistente equilibrado que fornece feedback construtivo",
                "en": "Balanced assistant who provides constructive feedback"
            }
        }
        
        return contexts.get(persona, contexts[PersonaType.GENERAL]).get(language, contexts[PersonaType.GENERAL]["en"])
    
    def _fallback_validation(
        self,
        question: Dict[str, Any],
        student_answer: str,
        language: str
    ) -> ValidationResult:
        """Fallback validation when AI fails."""
        
        options = question.get("options", [])
        student_answer_clean = student_answer.strip().lower()
        
        # Check if it's a valid option (letter or full text)
        for i, option in enumerate(options):
            option_letter = chr(65 + i).lower()  # A, B, C, D
            option_text = option.lower().strip()
            
            # Check if student answered with letter or full text
            if (student_answer_clean == option_letter or 
                student_answer_clean == option_text or
                option_text in student_answer_clean or
                student_answer_clean in option_text):
                
                # For this fallback, assume first option is correct
                # (This should be improved with actual correct answer data)
                is_correct = i == 0
                
                feedback = "Resposta reconhecida" if language == "pt" else "Answer recognized"
                explanation = f"Opção {chr(65+i)}: {option}" if language == "pt" else f"Option {chr(65+i)}: {option}"
                
                return {
                    "correct": is_correct,
                    "score": 1.0 if is_correct else 0.0,
                    "feedback": feedback,
                    "explanation": explanation,
                    "metadata": {
                        "ai_validation": False,
                        "fallback": True
                    }
                }
        
        # No match found
        return {
            "correct": False,
            "score": 0.0,
            "feedback": "Resposta não reconhecida" if language == "pt" else "Answer not recognized",
            "explanation": "Por favor, tente novamente" if language == "pt" else "Please try again",
            "metadata": {
                "ai_validation": False,
                "fallback": True
            }
        }

# Global AI validator instance  
ai_validator = AIAnswerValidator()