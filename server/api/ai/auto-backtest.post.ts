import Anthropic from '@anthropic-ai/sdk'

interface OHLCVBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface AutoBacktestPayload {
  ticker: string
  range: string
  ohlcvSample: OHLCVBar[]
}

interface AutoBacktestResponse {
  strategy: 'ma_cross' | 'rsi' | 'breakout'
  params: Record<string, number>
  rationale: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AutoBacktestPayload>(event)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  }

  const client = new Anthropic({ apiKey })

  const { ticker, range, ohlcvSample } = body
  const isIDX = ticker.endsWith('.JK')

  // Compress OHLCV to a readable table (last 60 bars max)
  const bars = ohlcvSample.slice(-60)
  const closes = bars.map(b => b.close)
  const highs = bars.map(b => b.high)
  const lows = bars.map(b => b.low)

  const recentClose = closes[closes.length - 1] ?? 0
  const oldest = closes[0] ?? 0
  const trendPct = oldest > 0 ? (((recentClose - oldest) / oldest) * 100).toFixed(1) : '0'

  // Volatility: average true range approximation
  const atrApprox = bars.slice(1).reduce((sum, b, i) => {
    const prev = bars[i]!
    return sum + Math.max(b.high - b.low, Math.abs(b.high - prev.close), Math.abs(b.low - prev.close))
  }, 0) / (bars.length - 1)
  const atrPct = ((atrApprox / recentClose) * 100).toFixed(2)

  const maxHigh = Math.max(...highs).toFixed(0)
  const minLow = Math.min(...lows).toFixed(0)

  const prompt = `You are a quantitative trading analyst. Analyze this stock and pick the single best backtest strategy.

Stock: ${ticker}
Range: ${range}
Bars analyzed: ${bars.length}
Recent close: ${recentClose}
Trend (oldest→latest): ${trendPct}%
Avg volatility (ATR%): ${atrPct}%
Period high: ${maxHigh}, Period low: ${minLow}

Available strategies:
1. "ma_cross" — MA Crossover. Params: fastMA (int, 5–50), slowMA (int, 20–200). Best for trending markets.
2. "rsi" — RSI Mean Reversion. Params: rsiPeriod (int, 7–21). Best for ranging/oscillating markets.
3. "breakout" — Breakout. Params: breakoutPeriod (int, 10–50). Best for low-volatility consolidation breakouts.

Pick the single most suitable strategy and optimal params for this stock's recent behavior. Write rationale in ${isIDX ? 'Indonesian' : 'English'} (max 12 words).

Respond with ONLY valid JSON, no markdown:
{"strategy":"<id>","params":{"<param>": <value>},"rationale":"<string>"}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const first = message.content[0]
  const raw = first?.type === 'text' ? first.text.trim() : ''
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let result: AutoBacktestResponse
  try {
    result = JSON.parse(text)
  } catch {
    throw createError({ statusCode: 500, message: `AI returned invalid JSON: ${text.slice(0, 100)}` })
  }

  return result
})
