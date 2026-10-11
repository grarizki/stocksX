// Names written by the retired Firebase backend and the demo-JWT client, kept
// verbatim so returning visitors get that stale state cleared.
export const LEGACY_COOKIE_NAMES = ["stoxlyz_token"];
const LEGACY_STORAGE_KEYS = [
	"StoxLyz-auth-token",
	"StoxLyz-user",
	"StoxLyz-auth-user",
];
const LEGACY_STORAGE_PREFIXES = ["firebase:authUser:"];

export function purgeLegacyAuthStorage(): void {
	const keysToRemove: string[] = [];
	for (let index = 0; index < localStorage.length; index++) {
		const key = localStorage.key(index);
		if (!key) continue;
		const isLegacyKey =
			LEGACY_STORAGE_KEYS.includes(key) ||
			LEGACY_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
		if (isLegacyKey) keysToRemove.push(key);
	}

	for (const key of keysToRemove) {
		localStorage.removeItem(key);
	}
}
