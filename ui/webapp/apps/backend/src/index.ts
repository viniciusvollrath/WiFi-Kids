
import 'dotenv/config'
import express from 'express'
import { z } from 'zod'
import { decide } from './langchain.js'
import { buildPolicyFromEnv, getPeriod, getUsage, openndsGrant, resolveGateway } from './service.js'

const app = express()
app.use(express.json())

// simple helper for IP (used by PWA fingerprint)
app.get('/api/ip', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || ''
  res.type('text/plain').send(ip)
})

const SessionReq = z.object({
  device_id: z.string().min(16),
  locale: z.enum(['pt','en']),
  answer: z.string().nullish()
})

app.post('/api/session/request', async (req, res) => {
  const parse = SessionReq.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'bad_request' })

  const { device_id, locale, answer } = parse.data
  const now_iso = new Date().toISOString()
  const policy = buildPolicyFromEnv()
  const usage_today_minutes = await getUsage(device_id)
  const period = getPeriod()
  const child_profile = { name: 'Amigo', age: 10 }

  const { gatewayname, tok } = resolveGateway(req)

  const input = {
    router_id: gatewayname,
    device_id,
    locale: locale === 'pt' ? 'pt-BR' : 'en-US',
    now_iso,
    policy,
    usage_today_minutes,
    period,
    child_profile,
    answer: answer ?? null
  }

  try {
    const decision = await decide(input)
    if (decision.decision === 'ALLOW' && tok) {
      await openndsGrant(tok)
    }
    res.json(decision)
  } catch (e:any) {
    console.error(e)
    res.status(500).json({ error: 'internal_error' })
  }
})

const port = process.env.PORT ? Number(process.env.PORT) : 3001
app.listen(port, () => console.log(`[backend] listening on :${port}`))
