import type { D1Database } from "@cloudflare/workers-types";
import type { H3Event } from "h3";
import {
	createError,
	getCookie,
	getRequestHost,
	readRawBody,
	setCookie,
	setResponseHeader,
} from "h3";
import type {
	AccountListRow,
	AdminAccountsResponse,
	OwnershipRow,
	UserProfile,
} from "../../shared/types/account";
import {
	AUTH_ERROR_CODES,
	type AuthErrorCode,
} from "../../shared/types/auth.error";

// Cloudflare's runtime rejects PBKDF2 above 100,000 iterations, so the
// spec's 600,000 work factor is unreachable on Workers. The platform maximum
// is combined with a server-side pepper to recover the lost margin.
const PBKDF2_ITERATIONS = 100000;
const HASH_VERSION = 2;
const MIN_PEPPER_LENGTH = 32;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const SESSION_TOKEN_BYTES = 32;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TRUSTED_ORIGIN =
	process.env.TRUSTED_ORIGIN ?? "https://stocksx.nightdelaluna.workers.dev";

interface PasswordPart {
	version: number;
	iterations: number;
	saltHex: string;
	hashHex: string;
}

interface SessionTokenData {
	raw: string;
	hash: string;
}

function parsePasswordHash(stored: string): PasswordPart | null {
	const parts = stored.split(":");
	if (parts.length !== 4) return null;
	const version = parts[0] ?? "";
	const iterations = parts[1] ?? "";
	const saltHex = parts[2] ?? "";
	const hashHex = parts[3] ?? "";
	return {
		version: Number.parseInt(version, 10),
		iterations: Number.parseInt(iterations, 10),
		saltHex,
		hashHex,
	};
}

export function validateName(name: string): {
	valid: boolean;
	errorCode?: AuthErrorCode;
	errorMessage?: string;
} {
	const trimmed = name.trim();
	if (trimmed.length === 0) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Name is required",
		};
	}
	if (trimmed.length > 100) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Name must be at most 100 characters",
		};
	}
	return { valid: true };
}

export function validateEmail(email: string): {
	valid: boolean;
	errorCode?: AuthErrorCode;
	errorMessage?: string;
} {
	const trimmed = email.trim();
	if (trimmed.length === 0) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Email is required",
		};
	}
	if (trimmed.length > 254) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Email must be at most 254 characters",
		};
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Invalid email format",
		};
	}
	return { valid: true };
}

export function validatePassword(password: string): {
	valid: boolean;
	errorCode?: AuthErrorCode;
	errorMessage?: string;
} {
	let codePointCount = 0;
	for (const _ of password) {
		codePointCount++;
	}
	if (codePointCount < 15) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Password must be at least 15 characters",
		};
	}
	if (codePointCount > 128) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Password must be at most 128 characters",
		};
	}
	const bytes = new TextEncoder().encode(password).length;
	if (bytes > 512) {
		return {
			valid: false,
			errorCode: AUTH_ERROR_CODES.INVALID_INPUT,
			errorMessage: "Password exceeds maximum byte size",
		};
	}
	return { valid: true };
}

async function derivePepperedPassword(
	password: string,
	pepper: string,
): Promise<Uint8Array> {
	const pepperKey = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(pepper),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		pepperKey,
		new TextEncoder().encode(password),
	);
	return new Uint8Array(signature);
}

export function getPasswordPepper(event: H3Event): string {
	const pepper = readEnv(event)?.PASSWORD_PEPPER;
	if (typeof pepper !== "string" || pepper.length < MIN_PEPPER_LENGTH) {
		throw createError({
			statusCode: 503,
			data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
		});
	}
	return pepper;
}

export async function hashPasswordRaw(
	password: string,
	pepper: string,
): Promise<string> {
	const saltBuffer = new Uint8Array(SALT_BYTES);
	crypto.getRandomValues(saltBuffer);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		await derivePepperedPassword(password, pepper),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derivedKey = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: saltBuffer,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BYTES * 8,
	);
	const hashBuffer = new Uint8Array(derivedKey);
	return [
		HASH_VERSION,
		PBKDF2_ITERATIONS,
		Buffer.from(saltBuffer).toString("hex"),
		Buffer.from(hashBuffer).toString("hex"),
	].join(":");
}

