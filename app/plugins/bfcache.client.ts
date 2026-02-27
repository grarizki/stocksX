// Ensure app state is fresh when page is restored from bfcache
export default defineNuxtPlugin(() => {
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) {
			// Page restored from bfcache — reload to sync any stale state
			// (e.g. auth, watchlist) that may have changed in another tab
			window.location.reload();
		}
	});
});
