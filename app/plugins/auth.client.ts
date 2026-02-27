// Awaits JWT verification before any route navigation runs.
// This prevents the race condition where auth.global middleware reads
// isLoggedIn as false while loadToken() is still resolving.
export default defineNuxtPlugin(async () => {
	const userStore = useUserStore();
	await userStore.loadToken();
});
