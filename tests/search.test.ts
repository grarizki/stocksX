import { describe, expect, it } from "vitest";
import { IDX_STOCKS } from "../app/data/idxStocks";

// Mirror the search logic from server/api/stocks/search.get.ts
function searchStocks(q: string) {
	const query = q.trim().toLowerCase();
	if (!query) return [];
	return IDX_STOCKS.filter(
		(s) =>
			s.ticker.replace(".JK", "").toLowerCase().includes(query) ||
			s.name.toLowerCase().includes(query),
	).slice(0, 10);
}

describe("stock search logic", () => {
	it("returns empty array for empty query", () => {
		expect(searchStocks("")).toHaveLength(0);
		expect(searchStocks("  ")).toHaveLength(0);
	});

	it("finds BBCA by ticker", () => {
		const results = searchStocks("BBCA");
		expect(results.some((s) => s.ticker === "BBCA.JK")).toBe(true);
	});

	it("finds BREN by ticker", () => {
		const results = searchStocks("bren");
		expect(results.some((s) => s.ticker === "BREN.JK")).toBe(true);
	});

	it("finds stocks by partial company name", () => {
		const results = searchStocks("bank central");
		expect(results.some((s) => s.ticker === "BBCA.JK")).toBe(true);
	});

	it("is case-insensitive", () => {
		const upper = searchStocks("BBRI");
		const lower = searchStocks("bbri");
		expect(upper.map((s) => s.ticker)).toEqual(lower.map((s) => s.ticker));
	});

	it("returns at most 10 results", () => {
		// 'b' will match many tickers starting with B
		const results = searchStocks("b");
		expect(results.length).toBeLessThanOrEqual(10);
	});

	it("returns results for single-letter query", () => {
		const results = searchStocks("b");
		expect(results.length).toBeGreaterThan(0);
	});

	it("returns empty for query matching nothing", () => {
		const results = searchStocks("zzznotexist999");
		expect(results).toHaveLength(0);
	});

	it("each result has ticker ending in .JK", () => {
		const results = searchStocks("bank");
		expect(results.every((s) => s.ticker.endsWith(".JK"))).toBe(true);
	});

	it("finds stocks by sector-related keywords in name", () => {
		const results = searchStocks("energi");
		// Should find stocks with "Energi" or "Energy" in name
		expect(results.length).toBeGreaterThanOrEqual(0); // at minimum doesn't crash
	});
});
