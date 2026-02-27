import Anthropic from '@anthropic-ai/sdk'

interface Trade {
  entryPrice: number
  exitPrice: number
  pnlPct: number
}

interface BacktestPayload {
  ticker: string
  strategy: string
  params: Record<string, number>
  range: string
  result: {
    totalReturn: number
    winRate: number
    maxDrawdown: number
    totalTrades: number
    avgPnl: number
    sharpe: number
    trades: Trade[]
  }
}

interface TradeSetup {
  entry: number
  target: number
  stopLoss: number
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  summary: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BacktestPayload>(event)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  }

  const client = new Anthropic({ apiKey })

  const { ticker, strategy, params, range, result } = body

  if (!result.trades.length) {
    throw createError({ statusCode: 400, message: 'No trades to analyze' })
  }

  const bestTrade = [...result.trades].sort((a, b) => b.pnlPct - a.pnlPct)[0]!
  const paramsStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ')
  const isIDX = ticker.endsWith('.JK')

  const prompt = `You are a quantitative trading analyst. Based on the best-performing trade pattern from a backtest, suggest a new trade setup.

Stock: ${ticker}
Strategy: ${strategy} (${paramsStr})
Period: ${range}
Overall: ${result.totalTrades} trades, ${result.winRate.toFixed(1)}% win rate, ${result.totalReturn.toFixed(2)}% total return

Best trade:
- Entry price: ${bestTrade.entryPrice}
- Exit price: ${bestTrade.exitPrice}
- Return: +${bestTrade.pnlPct.toFixed(2)}%

Based on this best trade's pattern, suggest a hypothetical new trade setup. Use the best trade's entry price as the entry. Calculate a target price that mirrors a similar % gain, and a stop loss maintaining at least 1.5:1 risk-reward ratio.

Also give an overall rating for this trade opportunity based on all the backtest metrics (win rate, total return, drawdown, Sharpe). Rating must be exactly one of: "strong_buy", "buy", "hold", "sell", "strong_sell".

Write the summary in ${isIDX ? 'Indonesian' : 'English'} (max 15 words).

Respond with ONLY valid JSON, no markdown, no explanation:
{"entry": <number>, "target": <number>, "stopLoss": <number>, "rating": "<rating>", "summary": "<string>"}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const first = message.content[0]
  const raw = first?.type === 'text' ? first.text.trim() : ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let setup: TradeSetup
  try {
    setup = JSON.parse(text)
  } catch {
    throw createError({ statusCode: 500, message: `AI returned invalid JSON: ${text.slice(0, 100)}` })
  }

  return setup
})
