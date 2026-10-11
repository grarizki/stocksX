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

	const userStore = useUserStore();
	const localePath = useLocalePath();
	const router = useRouter();

	return useFetch<T>(
		url as unknown as string,
		{
			...options,
			onResponseError: ({ response }) => {
				// A server-side session expiry must drop local state and send the
				// visitor to login, regardless of which screen issued the request.
				if (response.status === 401) {
					userStore.profile = null;
					router.push(localePath("/auth/login"));
				}
			},
		} as Parameters<typeof useFetch<T>>[1],
	);
}
