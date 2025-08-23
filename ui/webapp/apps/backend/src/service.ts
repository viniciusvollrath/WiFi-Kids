
import 'dotenv/config'

function parseWindows(s: string | undefined) {
  if (!s) return []
  return s.split(';').map(win => {
    const [start, end] = win.split('-')
    return { start, end }
  })
}

export function buildPolicyFromEnv() {
  const persona = process.env.WFK_PERSONA || 'tutor'
  const daily = Number(process.env.POLICY_DAILY_MAX || 120)
  const quotasStr = process.env.POLICY_PERIOD_QUOTAS || 'morning:30,afternoon:45,night:30'
  const quota: any = {}
  quotasStr.split(',').forEach(pair => {
    const [k,v] = pair.split(':')
    quota[k] = Number(v)
  })
  return {
    block_windows: parseWindows(process.env.POLICY_BLOCK_WINDOWS),
    study_windows: parseWindows(process.env.POLICY_STUDY_WINDOWS).map(w => ({...w, topics:['math']})),
    quota_minutes_per_period: quota,
    daily_max_minutes: daily,
    persona
  }
}

export function getPeriod() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'night'
}

const usage: Record<string, number> = {}
export async function getUsage(device_id: string) {
  return usage[device_id] ?? 0
}

export function resolveGateway(req: any) {
  const q = req.query || {}
  return {
    gatewayname: q.gatewayname || 'WiFiKids',
    tok: q.tok || null
  }
}

export async function openndsGrant(tok: string) {
  const base = process.env.OPENNDS_GATEWAY || 'http://127.0.0.1:2050'
  const path = process.env.OPENNDS_GRANT_PATH || '/fas/gateway'
  const url = `${base}${path}?tok=${encodeURIComponent(tok)}&auth_target=%5Cx30`
  // For demo purposes, we log instead of actually calling OpenNDS.
  console.log('[FAS] Grant ->', url)
  // In production: await fetch(url).then(r=>r.text())
}
