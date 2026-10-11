// Names written by the retired Firebase backend and the demo-JWT client, kept
// verbatim so returning visitors get that stale state cleared.
export const LEGACY_COOKIE_NAMES = ["stoxlyz_token"];
const LEGACY_STORAGE_KEYS = [
	"StoxLyz-auth-token",
	"StoxLyz-user",
	"StoxLyz-auth-user",
];
const LEGACY_STORAGE_PREFIXES = ["firebase:authUser:"];
// Keys persisted under the previous brand spelling; migrated once so watchlists,
// price alerts, and preferences survive the rename.
const PREVIOUS_BRAND_STORAGE_KEYS: [previousKey: string, currentKey: string][] =
	[
		["StoxLyz-watchlist", "Stocklyz-watchlist"],
		["StoxLyz-price-alerts", "Stocklyz-price-alerts"],
		["StoxLyz-price-alert-log", "Stocklyz-price-alert-log"],
		["StoxLyz-user-prefs", "Stocklyz-user-prefs"],
	];

export function migratePreviousBrandStorageKeys(): void {
	for (const [previousKey, currentKey] of PREVIOUS_BRAND_STORAGE_KEYS) {
		const previousValue = localStorage.getItem(previousKey);
		if (previousValue === null) continue;
		if (localStorage.getItem(currentKey) === null) {
			localStorage.setItem(currentKey, previousValue);
		}
		localStorage.removeItem(previousKey);
	}
}

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
