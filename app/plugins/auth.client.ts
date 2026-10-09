import { AUTH_ERROR_CODES } from "shared/types/auth.error";

export type AuthCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: "user" | "admin" | "superadmin";
}

export interface AuthResult {
	success: boolean;
	code?: AuthCode;
}

export interface LoginResult extends AuthResult {
	user: AuthUser | null;
}

/** Reads the auth error code from an h3 createError response. */
const readAuthCode = (err: unknown): AuthCode => {
	if (typeof err !== "object" || err === null) return AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
	const data = (err as { data: unknown }).data;
	if (typeof data !== "object" || data === null || !("data" in data)) return AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
	const nested = (data as { data: { code?: string } }).data;
	if (
		nested &&
		typeof nested === "object" &&
		"code" in nested &&
		typeof nested.code === "string" &&
		Object.values(AUTH_ERROR_CODES).includes(nested.code)
	) {
		return nested.code as AuthCode;
	}
	return AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
};

export default defineNuxtPlugin(async () => {
	const userStore = useUserStore();

	/**
	 * POST /api/auth/register — creates a D1 account.
	 * Returns { success: true } on 200; extracts server error codes on failure.
	 */
	const register = async (input: { name: string; email: string; password: string }): Promise<AuthResult> => {
		try {
			await $fetch("/api/auth/register", { method: "POST", body: input });
			return { success: true };
		} catch (err) {
			return { success: false, code: readAuthCode(err) };
		}
	};

	/**
	 * POST /api/auth/login — verifies D1 credentials, sets session cookie.
	 * Returns { success: true, user } on 200; extracts server error codes on failure.
	 */
	const login = async (input: { email: string; password: string }): Promise<LoginResult> => {
		try {
			const result = await $fetch<{ user?: unknown }>(
				"/api/auth/login",
				{ method: "POST", body: input },
			);
			if (
				result &&
				typeof result === "object" &&
				"user" in result &&
				result.user !== null &&
				typeof result.user === "object"
			) {
				const rawUser = result.user as Record<string, unknown>;
				if (
					typeof rawUser.id === "string" &&
					typeof rawUser.name === "string" &&
					typeof rawUser.email === "string"
				) {
					const role = rawUser.role;
					const user: AuthUser = {
						id: rawUser.id,
						name: rawUser.name,
						email: rawUser.email,
						role: role === "admin" || role === "superadmin" ? role : "user",
					};
					return { success: true, user };
				}
			}
			return { success: true, user: null };
		} catch (err) {
			return { success: false, code: readAuthCode(err), user: null };
		}
	};

	/**
	 * GET /api/auth/session — restores the server session from the httpOnly cookie.
	 * Delegates to the store, which owns the `authReady` flag and `profile` state.
	 */
	const restoreSession = async (): Promise<void> => {
		await userStore.restoreSession();
	};

	/**
	 * POST /api/auth/logout — clears the server session cookie.
	 * Always clears the local profile, even if the HTTP call fails.
	 */
	const logout = async (): Promise<void> => {
		try {
			await $fetch("/api/auth/logout", { method: "POST" });
		} catch {
			// Session cookie may already be gone; clearing local state is enough.
		} finally {
			userStore.profile = null;
		}
	};

	// Restore the session before any route navigation runs. This prevents the
	// race where auth.global middleware reads isLoggedIn while restoreSession()
	// is still resolving.
	await userStore.restoreSession();

	return {
		provide: {
			/** HTTP auth API — same-origin calls to /api/auth/* endpoints. */
			auth: { register, login, restoreSession, logout },
			/** Reactive user store — same instance as useUserStore(). */
			userStore,
		},
	};
});