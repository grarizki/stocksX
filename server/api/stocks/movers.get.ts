import { yf } from '../../utils/yf'
import { TICKERS } from '../../../app/data/stocks'

type MoverType = 'gainers' | 'losers' | 'active'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = (query.type as MoverType) ?? 'gainers'
  const limit = Number(query.limit ?? 5)

  const results = await yf.quote(TICKERS)
  const quotes = Array.isArray(results) ? results : [results]

  const mapped = quotes.map((q) => ({
    ticker: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    sector: 'sector' in q ? (q.sector as string) : 'Unknown',
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    pe: 0,
    pbv: 0,
    dividendYield: 0,
    high52w: q.fiftyTwoWeekHigh ?? 0,
    low52w: q.fiftyTwoWeekLow ?? 0,
    about: '',
  }))

  if (type === 'gainers') {
    return mapped
      .filter((s) => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit)
  }
  if (type === 'losers') {
    return mapped
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit)
  }
  // active
  return mapped
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
})
