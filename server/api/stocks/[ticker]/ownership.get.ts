import type { H3Event } from 'h3'
import { createError } from 'h3'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import type { OwnershipRow } from '../../../shared/types/account'
import {
  getD1Database,
  getSessionCookieName,
  hashSessionToken,
  resolveSessionByTokenHash,
  addNoStoreHeaders,
} from '../../utils/accounts'

export interface OwnershipResponse {
  records: OwnershipRow[]
}

export default defineEventHandler(async (event: H3Event): Promise<OwnershipResponse> => {
  const raw = getRouterParam(event, "ticker")
  const ticker = raw ? (raw.toUpperCase().endsWith(".JK") ? raw.toUpperCase().slice(0, -3) : raw.toUpperCase()) : ''

  const cookieName = getSessionCookieName(event)
  if (!cookieName) {
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED } })
  }

  const token = getCookie(event, cookieName)
  if (!token) {
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED } })
  }

  let db: D1Database
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

  const stmt = db.prepare(
    'SELECT share_code, investor_code, percentage, confidence, notes FROM ownership_records WHERE share_code = ?',
  )
  const rows = await stmt.bind(ticker).all<OwnershipRow>()

  addNoStoreHeaders(event)
  return { records: rows }
})
