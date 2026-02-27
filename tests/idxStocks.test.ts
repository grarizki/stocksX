import { describe, expect, it } from "vitest";
import { IDX_STOCKS } from "../app/data/idxStocks";

describe("IDX_STOCKS", () => {
	it("contains at least 900 entries", () => {
		expect(IDX_STOCKS.length).toBeGreaterThanOrEqual(900);
	});

	it("every entry has a ticker ending in .JK", () => {
		const invalid = IDX_STOCKS.filter((s) => !s.ticker.endsWith(".JK"));
		expect(invalid).toHaveLength(0);
	});

	it("every entry has a non-empty name", () => {
		const empty = IDX_STOCKS.filter((s) => !s.name.trim());
		expect(empty).toHaveLength(0);
	});

	it("tickers are unique", () => {
		const tickers = IDX_STOCKS.map((s) => s.ticker);
		const unique = new Set(tickers);
		expect(unique.size).toBe(tickers.length);
	});

	it("includes major blue-chip stocks", () => {
		const tickers = new Set(IDX_STOCKS.map((s) => s.ticker));
		expect(tickers.has("BBCA.JK")).toBe(true);
		expect(tickers.has("BBRI.JK")).toBe(true);
		expect(tickers.has("BMRI.JK")).toBe(true);
		expect(tickers.has("TLKM.JK")).toBe(true);
		expect(tickers.has("BREN.JK")).toBe(true);
	});

	it("ticker symbols contain only uppercase alphanumeric characters before .JK", () => {
		const invalid = IDX_STOCKS.filter((s) => !/^[A-Z0-9]+\.JK$/.test(s.ticker));
		expect(invalid).toHaveLength(0);
	});
});
