import { yf } from '../../utils/yf'
import { SECTOR_ETFS } from '../../../app/data/sectors'

export default defineEventHandler(async () => {
  const etfTickers = SECTOR_ETFS.map((s) => s.etfTicker)
  const results = await yf.quote(etfTickers)
  const quotes = Array.isArray(results) ? results : [results]

  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]))

  return SECTOR_ETFS.map((sector) => {
    const q = quoteMap.get(sector.etfTicker)
    return {
      id: sector.id,
      name: sector.name,
      etfTicker: sector.etfTicker,
      change: q?.regularMarketChangePercent ?? 0,
      price: q?.regularMarketPrice ?? 0,
      marketCap: q?.marketCap ?? 0,
    }
  })
})
