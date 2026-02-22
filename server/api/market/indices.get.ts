import { yf } from '../../utils/yf'

const INDEX_TICKERS = ['^JKSE', '^JKLQ45', '^JKIDX']

export default defineEventHandler(async () => {
  const results = await yf.quote(INDEX_TICKERS)
  const quotes = Array.isArray(results) ? results : [results]

  return quotes.map((q) => ({
    ticker: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
  }))
})
