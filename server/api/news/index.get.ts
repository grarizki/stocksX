import { yf } from '../../utils/yf'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string) ?? 'stock market'
  const limit = Number(query.limit ?? 20)

  const result = await yf.search(q, { newsCount: limit, quotesCount: 0 })
  const news = result.news ?? []

  return news.slice(0, limit).map((item) => ({
    id: item.uuid,
    title: item.title,
    summary: item.summary ?? '',
    source: item.publisher ?? 'Yahoo Finance',
    url: item.link,
    date: item.providerPublishTime instanceof Date
      ? item.providerPublishTime.toISOString()
      : new Date().toISOString(),
    imageUrl: item.thumbnail?.resolutions?.[0]?.url ?? '',
    relatedTickers: item.relatedTickers ?? [],
    category: 'market' as const,
  }))
})
