import type { H3Event } from "h3";
import { createError, getCookie } from "h3";
import { AUTH_ERROR_CODES } from "../../../shared/types/auth.error";
import {
	addNoStoreHeaders,
	DUMMY_PASSWORD_HASH,
	enforceJsonBodyLimit,
	enforceTrustedOrigin,
	generateSessionToken,
	getAccountByEmail,
	getD1Database,
	getSessionCookieName,
	hashSessionToken,
	insertSession,
	limitLogin,
	projectUserProfile,
	readJsonBodyLimited,
	revokeSession,
	setSessionCookie,
	verifyPasswordWithHash,
} from "../../utils/accounts";

export default defineEventHandler(async (event: H3Event) => {
	addNoStoreHeaders(event);
	enforceJsonBodyLimit(event);
	enforceTrustedOrigin(event);

	const body = await readJsonBodyLimited(event);
	if (typeof body.email !== "string" || typeof body.password !== "string") {
		throw createError({
			statusCode: 400,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}

	const canonicalEmail = body.email.trim().toLowerCase();
	const password = body.password;

	await limitLogin(event, canonicalEmail);

	const db = getD1Database(event);

	const account = await getAccountByEmail(db, canonicalEmail);
	const passwordValid = await verifyPasswordWithHash(
		password,
		account?.password_hash ?? DUMMY_PASSWORD_HASH,
	);
	if (!account || !passwordValid) {
		throw createError({
			statusCode: 401,
			data: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS },
		});
	}

	const priorToken = getCookie(event, getSessionCookieName(event));
	if (priorToken) {
		await revokeSession(db, await hashSessionToken(priorToken));
	}

	const sessionToken = await generateSessionToken();
	await insertSession(db, account.id, sessionToken.hash);
	setSessionCookie(event, sessionToken.raw);

	return { user: projectUserProfile(account) };
});
