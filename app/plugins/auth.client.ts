// Restores server session before any route navigation runs.
// This prevents the race condition where auth.global middleware reads
// isLoggedIn as false while restoreSession() is still resolving.
export default defineNuxtPlugin(async () => {
	const userStore = useUserStore();
	await userStore.restoreSession();
});
