import { getAllStocks } from '../../utils/dummy'

type MoverType = 'gainers' | 'losers' | 'active'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const type = (query.type as MoverType) ?? 'gainers'
  const limit = Number(query.limit ?? 5)

  const all = getAllStocks()

  if (type === 'gainers') {
    return all
      .filter((s) => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit)
  }
  if (type === 'losers') {
    return all
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit)
  }
  // active
  return all
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
})
