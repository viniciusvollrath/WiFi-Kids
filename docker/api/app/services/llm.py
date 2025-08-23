import os
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-5-reasoning",  # ajuste para o nome real no seu ambiente
    temperature=0.2,
    api_key=os.getenv("OPENAI_API_KEY"),
)

async def ask_agent(system_prompt: str, user_msg: str) -> str:
    resp = await llm.ainvoke([{"role": "system", "content": system_prompt},
                              {"role": "user", "content": user_msg}])
    return resp.content
