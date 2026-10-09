import type { H3Event } from 'h3'
import { createError, getQuery, getCookie } from 'h3'
import type { D1Database } from '@cloudflare/workers-types'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import {
  addNoStoreHeaders,
  ensureJsonContentType,
  getD1Database,
  getSessionCookieName,
  hashSessionToken,
  resolveSessionByTokenHash,
  isAdmin,
  queryAdminAccounts,
} from '../../utils/accounts'
import type { AdminAccountsResponse } from '../../../shared/types/account'

export default defineEventHandler(async (event: H3Event): Promise<AdminAccountsResponse> => {
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

  const isUserAdmin = await isAdmin(db, session.user.id)
  if (!isUserAdmin) {
    throw createError({ statusCode: 403, data: { code: AUTH_ERROR_CODES.FORBIDDEN } })
  }

  const { page, pageSize } = getQuery(event)
  const pageNumber = Number(page) || 1
  const pageSizeNumber = Number(pageSize) || 25

  const accounts: AdminAccountsResponse = await queryAdminAccounts(db, pageNumber, pageSizeNumber)

  addNoStoreHeaders(event)
  ensureJsonContentType(event)

  return accounts
})
