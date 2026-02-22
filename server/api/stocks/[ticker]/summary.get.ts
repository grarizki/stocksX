import { yf } from '../../../utils/yf'

export default defineEventHandler(async (event) => {
  const ticker = getRouterParam(event, 'ticker')!

  const [quote, summary] = await Promise.all([
    yf.quote(ticker),
    yf.quoteSummary(ticker, {
      modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics'],
    }).catch(() => null),
  ])

  const profile = summary?.assetProfile
  const detail = summary?.summaryDetail
  const stats = summary?.defaultKeyStatistics

  return {
    ticker: quote.symbol,
    name: quote.longName ?? quote.shortName ?? quote.symbol,
    sector: profile?.sector ?? quote.sector ?? 'Unknown',
    price: quote.regularMarketPrice ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    volume: quote.regularMarketVolume ?? 0,
    marketCap: quote.marketCap ?? 0,
    pe: quote.trailingPE ?? 0,
    pbv: quote.priceToBook ?? 0,
    dividendYield: detail?.dividendYield ? detail.dividendYield * 100 : 0,
    high52w: quote.fiftyTwoWeekHigh ?? 0,
    low52w: quote.fiftyTwoWeekLow ?? 0,
    about: profile?.longBusinessSummary ?? '',
    // Extra detail fields
    employees: profile?.fullTimeEmployees ?? null,
    website: profile?.website ?? null,
    industry: profile?.industry ?? null,
    country: profile?.country ?? null,
    eps: stats?.trailingEps ?? null,
    beta: stats?.beta ?? null,
    avgVolume: quote.averageDailyVolume3Month ?? null,
    openPrice: quote.regularMarketOpen ?? null,
    prevClose: quote.regularMarketPreviousClose ?? null,
    dayHigh: quote.regularMarketDayHigh ?? null,
    dayLow: quote.regularMarketDayLow ?? null,
  }
})
