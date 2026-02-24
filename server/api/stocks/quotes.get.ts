import { getAllStocks, getStocksByTickers } from '../../utils/dummy'
import { TICKERS } from '../../../app/data/stocks'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const tickersParam = query.tickers as string | undefined
  const tickers = tickersParam ? tickersParam.split(',').map((t) => t.trim()).filter(Boolean) : TICKERS

  return getStocksByTickers(tickers).length > 0 ? getStocksByTickers(tickers) : getAllStocks()
})
