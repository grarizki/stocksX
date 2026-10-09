import { createError } from 'h3'
import { AUTH_ERROR_CODES } from '../../shared/types/auth.error'
import type { CloudflareEnv, H3EventContext } from '../types/cloudflare'

const PBKDF2_ITERATIONS = 600000
const SALT_LENGTH = 16
const HASH_LENGTH = 32
const SESSION_TOKEN_LENGTH = 32
const SESSION_EXPIRY_DAYS = 7

interface PasswordHash {
	version: number
	iterations: number
	salt: string
	hash: string
}

interface SessionRow {
	token_hash: string
	account_id: string
	created_at: number
	expires_at: number
}

interface AccountRow {
	id: string
	name: string
	email: string
	password_hash: string
	role: string
	created_at: number
}

interface ValidationResult {
	valid: boolean
	errorCode?: string
	errorMessage?: string
}

function utf8ByteLength(str: string): number {
	return new TextEncoder().encode(str).length
}

function unicodeCodePointCount(str: string): number {
	return Array.from(str).length
}

export function validateName(name: string): ValidationResult {
	const trimmed = name.trim()
	if (!trimmed) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Name is required' }
	}
	if (trimmed.length > 100) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Name must be 100 characters or less' }
	}
	return { valid: true }
}

export function validateEmail(email: string): ValidationResult {
	const trimmed = email.trim()
	if (!trimmed) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Email is required' }
	}
	if (trimmed.length > 254) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Email must be 254 characters or less' }
	}
	const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
	if (!emailRegex.test(trimmed)) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Invalid email format' }
	}
	return { valid: true }
}

export function validatePassword(password: string): ValidationResult {
	const codePointCount = unicodeCodePointCount(password)
	if (codePointCount < 15) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Password must be at least 15 characters' }
	}
	if (codePointCount > 128) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Password must be 128 characters or less' }
	}
	const utf8Bytes = utf8ByteLength(password)
	if (utf8Bytes > 512) {
		return { valid: false, errorCode: AUTH_ERROR_CODES.INVALID_INPUT, errorMessage: 'Password exceeds maximum byte size' }
	}
	return { valid: true }
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
	const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(0))

	const encoder = new TextEncoder()
	const saltArray = salt

	const subtleCrypto = await window.crypto.subtle || crypto.subtle
	const keyMaterial = await subtleCrypto.importKey(
		'raw',
		encoder.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	)

	const derivedKey = await subtleCrypto.deriveBits(
		{
			name: 'PBKDF2',
			salt: saltArray,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		keyMaterial,
		HASH_LENGTH * 8
	)

	const hashArray = new Uint8Array(derivedKey)

	const hash: PasswordHash = {
		version: 1,
		iterations: PBKDF2_ITERATIONS,
		salt: Buffer.from(saltArray).toString('hex'),
		hash: Buffer.from(hashArray).toString('hex')
	}

	return `${hash.version}:${hash.iterations}:${hash.salt}:${hash.hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	try {
		const parts = storedHash.split(':')
		if (parts.length !== 4) return false

		const [version, iterations, saltHex, hashHex] = parts
		if (parseInt(version, 10) !== 1) return false

		const iterationsNum = parseInt(iterations, 10)
		if (iterationsNum !== PBKDF2_ITERATIONS) return false

		const salt = Buffer.from(saltHex, 'hex')
		const storedHashBytes = Buffer.from(hashHex, 'hex')

		const subtleCrypto = await window.crypto.subtle || crypto.subtle
		const keyMaterial = await subtleCrypto.importKey(
			'raw',
			new TextEncoder().encode(password),
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		)

		const derivedKey = await subtleCrypto.deriveBits(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: iterationsNum,
				hash: 'SHA-256'
			},
			keyMaterial,
			HASH_LENGTH * 8
		)

		const derivedHashBytes = new Uint8Array(derivedKey)

		const timingSafeResult = crypto.subtle.timingSafeEqual
			? crypto.timingSafeEqual(derivedHashBytes, storedHashBytes)
			: Buffer.from(derivedHashBytes).equals(storedHashBytes)

		return timingSafeResult
	} catch {
		return false
	}
}

const DUMMY_HASH = '1:600000:' + '0'.repeat(32) + ':' + '0'.repeat(64)

export async function verifyPasswordFixedHash(
	password: string,
	storedHash: string,
	tokenHash: string
): Promise<boolean> {
	const result1 = await verifyPassword(password, storedHash)
	const result2 = await verifyPassword(password, DUMMY_HASH)
	return result1 || result2
}

export function generateSessionToken(): string {
	const array = new Uint8Array(SESSION_TOKEN_LENGTH)
	crypto.getRandomValues(array)
	return Buffer.from(array).toString('hex')
}

export function hashSessionToken(token: string): string {
	const encoder = new TextEncoder()
	const hashBuffer = crypto.subtle.digest_sync(encoder.encode(token))
	return Buffer.from(new Uint8Array(hashBuffer)).toString('hex')
}

function getCookieName(isProduction: boolean): string {
	return isProduction ? '__Host-stocksx_session' : 'stocksx_session_dev'
}

export function getSessionCookieName(event: H3EventContext): string {
	const isProduction = process.env.NODE_ENV === 'production'
	const trustedOrigin = process.env.TRUSTED_ORIGIN || 'https://stocksx.nightdelaluna.workers.dev'
	const requestOrigin = getHeader(event, 'Origin')
	if (isProduction && requestOrigin !== trustedOrigin) {
		return ''
	}
	return getCookieName(isProduction)
}

export async function getDb(event: H3EventContext): Promise<{
	prepare: (query: string) => {
		bind: (...values: unknown[]) => {
			all: () => Promise<{ results: any[]; success: boolean; meta: any }>
			first: () => Promise<any>
			run: () => Promise<{ success: boolean; meta: any }>
		}
	}
}> {
	const { env } = event.cloudflare
	if (!env.DB) {
		throw createError({
			statusCode: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE ? 503 : 500,
			statusMessage: 'Database not configured',
			data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE }
		})
	}
	return env.DB
}

export async function checkRateLimit(
	event: H3EventContext,
	key: string,
	type: 'register' | 'login'
): Promise<boolean> {
	const { env } = event.cloudflare
	const limiter = type === 'register' ? env.REGISTER_LIMITER : env.LOGIN_LIMITER
	if (!limiter) return true

	const result = await limiter.limit({ key })
	return result.success
}

export function getClientIP(event: H3EventContext): string {
	const { env } = event.cloudflare
	const request = event.node?.req || (event as any).req
	if (request?.headers?.['cf-connecting-ip']) {
		return request.headers['cf-connecting-ip']
	}
	return '127.0.0.1'
}

import { getHeader, getCookie } from 'h3'