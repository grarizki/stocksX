import type { H3Event } from 'h3'
import { createError, getCookie } from 'h3'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import {
  getD1Database,
  getSessionCookieName,
  limitLogin,
  verifyPasswordFixedHash,
  generateSessionToken,
  setSessionCookie,
  getAccountByEmail,
  insertSession,
  revokeSession,
  hashSessionToken,
  projectUserProfile,
  addNoStoreHeaders,
  resolveRequestOrigin,
  TRUSTED_ORIGIN,
  DUMMY_PASSWORD_HASH,
} from '../../utils/accounts'

export default defineEventHandler(async (event: H3Event) => {
  const origin = resolveRequestOrigin(event)
  if (origin !== TRUSTED_ORIGIN) {
    throw createError({ statusCode: 403, data: { code: AUTH_ERROR_CODES.FORBIDDEN } })
  }

  const body = await readBody<{ email: string; password: string }>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, data: { code: AUTH_ERROR_CODES.INVALID_INPUT } })
  }

  const canonicalEmail = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''

  await limitLogin(event, canonicalEmail)

  let db
  try {
    db = getD1Database()
  } catch {
    throw createError({ statusCode: 503, data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE } })
  }

  const cookieName = getSessionCookieName(event)
  if (cookieName) {
    const priorToken = getCookie(event, cookieName)
    if (priorToken) {
      await revokeSession(db, await hashSessionToken(priorToken))
    }
  }

  const account = await getAccountByEmail(db, canonicalEmail)
  if (!account) {
    await verifyPasswordFixedHash(password, DUMMY_PASSWORD_HASH)
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } })
  }

  const passwordValid = await verifyPasswordFixedHash(password, account.password_hash)
  if (!passwordValid) {
    throw createError({ statusCode: 401, data: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } })
  }

  const sessionToken = await generateSessionToken()
  await insertSession(db, account.id, sessionToken.hash)
  setSessionCookie(event, sessionToken.raw)

  addNoStoreHeaders(event)
  return { response: { user: projectUserProfile(account) } }
})