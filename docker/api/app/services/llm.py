import os
from langchain_openai import ChatOpenAI
from backend.utils.constants import MODEL_NAME

llm = ChatOpenAI(
    model=MODEL_NAME,  
    temperature=0.2,
    api_key=os.getenv("OPENAI_API_KEY"),
)

async def ask_agent(system_prompt: str, user_msg: str) -> str:
    resp = await llm.ainvoke([{"role": "system", "content": system_prompt},
                              {"role": "user", "content": user_msg}])
    return resp.content
