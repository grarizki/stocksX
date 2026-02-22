import { yf } from '../../utils/yf'
import { TICKERS } from '../../../app/data/stocks'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tickersParam = query.tickers as string | undefined
  const tickers = tickersParam ? tickersParam.split(',').map((t) => t.trim()).filter(Boolean) : TICKERS

  const results = await yf.quote(tickers)
  const quotes = Array.isArray(results) ? results : [results]

  return quotes.map((q) => ({
    ticker: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    sector: q.sector ?? 'Unknown',
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    pe: q.trailingPE ?? 0,
    pbv: q.priceToBook ?? 0,
    dividendYield: q.trailingAnnualDividendYield ? q.trailingAnnualDividendYield * 100 : 0,
    high52w: q.fiftyTwoWeekHigh ?? 0,
    low52w: q.fiftyTwoWeekLow ?? 0,
    about: q.longBusinessSummary ?? '',
  }))
})
