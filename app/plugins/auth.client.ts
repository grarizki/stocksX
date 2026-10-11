import { purgeLegacyAuthState } from "~/lib/legacy-auth";

// Restores the server session before route navigation runs so the global
// middleware never reads isLoggedIn before restoreSession() resolves.
export default defineNuxtPlugin(async () => {
	purgeLegacyAuthState();
	const userStore = useUserStore();
	await userStore.restoreSession();
});
