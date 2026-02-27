import { describe, expect, it } from "vitest";
import { mapYfDetail, mapYfQuote } from "../server/utils/yfMapper";

describe("mapYfQuote", () => {
	it("maps full yfinance quote fields correctly", () => {
		const result = mapYfQuote("BBCA.JK", {
			regularMarketPrice: 9500,
			regularMarketChange: 150,
			regularMarketChangePercent: 1.6,
			regularMarketVolume: 30_000_000,
			marketCap: 1_200_000_000_000_000,
			trailingPE: 25,
			priceToBook: 4.5,
			trailingAnnualDividendYield: 0.012,
			fiftyTwoWeekHigh: 10_500,
			fiftyTwoWeekLow: 8_200,
			longName: "Bank Central Asia Tbk",
			sector: "Financial Services",
			longBusinessSummary: "A major Indonesian bank.",
		});

		expect(result.ticker).toBe("BBCA.JK");
		expect(result.price).toBe(9500);
		expect(result.change).toBe(150);
		expect(result.changePercent).toBe(1.6);
		expect(result.volume).toBe(30_000_000);
		expect(result.marketCap).toBe(1_200_000_000_000_000);
		expect(result.pe).toBe(25);
		expect(result.pbv).toBe(4.5);
		expect(result.dividendYield).toBeCloseTo(1.2);
		expect(result.high52w).toBe(10_500);
		expect(result.low52w).toBe(8_200);
		expect(result.name).toBe("Bank Central Asia Tbk");
		expect(result.sector).toBe("Financial Services");
		expect(result.about).toBe("A major Indonesian bank.");
	});

	it("falls back to dummy data for missing fields", () => {
		// BBCA.JK exists in DUMMY_STOCKS, so missing fields come from there
		const result = mapYfQuote("BBCA.JK", {});
		expect(result.ticker).toBe("BBCA.JK");
		expect(result.price).toBeGreaterThan(0);
		expect(result.name).toBeTruthy();
	});

	it("uses zero defaults for unknown ticker with empty quote", () => {
		const result = mapYfQuote("UNKNOWN.JK", {});
		expect(result.ticker).toBe("UNKNOWN.JK");
		expect(result.price).toBe(0);
		expect(result.change).toBe(0);
		expect(result.changePercent).toBe(0);
		expect(result.volume).toBe(0);
		expect(result.name).toBe("UNKNOWN.JK");
	});

	it("calculates frequency as volume / 450", () => {
		const result = mapYfQuote("TEST.JK", { regularMarketVolume: 45_000 });
		expect(result.frequency).toBe(100);
	});

	it("converts dividendYield from decimal to percent", () => {
		const result = mapYfQuote("TEST.JK", {
			trailingAnnualDividendYield: 0.025,
		});
		expect(result.dividendYield).toBeCloseTo(2.5);
	});

	it("uses shortName when longName is absent", () => {
		const result = mapYfQuote("TEST.JK", { shortName: "Test Corp" });
		expect(result.name).toBe("Test Corp");
	});
});

describe("mapYfDetail", () => {
	it("includes all base quote fields plus detail fields", () => {
		const result = mapYfDetail("BBRI.JK", {
			regularMarketPrice: 4200,
			fullTimeEmployees: 80_000,
			website: "https://bri.co.id",
			industry: "Banking",
			country: "Indonesia",
			trailingEps: 320,
			beta: 1.1,
			averageDailyVolume3Month: 70_000_000,
			regularMarketOpen: 4150,
			regularMarketPreviousClose: 4050,
			regularMarketDayHigh: 4250,
			regularMarketDayLow: 4100,
		});

		expect(result.price).toBe(4200);
		expect(result.employees).toBe(80_000);
		expect(result.website).toBe("https://bri.co.id");
		expect(result.industry).toBe("Banking");
		expect(result.country).toBe("Indonesia");
		expect(result.eps).toBe(320);
		expect(result.beta).toBe(1.1);
		expect(result.avgVolume).toBe(70_000_000);
		expect(result.openPrice).toBe(4150);
		expect(result.prevClose).toBe(4050);
		expect(result.dayHigh).toBe(4250);
		expect(result.dayLow).toBe(4100);
	});

	it("falls back openPrice/prevClose/dayHigh/dayLow to price when missing", () => {
		const result = mapYfDetail("UNKNOWN.JK", { regularMarketPrice: 1000 });
		expect(result.openPrice).toBe(1000);
		expect(result.prevClose).toBe(1000);
		expect(result.dayHigh).toBe(1000);
		expect(result.dayLow).toBe(1000);
	});

	it("defaults country to Indonesia for unknown ticker", () => {
		const result = mapYfDetail("UNKNOWN.JK", {});
		expect(result.country).toBe("Indonesia");
	});

	it("defaults beta to 1 for unknown ticker", () => {
		const result = mapYfDetail("UNKNOWN.JK", {});
		expect(result.beta).toBe(1);
	});
});
