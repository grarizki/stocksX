import { DUMMY_STOCKS } from '../../../utils/dummy'

export default defineEventHandler((event) => {
  const ticker = getRouterParam(event, 'ticker')!
  const stock = DUMMY_STOCKS[ticker]

  if (!stock) {
    throw createError({ statusCode: 404, statusMessage: `Stock ${ticker} not found` })
  }

  return stock
})
