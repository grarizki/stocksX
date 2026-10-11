import type { H3Event } from "h3";
import { getCookie } from "h3";
import {
	addNoStoreHeaders,
	clearSessionCookie,
	enforceTrustedOrigin,
	getD1Database,
	getSessionCookieName,
	hashSessionToken,
	revokeSession,
} from "../../utils/accounts";

export default defineEventHandler(async (event: H3Event) => {
	addNoStoreHeaders(event);
	enforceTrustedOrigin(event);

	const token = getCookie(event, getSessionCookieName(event));
	if (token) {
		try {
			const db = getD1Database(event);
			await revokeSession(db, await hashSessionToken(token));
		} catch {
			// Logout stays idempotent: an absent database or session still clears the cookie.
		}
	}
	clearSessionCookie(event);

	return { success: true };
});
