import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types'
import { AUTH_ERROR_CODES } from '../../shared/types/auth.error'
import type { UserProfile, AccountListRow, AdminAccountsResponse, OwnershipRow } from '../../shared/types/account'

const PBKDF2_ITERATIONS = 600000
const SALT_BYTES = 16
const HASH_BYTES = 32
const SESSION_TOKEN_BYTES = 32
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_BODY_BYTES = 8192
export const TRUSTED_ORIGIN =
  process.env.TRUSTED_ORIGIN ?? 'https://stocksx.nightdelaluna.workers.dev'

interface PasswordPart {
  version: number
  iterations: number
  saltHex: string
  hashHex: string
}

interface SessionTokenData {
  raw: string
  hash: string
}

function parsePasswordHash(stored: string): PasswordPart | null {
  const parts = stored.split(':')
  if (parts.length !== 4) return null
  return {
    version: Number.parseInt(parts[0]!, 10),
    iterations: Number.parseInt(parts[1]!, 10),
    saltHex: parts[2]!,
    hashHex: parts[3]!,
  }
}

export function validateName(name: string): { valid: boolean; errorCode?: AuthErrorCode; errorMessage?: string } {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Name is required' }
  }
  if (trimmed.length > 100) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Name must be at most 100 characters' }
  }
  return { valid: true }
}

export function validateEmail(email: string): { valid: boolean; errorCode?: AuthErrorCode; errorMessage?: string } {
  const trimmed = email.trim()
  if (trimmed.length === 0) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Email is required' }
  }
  if (trimmed.length > 254) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Email must be at most 254 characters' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Invalid email format' }
  }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; errorCode?: AuthErrorCode; errorMessage?: string } {
  let codePointCount = 0
  for (const _ of password) {
    codePointCount++
  }
  if (codePointCount < 15) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Password must be at least 15 characters' }
  }
  if (codePointCount > 128) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Password must be at most 128 characters' }
  }
  const bytes = new TextEncoder().encode(password).length
  if (bytes > 512) {
    return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Password exceeds maximum byte size' }
  }
  return { valid: true }
}

type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES]

export async function hashPasswordRaw(password: string): Promise<string> {
  const saltBuffer = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(saltBuffer)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedKey = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8,
  )
  const hashBuffer = new Uint8Array(derivedKey)
  return [1, PBKDF2_ITERATIONS, Buffer.from(saltBuffer).toString('hex'), Buffer.from(hashBuffer).toString('hex')].join(':')
}

export async function verifyPasswordWithHash(password: string, storedHash: string): Promise<boolean> {
  const parsed = parsePasswordHash(storedHash)
  if (!parsed) return false
  if (parsed.version !== 1 || parsed.iterations !== PBKDF2_ITERATIONS) return false
  const saltBuffer = Buffer.from(parsed.saltHex, 'hex')
  if (saltBuffer.length !== SALT_BYTES) return false
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedKey = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: parsed.iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8,
  )
  const derivedBuffer = new Uint8Array(derivedKey)
  const storedBuffer = Buffer.from(parsed.hashHex, 'hex')
  if (storedBuffer.length !== HASH_BYTES) return false
  return crypto.subtle.timingSafeEqual(derivedBuffer, storedBuffer)
}

const DUMMY_PASSWORD_HASH = '1:600000:' + '0'.repeat(32) + ':' + '0'.repeat(64)

export async function verifyPasswordFixedHash(password: string, storedHash: string): Promise<boolean> {
  const result1 = await verifyPasswordWithHash(password, storedHash)
  const result2 = await verifyPasswordWithHash(password, DUMMY_PASSWORD_HASH)
  return result1 || result2
}

export function generateSessionToken(): SessionTokenData {
  const rawBytes = new Uint8Array(SESSION_TOKEN_BYTES)
  crypto.getRandomValues(rawBytes)
  const raw = Buffer.from(rawBytes).toString('hex')
  const hash = Buffer.from(crypto.subtle.digestSync(new TextEncoder().encode(raw))).toString('hex')
  return { raw, hash }
}

export function getCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-stocksx_session' : 'stocksx_session_dev'
}

export function resolveRequestIp(event: H3Event): string {
  const headers = event.node.req.headers
  const cfIp = headers['cf-connecting-ip']
  if (typeof cfIp === 'string' && cfIp.length > 0) return cfIp
  return '127.0.0.1'
}

