import { INDICATOR_HISTORY } from '../../../utils/indicatorHistory'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!

  const history = INDICATOR_HISTORY[id]
  if (!history) {
    throw createError({ statusCode: 404, statusMessage: `Indicator "${id}" not found` })
  }

  return history
})
