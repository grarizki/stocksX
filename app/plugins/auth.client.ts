import {
	LEGACY_COOKIE_NAMES,
	migratePreviousBrandStorageKeys,
	purgeLegacyAuthStorage,
} from "~/lib/legacy-auth";

// Restores the server session before route navigation runs so the global
// middleware never reads isLoggedIn before restoreSession() resolves.
export default defineNuxtPlugin(async () => {
	for (const legacyCookieName of LEGACY_COOKIE_NAMES) {
		useCookie(legacyCookieName, { path: "/" }).value = null;
	}
	migratePreviousBrandStorageKeys();
	purgeLegacyAuthStorage();
	const userStore = useUserStore();
	await userStore.restoreSession();
});
