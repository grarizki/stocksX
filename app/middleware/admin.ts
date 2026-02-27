export default defineNuxtRouteMiddleware(() => {
	const userStore = useUserStore();

	if (!userStore.isAdmin) {
		throw createError({ statusCode: 403, statusMessage: "Forbidden" });
	}
});
