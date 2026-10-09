export default defineNuxtRouteMiddleware(async (to) => {
	const userStore = useUserStore();
	const localePath = useLocalePath();

	// Wait for session restoration to complete
	if (!userStore.authReady) {
		await new Promise<void>((resolve) => {
			const stop = watch(
				() => userStore.authReady,
				(ready) => {
					if (ready) {
						stop();
						resolve();
					}
				},
			);
		});
	}

	const isAuthPage = to.path.includes("/auth/");
	const isLandingPage =
		to.path === "/" ||
		to.path === "/en" ||
		to.path === "/id" ||
		to.path.endsWith("/landing");

	// If we have an auth error (expired session, unauthenticated), clear profile
	if (userStore.authError && userStore.authError !== "UNAUTHENTICATED") {
		userStore.profile = null;
		userStore.authError = null;
	}

	if (!userStore.isLoggedIn && !isAuthPage && !isLandingPage) {
		// Re-verify session before redirecting to catch expired sessions
		if (userStore.authError === "UNAUTHENTICATED" || !userStore.profile) {
			await userStore.restoreSession();
		}
		if (!userStore.isLoggedIn) {
			return navigateTo(localePath("/auth/login"));
		}
	}

	// Redirect logged-in users away from auth pages to home dashboard
	if (userStore.isLoggedIn && isAuthPage) {
		return navigateTo(localePath("/home"));
	}
});