export async function verifyPasswordWithHash(
	password: string,
	storedHash: string,
	pepper: string,
): Promise<boolean> {
	const parsed = parsePasswordHash(storedHash);
	if (!parsed) return false;
	if (
		parsed.version !== HASH_VERSION ||
		parsed.iterations !== PBKDF2_ITERATIONS
	)
		return false;
	const saltBuffer = Buffer.from(parsed.saltHex, "hex");
	if (saltBuffer.length !== SALT_BYTES) return false;
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		await derivePepperedPassword(password, pepper),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derivedKey = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: saltBuffer,
			iterations: parsed.iterations,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BYTES * 8,
	);
	const derivedBuffer = new Uint8Array(derivedKey);
	const storedBuffer = Buffer.from(parsed.hashHex, "hex");
	if (storedBuffer.length !== HASH_BYTES) return false;
	return crypto.subtle.timingSafeEqual(derivedBuffer, storedBuffer);
}

export const DUMMY_PASSWORD_HASH = `${HASH_VERSION}:${PBKDF2_ITERATIONS}:${"0".repeat(32)}:${"0".repeat(64)}`;

export async function generateSessionToken(): Promise<SessionTokenData> {
	const rawBytes = new Uint8Array(SESSION_TOKEN_BYTES);
	crypto.getRandomValues(rawBytes);
	const raw = Buffer.from(rawBytes).toString("hex");
	const digestBuffer = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(raw),
	);
	const hash = Buffer.from(digestBuffer).toString("hex");
	return { raw, hash };
}

export async function hashSessionToken(raw: string): Promise<string> {
	const digestBuffer = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(raw),
	);
	return Buffer.from(digestBuffer).toString("hex");
}

function getCookieName(isProduction: boolean): string {
	return isProduction ? "__Host-stocksx_session" : "stocksx_session_dev";
}

function resolveRequestIp(event: H3Event): string {
	const headers = event.node.req.headers;
	const cfIp = headers["cf-connecting-ip"];
	if (typeof cfIp === "string" && cfIp.length > 0) return cfIp;
	// Cloudflare always sends CF-Connecting-IP; the fixed fallback keeps local
	// runs deterministic and makes the limiter fail closed off-Cloudflare.
	return "127.0.0.1";
}

function resolveRequestOrigin(event: H3Event): string {
	const raw = event.node.req.headers.origin;
	if (typeof raw !== "string") return "";
	return raw.trim();
}

function isLocalRequest(event: H3Event): boolean {
	const hostname = resolveRequestHostname(event);
	return hostname === "localhost" || hostname === "127.0.0.1";
}

function resolveRequestHostname(event: H3Event): string {
	const requestUrl = event.web?.request?.url;
	if (typeof requestUrl === "string" && requestUrl.length > 0) {
		try {
			return new URL(requestUrl).hostname;
		} catch {
			// fall through to the raw host header
		}
	}
	return getRequestHost(event);
}

export function getSessionCookieName(event: H3Event): string {
	return getCookieName(!isLocalRequest(event));
}

export function enforceTrustedOrigin(event: H3Event): void {
	if (resolveRequestOrigin(event) !== TRUSTED_ORIGIN) {
		throw createError({
			statusCode: 403,
			data: { code: AUTH_ERROR_CODES.FORBIDDEN },
		});
	}
}

function readEnv(event: H3Event): CloudflareEnv | null {
	const cloudflare = event.context.cloudflare;
	if (!cloudflare || !cloudflare.env) return null;
	return cloudflare.env;
}

export function getD1Database(event: H3Event): D1Database {
	const env = readEnv(event);
	const db = env?.DB;
	if (!db || typeof db.prepare !== "function") {
		throw createError({
			statusCode: 503,
			data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
		});
	}
	return db;
}

export async function limitRegister(event: H3Event): Promise<void> {
	const limiter = readEnv(event)?.REGISTER_LIMITER;
	if (!limiter) return;
	const result = await limiter.limit({ key: `reg_${resolveRequestIp(event)}` });
	if (!result.success) {
		addRetryAfterHeader(event);
		throw createError({
			statusCode: 429,
			data: { code: AUTH_ERROR_CODES.RATE_LIMITED },
		});
	}
}

export async function limitLogin(
	event: H3Event,
	canonicalEmail: string,
): Promise<void> {
	const limiter = readEnv(event)?.LOGIN_LIMITER;
	if (!limiter) return;
	const ipResult = await limiter.limit({
		key: `login_ip_${resolveRequestIp(event)}`,
	});
	if (!ipResult.success) {
		addRetryAfterHeader(event);
		throw createError({
			statusCode: 429,
			data: { code: AUTH_ERROR_CODES.RATE_LIMITED },
		});
	}
	const emailResult = await limiter.limit({
		key: `login_email_${canonicalEmail}`,
	});
	if (!emailResult.success) {
		addRetryAfterHeader(event);
		throw createError({
			statusCode: 429,
			data: { code: AUTH_ERROR_CODES.RATE_LIMITED },
		});
	}
}

