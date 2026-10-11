export default defineNuxtRouteMiddleware(async (to) => {
	const userStore = useUserStore();
	const localePath = useLocalePath();

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

	// A service failure is retryable, not evidence that the account is absent.
	if (userStore.authError === "SERVICE_UNAVAILABLE") {
		throw createError({
			statusCode: 503,
			statusMessage: "Authentication service unavailable",
			fatal: false,
		});
	}

	if (!userStore.isLoggedIn && !isAuthPage && !isLandingPage) {
		// Re-verify the session before treating the visitor as signed out,
		// so an expired or revoked session cannot pass on stale local state.
		await userStore.restoreSession();
		if (userStore.isLoggedIn) return;
		if (userStore.authError === "SERVICE_UNAVAILABLE") {
			throw createError({
				statusCode: 503,
				statusMessage: "Authentication service unavailable",
				fatal: false,
			});
		}
		return navigateTo(localePath("/auth/login"));
	}

	if (userStore.isLoggedIn && isAuthPage) {
		return navigateTo(localePath("/home"));
	}
});
