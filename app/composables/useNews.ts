export type NewsArticle = {
  id: string
  title: string
  summary: string
  source: string
  url: string
  date: string
  imageUrl: string
  relatedTickers: string[]
  category: 'market' | 'stocks' | 'economy' | 'education'
}

export const useNews = () => {
  const getNews = (limit = 20) =>
    useApiFetch<NewsArticle[]>('/api/news', { query: { limit } })

  const getNewsForStock = (ticker: string, limit = 10) =>
    useApiFetch<NewsArticle[]>('/api/news', { query: { q: ticker, limit } })

  return {
    getNews,
    getNewsForStock,
  }
}
