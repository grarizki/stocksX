import { LEGACY_COOKIE_NAMES, purgeLegacyAuthStorage } from "~/lib/legacy-auth";

// Restores the server session before route navigation runs so the global
// middleware never reads isLoggedIn before restoreSession() resolves.
export default defineNuxtPlugin(async () => {
	for (const legacyCookieName of LEGACY_COOKIE_NAMES) {
		useCookie(legacyCookieName, { path: "/" }).value = null;
	}
	purgeLegacyAuthStorage();
	const userStore = useUserStore();
	await userStore.restoreSession();
});
