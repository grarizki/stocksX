export default defineNuxtPlugin(() => {
	// Provides a consistent initial width for SSR to prevent hydration mismatch
	const isMobile = ref(false);

	if (import.meta.client) {
		const update = () => {
			isMobile.value = window.innerWidth < 1024;
		};
		update();
		window.addEventListener("resize", update, { passive: true });
	}

	return {
		provide: {
			isMobile,
		},
	};
});
