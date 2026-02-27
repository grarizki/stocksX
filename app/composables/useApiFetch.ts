// Wrapper around useFetch that prepends app.baseURL to all API paths.
// Needed because the app is served under a sub-path (e.g. /stocksX/).
export function useApiFetch<T>(
	path: string | (() => string),
	options?: Parameters<typeof useFetch<T>>[1],
) {
	const { app } = useRuntimeConfig();
	const base = app.baseURL.replace(/\/$/, "");

	const url =
		typeof path === "function" ? () => `${base}${path()}` : `${base}${path}`;

	return useFetch<T>(url as any, options as any);
}
