import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { UserProfile, AccountRoleValues } from "../../shared/types/account";
import { AUTH_ERROR_CODES } from "../../shared/types/auth.error";

export type UserRole = AccountRoleValues[keyof AccountRoleValues];

interface AuthResponse {
	success: boolean;
	code?: string;
}

interface SessionPayload {
	authenticated: boolean;
	user: UserProfile | null;
}

interface LoginPayload {
	success?: boolean;
	response?: boolean;
	user: UserProfile | null;
}

interface RegisterPayload {
	success: boolean;
	account?: { id: string };
}

const PREFS_KEY = "StoxLyz-user-prefs";

const VALID_THEMES = ["dark", "light", "system"] as const;
const VALID_LANGUAGES = ["id", "en"] as const;

const extractErrorCode = (err: unknown): string | null => {
	if (
		err &&
		typeof err === "object" &&
		"data" in err &&
		err.data !== null &&
		typeof err.data === "object" &&
		"code" in err.data
	) {
		const code = err.data.code;
		if (typeof code === "string") return code;
	}
	return null;
};

export const useUserStore = defineStore("user", () => {
	const theme = ref<"dark" | "light" | "system">("system");
	const language = ref<"id" | "en">("id");
	const notifications = ref<boolean>(true);
	const profile = ref<UserProfile | null>(null);
	const authReady = ref(false);
	const authError = ref<string | null>(null);

	const isLoggedIn = computed(() => profile.value !== null);
	const isSuperAdmin = computed(() => profile.value?.role === "superadmin");
	const isAdmin = computed(
		() => isSuperAdmin.value || profile.value?.role === "admin",
	);

	const initials = computed(() => {
		return (profile.value?.name ?? "")
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();
	});

	// Load preferences (theme, language, notifications) from localStorage
	const loadPrefs = () => {
		if (!import.meta.client) return;
		const stored = localStorage.getItem(PREFS_KEY);
		if (!stored) return;
		try {
			const parsed = JSON.parse(stored);
			theme.value = VALID_THEMES.includes(parsed.theme)
				? (parsed.theme as "dark" | "light" | "system")
				: "system";
			language.value = VALID_LANGUAGES.includes(parsed.language)
				? (parsed.language as "id" | "en")
				: "id";
			notifications.value =
				typeof parsed.notifications === "boolean"
					? parsed.notifications
					: true;
		} catch (err) {
			console.warn(
				"[user store] Failed to parse preferences from storage:",
				err,
			);
		}
	};

	// Persist preferences whenever they change
	const persistPrefs = () => {
		if (!import.meta.client) return;
		localStorage.setItem(
			PREFS_KEY,
			JSON.stringify({
				theme: theme.value,
				language: language.value,
				notifications: notifications.value,
			}),
		);
	};

	if (import.meta.client) {
		watch([theme, language, notifications], persistPrefs, { deep: true });
	}

	// Restore server session if cookie is present
	const restoreSession = async () => {
		if (!import.meta.client) return;
		authError.value = null;
		try {
			const session = await $fetch<SessionPayload>("/api/auth/session").catch(
				() => null,
			);
			if (session?.authenticated && session.user) {
				profile.value = session.user;
				authError.value = null;
			} else {
				profile.value = null;
				authError.value = AUTH_ERROR_CODES.UNAUTHENTICATED;
			}
		} catch (err) {
			console.error("[user store] Session restore failed:", err);
			profile.value = null;
			authError.value =
				extractErrorCode(err) ?? AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
		} finally {
			authReady.value = true;
		}
	};

	loadPrefs();

	// Authentication methods - server-backed
	const login = async (
		email: string,
		password: string,
	): Promise<AuthResponse> => {
		if (!import.meta.client) {
			return { success: false, code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE };
		}
		authError.value = null;
		try {
			const result = await $fetch<LoginPayload>("/api/auth/login", {
				method: "POST",
				body: { email, password },
			});

			const ok = result.success === true || result.response === true;
			if (ok && result.user) {
				profile.value = result.user;
				authError.value = null;
				return { success: true };
			}
			profile.value = null;
			authError.value = AUTH_ERROR_CODES.INVALID_CREDENTIALS;
			return { success: false, code: AUTH_ERROR_CODES.INVALID_CREDENTIALS };
		} catch (err) {
			console.error("[user store] Login failed:", err);
			profile.value = null;
			const code = extractErrorCode(err) ?? AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
			authError.value = code;
			return { success: false, code };
		}
	};

	const register = async (
		name: string,
		email: string,
		password: string,
	): Promise<AuthResponse> => {
		if (!import.meta.client) {
			return { success: false, code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE };
		}
		authError.value = null;
		try {
			const result = await $fetch<RegisterPayload>("/api/auth/register", {
				method: "POST",
				body: { name, email, password },
			});

			if (result.success) {
				authError.value = null;
				return { success: true };
			}
			const code = AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
			authError.value = code;
			return { success: false, code };
		} catch (err) {
			console.error("[user store] Registration failed:", err);
			const code = extractErrorCode(err) ?? AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
			authError.value = code;
			return { success: false, code };
		}
	};

	const logout = async () => {
		if (import.meta.client) {
			await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
		}
		profile.value = null;
		authError.value = null;
	};

	const setTheme = (value: "dark" | "light" | "system") => {
		theme.value = value;
	};

	const setLanguage = (value: "id" | "en") => {
		language.value = value;
	};

	const toggleNotifications = () => {
		notifications.value = !notifications.value;
	};

	const setProfile = (value: UserProfile) => {
		profile.value = value;
	};

	return {
		theme,
		language,
		notifications,
		profile,
		authReady,
		authError,
		isLoggedIn,
		isSuperAdmin,
		isAdmin,
		initials,
		restoreSession,
		setTheme,
		setLanguage,
		toggleNotifications,
		setProfile,
		login,
		register,
		logout,
	};
});
