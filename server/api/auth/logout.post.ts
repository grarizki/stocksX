import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie } from 'h3'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import type { UserProfile } from '../../../shared/types/account'
import {
  getD1Database,
  getSessionCookieName,
  hashSessionToken,
  revokeSession,
} from '../../utils/accounts'

export default defineEventHandler(async (event: H3Event) => {
  const cookieName = getSessionCookieName(event)

  if (cookieName) {
    const token = getCookie(event, cookieName)
    if (token) {
      try {
        const db = getD1Database()
        const tokenHash = await hashSessionToken(token)
        await revokeSession(db, tokenHash)
      } catch {
        // logout must be idempotent; missing DB or missing session still clears the cookie
      }
    }
    deleteCookie(event, cookieName, { path: '/' })
  }

  event.node.res.setHeader('Cache-Control', 'no-store')
  return { success: true }
})
