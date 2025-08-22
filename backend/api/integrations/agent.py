# api/integrations/agent.py
import random
from typing import Dict, List, Literal, TypedDict

QuestionType = Literal["mc", "short"]

class Question(TypedDict):
    id: str
    type: QuestionType
    prompt: str
    options: List[str] | None
    answer_len: int | None

class AgentService:
    """
    Contrato da integração de 'agente' (LangChain no futuro).
    """
    def generate_challenge(self, locale: str, mac: str, router_id: str) -> Dict:
        raise NotImplementedError

    def check_answers(self, payload: Dict, answers: List[Dict]) -> bool:
        raise NotImplementedError

class MockAgent(AgentService):
    """
    Gera 1–3 perguntas simples e guarda o gabarito na própria payload.
    """
    def generate_challenge(self, locale: str, mac: str, router_id: str) -> Dict:
        # 1 a 3 perguntas de soma
        n = random.randint(1, 3)
        questions: List[Question] = []
        answer_key: Dict[str, str] = {}
        for i in range(1, n + 1):
            a, b = random.randint(1, 9), random.randint(1, 9)
            qid = f"q{i}"
            questions.append({
                "id": qid,
                "type": "mc",
                "prompt": f"Quanto é {a}+{b}?",
                "options": [str(a+b), str(a+b+1), str(a+b-1)],
                "answer_len": None
            })
            answer_key[qid] = str(a + b)
        return {"questions": questions, "answer_key": answer_key}

    def check_answers(self, payload: Dict, answers: List[Dict]) -> bool:
        key: Dict[str, str] = payload.get("answer_key", {})
        for ans in answers:
            if key.get(ans["id"]) != str(ans["value"]).strip():
                return False
        return True