export function resolveTrustedOrigin(event: H3Event): string {
  const origin = event.node.req.headers.origin
  if (typeof origin !== 'string') return ''
  try {
    const url = new URL(origin)
    if (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost')) return url.toString()
  } catch {
    // ignore malformed origin
  }
  return ''
}

export function isOriginAllowed(event: H3Event, allowedOrigins: Set<string>): boolean {
  const origin = resolveRequestOrigin(event)
  if (origin.length === 0) return false
  return allowedOrigins.has(origin)
}

export function resolveRequestOrigin(event: H3Event): string {
  const raw = event.node.req.headers.origin
  if (typeof raw !== 'string') return ''
  return raw.trim()
}

export function getSessionCookieName(event: H3Event): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const origin = resolveRequestOrigin(event)
  if (isProduction && origin !== TRUSTED_ORIGIN) return ''
  return getCookieName(isProduction)
}

export function getD1Database(): D1Database {
  // Nitro sets globalThis.__env__ = workerd env which has DB binding
  // This matches event.context.cloudflare.env.DB at runtime
  // Use try/catch instead of throwing here; let callers handle the error
  if (typeof globalThis.__env__ === 'undefined') {
    throw createError({ statusCode: 503, data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE } })
  }
  const env = globalThis.__env__ as Record<string, unknown>
  const db = env.DB
  if (!(db && typeof db.prepare === 'function')) {
    throw createError({ statusCode: 503, data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE } })
  }
  return db as D1Database
}

export const enforceRegistrationRateLimit = limitRegister;
export async function limitRegister(event: H3Event): Promise<void> {
  const limiter = getRateLimiter()
  if (!limiter) return
  const ip = resolveRequestIp(event)
  const result = await limiter.limit({ key: `reg_${ip}` })
  if (!result.success) {
    throw createError({ statusCode: 429, data: { code: AUTH_ERROR_CODES.RATE_LIMITED } })
  }
}

export async function limitLogin(event: H3Event, canonicalEmail: string): Promise<void> {
  const limiter = getRateLimiter()
  if (!limiter) return
  const ip = resolveRequestIp(event)
  const ipResult = await limiter.limit({ key: `login_ip_${ip}` })
  if (!ipResult.success) {
    throw createError({ statusCode: 429, data: { code: AUTH_ERROR_CODES.RATE_LIMITED } })
  }
  const emailResult = await limiter.limit({ key: `login_email_${canonicalEmail}` })
  if (!emailResult.success) {
    throw createError({ statusCode: 429, data: { code: AUTH_ERROR_CODES.RATE_LIMITED } })
  }
}

// Exported for testing
export function getRateLimiter(): { limit: (options: { key: string }) => Promise<{ success: boolean }> } | null {
  const env = globalThis.__env__ as Record<string, unknown> | undefined
  if (!env) return null
  const register = env.REGISTER_LIMITER
  const login = env.LOGIN_LIMITER
  if (!register && !login) return null
  // Return a unified limiter stub that proxies to either binding
  const combined = {
    async limit(options: { key: string }): Promise<{ success: boolean }> {
      const key = options.key
      if (key.startsWith('reg_')) {
        if (typeof register?.limit !== 'function') return { success: true }
        return register.limit({ key: key.slice(4) })
      }
      if (key.startsWith('login_')) {
        if (typeof login?.limit !== 'function') return { success: true }
        return login.limit({ key: key.slice(6) })
      }
      return { success: true }
    },
  }
  return combined
}

export function projectUserProfile(row: { id: string; name: string; email: string; role: string }): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserProfile['role'],
  }
}

export function setSessionCookie(event: H3Event, token: string): void {
  const cookieName = getSessionCookieName(event)
  if (cookieName.length === 0) return
  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(event: H3Event): void {
  const cookieName = getSessionCookieName(event)
  if (cookieName.length === 0) return
  deleteCookie(event, cookieName, { path: '/' })
}

export async function insertAccount(db: D1Database, name: string, canonicalEmail: string, passwordHash: string): Promise<{ id: string; created_at: number }> {
  const id = crypto.randomUUID()
  const created_at = Date.now()
  const stmt = db.prepare(
    `INSERT INTO accounts (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)`
  )
  try {
    await stmt.bind(id, name, canonicalEmail, passwordHash, created_at).run()
    return { id, created_at }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('UNIQUE') || message.includes('unique') || message.includes('SQLITE_CONSTRAINT') || message.includes('constraint')) {
      throw createError({ statusCode: 409, data: { code: AUTH_ERROR_CODES.EMAIL_EXISTS } })
    }
    throw createError({ statusCode: 503, data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE } })
  }
}

export async function getAccountByEmail(db: D1Database, canonicalEmail: string): Promise<{ id: string; name: string; email: string; role: string; password_hash: string; created_at: number } | null> {
  const stmt = db.prepare(`SELECT id, name, email, role, password_hash, created_at FROM accounts WHERE email = ? LIMIT 1`)
  const result = await stmt.bind(canonicalEmail).first()
  return result
}

