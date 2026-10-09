import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export type UserRole = "superadmin" | "admin" | "user";

export interface UserProfile {
	name: string;
	email: string;
	role: UserRole;
	avatarUrl?: string;
}

interface AuthResponse {
	user: {
		name: string;
		email: string;
		role: UserRole;
		avatarUrl?: string;
	};
}

const TOKEN_KEY = "StoxLyz-auth-token";
const PREFS_KEY = "StoxLyz-user-prefs";

const VALID_THEMES = ["dark", "light", "system"] as const;
const VALID_LANGUAGES = ["id", "en"] as const;

export const useUserStore = defineStore("user", () => {
	const theme = ref<"dark" | "light" | "system">("system");
	const language = ref<"id" | "en">("id");
	const notifications = ref<boolean>(true);
	const profile = ref<UserProfile | null>(null);
	const authReady = ref(false);

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
			const prefs = JSON.parse(stored);
			theme.value = VALID_THEMES.includes(prefs.theme) ? prefs.theme : "system";
			language.value = VALID_LANGUAGES.includes(prefs.language)
				? prefs.language
				: "id";
			notifications.value =
				typeof prefs.notifications === "boolean" ? prefs.notifications : true;
		} catch (err) {
			console.warn(
				"[user store] Failed to parse preferences from storage:",
				err,
			);
		}
	};

	// Restore server session if cookie is present
	const restoreSession = async () => {
		if (!import.meta.client) return;
		try {
			const session = await $fetch<{
				authenticated: boolean;
				user: UserProfile | null;
			}>("/api/auth/session").catch(() => null);
			if (session?.authenticated && session.user) {
				profile.value = session.user;
			}
		} finally {
			authReady.value = true;
		}
	};

	loadPrefs();

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

	const logout = async () => {
		if (import.meta.client) {
			localStorage.removeItem(TOKEN_KEY);
			await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
		}
		profile.value = null;
	};

	const setFirebaseUser = (user: {
		uid: string;
		email: string;
		displayName: string;
		photoURL?: string;
		role: UserRole;
	}) => {
		profile.value = {
			name: user.displayName || user.email.split("@")[0] || "User",
			email: user.email,
			role: user.role,
			avatarUrl: user.photoURL,
		};
	};

	const clearFirebaseUser = () => {
		profile.value = null;
	};

	const loginWithFirebase = async (email: string, password: string) => {
		if (!import.meta.client)
			return { success: false, error: "Server-side operation not allowed" };

		try {
			const nuxtApp = useNuxtApp();

			if (!nuxtApp.$firebaseAuth) {
				console.error(
					"[Firebase] Firebase not initialized - check your .env configuration",
				);
				return {
					success: false,
					error:
						"Firebase not initialized. Please check your configuration in .env file.",
				};
			}

			const { signInWithEmailAndPassword } = await import("firebase/auth");

			console.log("[Login] Attempting Firebase login for:", email);
			const result = await signInWithEmailAndPassword(
				nuxtApp.$firebaseAuth,
				email,
				password,
			);
			console.log("[Login] Firebase login successful, UID:", result.user.uid);
			
			const idToken = await result.user.getIdToken();
			console.log("[Login] Got Firebase ID token (length:", idToken.length, ")");

			const sessionResponse = await $fetch<{
				success: boolean;
				user: UserProfile | null;
			}>("/api/auth/firebase-session", {
				method: "POST",
				body: { idToken },
			}).catch(() => null);

			if (sessionResponse?.success && sessionResponse.user) {
				setProfile(sessionResponse.user);
			} else {
				setProfile({
					name: result.user.displayName || email.split("@")[0] || "User",
					email,
					role: "user",
				});
			}

			return { success: true };
		} catch (err: any) {
			console.error("[user store] Firebase login failed:", err);
			console.error("[user store] Error details:", {
				message: err.message,
				status: err.status,
				statusCode: err.statusCode,
				data: err.data,
				cause: err.cause,
			});
			return {
				success: false,
				error: err.message || "Login failed",
			};
		}
	};

	const registerWithFirebase = async (
		email: string,
		password: string,
		displayName: string,
	) => {
		if (!import.meta.client)
			return { success: false, error: "Server-side operation not allowed" };

		try {
			const nuxtApp = useNuxtApp();

			if (!nuxtApp.$firebaseAuth) {
				console.error(
					"[Firebase] Firebase not initialized - check your .env configuration",
				);
				return {
					success: false,
					error:
						"Firebase not initialized. Please check your configuration in .env file.",
				};
			}

			const { createUserWithEmailAndPassword, updateProfile } = await import(
				"firebase/auth"
			);

			const result = await createUserWithEmailAndPassword(
				nuxtApp.$firebaseAuth,
				email,
				password,
			);
			await updateProfile(result.user, { displayName });
			const idToken = await result.user.getIdToken();

			const sessionResponse = await $fetch<{
				success: boolean;
				user: UserProfile | null;
			}>("/api/auth/firebase-session", {
				method: "POST",
				body: { idToken },
			}).catch(() => null);

			if (sessionResponse?.success && sessionResponse.user) {
				setProfile(sessionResponse.user);
			} else {
				setProfile({
					name: displayName || email.split("@")[0] || "User",
					email,
					role: "user",
				});
			}

			return { success: true };
		} catch (err: any) {
			console.error("[user store] Firebase registration failed:", err);
			return {
				success: false,
				error: err.message || "Registration failed",
			};
		}
	};

	const loginWithGoogle = async () => {
		if (!import.meta.client)
			return { success: false, error: "Server-side operation not allowed" };

		try {
			const nuxtApp = useNuxtApp();

			if (!nuxtApp.$firebaseAuth) {
				console.error(
					"[Firebase] Firebase not initialized - check your .env configuration",
				);
				return {
					success: false,
					error:
						"Firebase not initialized. Please check your configuration in .env file.",
				};
			}

			const { signInWithPopup, GoogleAuthProvider } = await import(
				"firebase/auth"
			);

			const provider = new GoogleAuthProvider();
			provider.setCustomParameters({ prompt: "select_account" });

			const result = await signInWithPopup(nuxtApp.$firebaseAuth, provider);
			const idToken = await result.user.getIdToken();

			const sessionResponse = await $fetch<{
				success: boolean;
				user: UserProfile | null;
			}>("/api/auth/firebase-session", {
				method: "POST",
				body: { idToken },
			}).catch(() => null);

			if (sessionResponse?.success && sessionResponse.user) {
				setProfile(sessionResponse.user);
			} else {
				setProfile({
					name: result.user.displayName || result.user.email?.split("@")[0] || "User",
					email: result.user.email || "",
					role: "user",
					avatarUrl: result.user.photoURL || undefined,
				});
			}

			return { success: true };
		} catch (err: any) {
			console.error("[user store] Google login failed:", err);
			return {
				success: false,
				error: err.message || "Google login failed",
			};
		}
	};

	const logoutWithFirebase = async () => {
		if (!import.meta.client) return;

		try {
			const nuxtApp = useNuxtApp();
			if (nuxtApp.$firebaseAuth) {
				const { signOut } = await import("firebase/auth");
				await signOut(nuxtApp.$firebaseAuth);
			}
		} catch (err) {
			console.error("[user store] Firebase logout failed:", err);
		}

		logout();
	};

	return {
		theme,
		language,
		notifications,
		profile,
		authReady,
		isLoggedIn,
		isSuperAdmin,
		isAdmin,
		initials,
		restoreSession,
		setTheme,
		setLanguage,
		toggleNotifications,
		setProfile,
		logout,
		loginWithFirebase,
		registerWithFirebase,
		loginWithGoogle,
		logoutWithFirebase,
		setFirebaseUser,
		clearFirebaseUser,
	};
});
