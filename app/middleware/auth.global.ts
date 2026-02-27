export default defineNuxtRouteMiddleware((to) => {
	const userStore = useUserStore();
	const localePath = useLocalePath();

	const isAuthPage = to.path.includes("/auth/");
	const isLandingPage =
		to.path === "/" ||
		to.path === "/en" ||
		to.path === "/id" ||
		to.path.endsWith("/landing");

	if (!userStore.isLoggedIn && !isAuthPage && !isLandingPage) {
		return navigateTo(localePath("/"));
	}

	// Redirect logged-in users away from auth pages to home dashboard
	if (userStore.isLoggedIn && isAuthPage) {
		return navigateTo(localePath("/home"));
	}
});
