import type { H3Event } from 'h3'
import { createError, getCookie } from 'h3'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import type { UserProfile } from '../../../shared/types/account'
import {
  getD1Database,
  getSessionCookieName,
  hashSessionToken,
  resolveSessionByTokenHash,
} from '../../utils/accounts'

export interface SessionResponse {
  user: UserProfile
}

export default defineEventHandler(async (event: H3Event): Promise<SessionResponse> => {
  const cookieName = getSessionCookieName(event)
  if (!cookieName) {
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED } })
  }

  const token = getCookie(event, cookieName)
  if (!token) {
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED } })
  }

  let db
  try {
    db = getD1Database()
  } catch {
    throw createError({ statusCode: 503, data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE } })
  }

  const tokenHash = await hashSessionToken(token)
  const session = await resolveSessionByTokenHash(db, tokenHash)

  if (!session) {
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED } })
  }

  event.node.res.setHeader('Cache-Control', 'no-store')
  return { user: session.user }
})
