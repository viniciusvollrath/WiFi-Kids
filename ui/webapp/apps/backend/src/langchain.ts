
import { ChatOpenAI } from '@langchain/openai'
import { readFileSync } from 'fs'

const SYSTEM_PROMPT = readFileSync(new URL('./codex_prompt.txt', import.meta.url), 'utf8')
const llm = new ChatOpenAI({ model: 'gpt-5-thinking', temperature: 0 })

export async function decide(input: any) {
  // In production, use a proper prompt template. Here we inline a strict instruction to return JSON only.
  const resp = await llm.invoke([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(input) + "\nReturn ONLY the JSON output as per schema." }
  ])
  const text = resp.content as string
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('invalid_json_response')
  }
}