export async function getAccountById(db: D1Database, accountId: string): Promise<UserProfile | null> {
  const stmt = db.prepare(`SELECT id, name, email, role FROM accounts WHERE id = ? LIMIT 1`)
  const row = await stmt.bind(accountId).first()
  if (!row) return null
  return projectUserProfile(row as { id: string; name: string; email: string; role: string })
}

export async function insertSession(db: D1Database, accountId: string, tokenHash: string): Promise<number> {
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_MS
  await db.prepare(
    `INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)`
  ).bind(tokenHash, accountId, now, expiresAt).run()
  return expiresAt
}

export async function resolveSessionByTokenHash(db: D1Database, tokenHash: string): Promise<{ user: UserProfile; expires_at: number } | null> {
  const stmt = db.prepare(
    `SELECT a.id, a.name, a.email, a.role, s.expires_at FROM sessions s JOIN accounts a ON s.account_id = a.id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`
  )
  const row = await stmt.bind(tokenHash, Date.now()).first()
  if (!row) return null
  return {
    user: projectUserProfile(row as { id: string; name: string; email: string; role: string }),
    expires_at: Number(row.expires_at),
  }
}

export async function revokeSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run()
}

export async function revokeSessionsByAccountId(db: D1Database, accountId: string): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE account_id = ?`).bind(accountId).run()
}

export async function isAdmin(db: D1Database, accountId: string): Promise<boolean> {
  const stmt = db.prepare(`SELECT role FROM accounts WHERE id = ? LIMIT 1`)
  const row = await stmt.bind(accountId).first<{ role: string }>()
  if (!row) return false
  return row.role === 'admin' || row.role === 'superadmin'
}

export function buildErrorResponse(code: AuthErrorCode, statusCode: number): never {
  throw createError({ statusCode, data: { code } })
}

export async function queryAdminAccounts(
  db: D1Database,
  page: number,
  pageSize: number,
): Promise<AdminAccountsResponse> {
  const safePage = Math.max(1, page)
  const safePageSize = Math.min(100, Math.max(1, pageSize))
  const offset = (safePage - 1) * safePageSize

  const totalStmt = db.prepare(`SELECT COUNT(*) AS count FROM accounts`)
  const totalRow = await totalStmt.first<{ count: number }>()
  const totalAccounts = Number(totalRow?.count ?? 0)

  const adminCountStmt = db.prepare(`SELECT COUNT(*) AS count FROM accounts WHERE role IN ('admin', 'superadmin')`)
  const adminRow = await adminCountStmt.first<{ count: number }>()
  const adminAccounts = Number(adminRow?.count ?? 0)

  const sessionCountStmt = db.prepare(`SELECT COUNT(*) AS count FROM sessions WHERE expires_at > ?`)
  const sessionRow = await sessionCountStmt.bind(Date.now()).first<{ count: number }>()
  const activeSessions = Number(sessionRow?.count ?? 0)

  const rowsStmt = db.prepare(
    `SELECT id, name, email, role, created_at FROM accounts ORDER BY created_at ASC LIMIT ? OFFSET ?`
  )
  const rows = await rowsStmt.bind(safePageSize, offset).all<{ id: string; name: string; email: string; role: string; created_at: number }>()

  const accounts: AccountListRow[] = rows.results.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as AccountListRow['role'],
    createdAt: Number(r.created_at),
  }))

  return { accounts, page: safePage, pageSize: safePageSize, totalAccounts, adminAccounts, activeSessions }
}

export async function queryOwnershipByStockCode(db: D1Database, stockCode: string): Promise<OwnershipRow[]> {
  const stmt = db.prepare(
    `SELECT share_code, investor_code, percentage, confidence, notes FROM ownership_records WHERE share_code = ?`
  )
  const rows = await stmt.bind(stockCode).all<OwnershipRow>()
  return rows.results
}

export function normalizeOwnershipTicker(ticker: string): string {
  const upper = ticker.toUpperCase().trim()
  return upper.endsWith('.JK') ? upper.slice(0, -3) : upper
}

export function addNoStoreHeaders(event: H3Event): void {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Vary', 'Origin')
}

export function addRetryAfterHeader(event: H3Event): void {
  setResponseHeader(event, 'Retry-After', '60')
}

export function ensureJsonContentType(event: H3Event): void {
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
}

// Re-export h3 helpers for convenience in handlers
import { setCookie, deleteCookie, setResponseHeader } from 'h3'