export function projectUserProfile(row: {
	id: string;
	name: string;
	email: string;
	role: string;
}): UserProfile {
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		role: row.role as UserProfile["role"],
	};
}

export function setSessionCookie(event: H3Event, token: string): void {
	const cookieName = getSessionCookieName(event);
	setCookie(event, cookieName, token, {
		httpOnly: true,
		secure: !isLocalRequest(event),
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_TTL_MS / 1000,
	});
}

export function clearSessionCookie(event: H3Event): void {
	setCookie(event, getSessionCookieName(event), "", {
		httpOnly: true,
		secure: !isLocalRequest(event),
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
}

export async function insertAccount(
	db: D1Database,
	name: string,
	canonicalEmail: string,
	passwordHash: string,
): Promise<{ id: string; created_at: number }> {
	const id = crypto.randomUUID();
	const created_at = Date.now();
	const stmt = db.prepare(
		`INSERT INTO accounts (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)`,
	);
	try {
		await stmt.bind(id, name, canonicalEmail, passwordHash, created_at).run();
		return { id, created_at };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (
			message.includes("UNIQUE") ||
			message.includes("unique") ||
			message.includes("SQLITE_CONSTRAINT") ||
			message.includes("constraint")
		) {
			throw createError({
				statusCode: 409,
				data: { code: AUTH_ERROR_CODES.EMAIL_EXISTS },
			});
		}
		throw createError({
			statusCode: 503,
			data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
		});
	}
}

export async function getAccountByEmail(
	db: D1Database,
	canonicalEmail: string,
): Promise<{
	id: string;
	name: string;
	email: string;
	role: string;
	password_hash: string;
	created_at: number;
} | null> {
	const stmt = db.prepare(
		`SELECT id, name, email, role, password_hash, created_at FROM accounts WHERE email = ? LIMIT 1`,
	);
	return runDbQuery(() => stmt.bind(canonicalEmail).first());
}

export async function insertSession(
	db: D1Database,
	accountId: string,
	tokenHash: string,
): Promise<number> {
	const now = Date.now();
	const expiresAt = now + SESSION_TTL_MS;
	const stmt = db.prepare(
		`INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
	);
	await runDbQuery(() => stmt.bind(tokenHash, accountId, now, expiresAt).run());
	return expiresAt;
}

async function resolveSessionByTokenHash(
	db: D1Database,
	tokenHash: string,
): Promise<{ user: UserProfile; expires_at: number } | null> {
	const stmt = db.prepare(
		`SELECT a.id, a.name, a.email, a.role, s.expires_at FROM sessions s JOIN accounts a ON s.account_id = a.id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
	);
	const row = await runDbQuery(() => stmt.bind(tokenHash, Date.now()).first());
	if (!row) return null;
	return {
		user: projectUserProfile(
			row as { id: string; name: string; email: string; role: string },
		),
		expires_at: Number(row.expires_at),
	};
}

export async function revokeSession(
	db: D1Database,
	tokenHash: string,
): Promise<void> {
	const stmt = db.prepare(`DELETE FROM sessions WHERE token_hash = ?`);
	await runDbQuery(() => stmt.bind(tokenHash).run());
}

export async function queryAdminAccounts(
	db: D1Database,
	page: number,
	pageSize: number,
): Promise<AdminAccountsResponse> {
	const safePage = Math.max(1, page);
	const safePageSize = Math.min(100, Math.max(1, pageSize));
	const offset = (safePage - 1) * safePageSize;

	const totalStmt = db.prepare(`SELECT COUNT(*) AS count FROM accounts`);
	const totalRow = await totalStmt.first<{ count: number }>();
	const totalAccounts = Number(totalRow?.count ?? 0);

	const adminCountStmt = db.prepare(
		`SELECT COUNT(*) AS count FROM accounts WHERE role IN ('admin', 'superadmin')`,
	);
	const adminRow = await adminCountStmt.first<{ count: number }>();
	const adminAccounts = Number(adminRow?.count ?? 0);

	const sessionCountStmt = db.prepare(
		`SELECT COUNT(*) AS count FROM sessions WHERE expires_at > ?`,
	);
	const sessionRow = await sessionCountStmt
		.bind(Date.now())
		.first<{ count: number }>();
	const activeSessions = Number(sessionRow?.count ?? 0);

	const rowsStmt = db.prepare(
		`SELECT id, name, email, role, created_at FROM accounts ORDER BY created_at ASC LIMIT ? OFFSET ?`,
	);
	const rows = await rowsStmt.bind(safePageSize, offset).all<{
		id: string;
		name: string;
		email: string;
		role: string;
		created_at: number;
	}>();

	const accounts: AccountListRow[] = rows.results.map((r) => ({
		id: r.id,
		name: r.name,
		email: r.email,
		role: r.role as AccountListRow["role"],
		createdAt: Number(r.created_at),
	}));

	return {
		accounts,
		page: safePage,
		pageSize: safePageSize,
		totalAccounts,
		adminAccounts,
		activeSessions,
	};
}

export async function queryOwnershipByStockCode(
	db: D1Database,
	stockCode: string,
): Promise<OwnershipRow[]> {
	const stmt = db.prepare(
		`SELECT share_code, investor_code, percentage, confidence, notes FROM ownership_records WHERE share_code = ?`,
	);
	const rows = await runDbQuery(() => stmt.bind(stockCode).all<OwnershipRow>());
	return rows.results;
}

export function normalizeOwnershipTicker(ticker: string): string {
	const upper = ticker.toUpperCase().trim();
	return upper.endsWith(".JK") ? upper.slice(0, -3) : upper;
}

export async function requireAccount(
	event: H3Event,
): Promise<{ db: D1Database; user: UserProfile }> {
	const token = getCookie(event, getSessionCookieName(event));
	if (!token) {
		throw createError({
			statusCode: 401,
			data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED },
		});
	}

	const db = getD1Database(event);
	const session = await resolveSessionByTokenHash(
		db,
		await hashSessionToken(token),
	);
	if (!session) {
		throw createError({
			statusCode: 401,
			data: { code: AUTH_ERROR_CODES.UNAUTHENTICATED },
		});
	}

	return { db, user: session.user };
}

export async function requireAdmin(
	event: H3Event,
): Promise<{ db: D1Database; user: UserProfile }> {
	const account = await requireAccount(event);
	if (account.user.role !== "admin" && account.user.role !== "superadmin") {
		throw createError({
			statusCode: 403,
			data: { code: AUTH_ERROR_CODES.FORBIDDEN },
		});
	}
	return account;
}

async function runDbQuery<T>(operation: () => Promise<T>): Promise<T> {
	try {
		return await operation();
	} catch {
		throw createError({
			statusCode: 503,
			data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
		});
	}
}

const MAX_JSON_BODY_BYTES = 8192;

export function enforceJsonBodyLimit(event: H3Event): void {
	const contentLength = event.node.req.headers["content-length"];
	if (typeof contentLength !== "string") return;
	const byteLength = Number.parseInt(contentLength, 10);
	if (Number.isFinite(byteLength) && byteLength > MAX_JSON_BODY_BYTES) {
		throw createError({
			statusCode: 413,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}
}

export async function readJsonBodyLimited(
	event: H3Event,
): Promise<Record<string, unknown>> {
	const rawBody = await readRawBody(event);
	if (typeof rawBody !== "string") {
		throw createError({
			statusCode: 400,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}
	if (new TextEncoder().encode(rawBody).length > MAX_JSON_BODY_BYTES) {
		throw createError({
			statusCode: 413,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}
	let parsedBody: unknown;
	try {
		parsedBody = JSON.parse(rawBody);
	} catch {
		throw createError({
			statusCode: 400,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}
	if (
		parsedBody === null ||
		typeof parsedBody !== "object" ||
		Array.isArray(parsedBody)
	) {
		throw createError({
			statusCode: 400,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}
	return parsedBody as Record<string, unknown>;
}

export async function hasActiveSession(event: H3Event): Promise<boolean> {
	const token = getCookie(event, getSessionCookieName(event));
	if (!token) return false;
	try {
		const db = getD1Database(event);
		return (
			(await resolveSessionByTokenHash(db, await hashSessionToken(token))) !==
			null
		);
	} catch {
		return false;
	}
}

export function addNoStoreHeaders(event: H3Event): void {
	setResponseHeader(event, "Cache-Control", "no-store");
	setResponseHeader(event, "Vary", "Origin");
}

function addRetryAfterHeader(event: H3Event): void {
	setResponseHeader(event, "Retry-After", "60");
}

export function ensureJsonContentType(event: H3Event): void {
	setResponseHeader(event, "Content-Type", "application/json; charset=utf-8");
}
