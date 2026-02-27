import type { Stock } from "../../app/data/stocks";
import { DUMMY_STOCKS } from "./dummy";

/**
 * Map a yahoo-finance2 quoteSummary / quote result to our Stock shape.
 * Falls back to dummy data for any missing field.
 */
export function mapYfQuote(ticker: string, q: Record<string, any>): Stock {
	const dummy = DUMMY_STOCKS[ticker];
	const price = q.regularMarketPrice ?? dummy?.price ?? 0;
	const prevClose = q.regularMarketPreviousClose ?? price;
	const change = q.regularMarketChange ?? dummy?.change ?? 0;
	const changePercent =
		q.regularMarketChangePercent ?? dummy?.changePercent ?? 0;

	return {
		ticker,
		name: q.longName ?? q.shortName ?? dummy?.name ?? ticker,
		sector: q.sector ?? dummy?.sector ?? "",
		price,
		change,
		changePercent,
		volume: q.regularMarketVolume ?? dummy?.volume ?? 0,
		frequency: Math.round((q.regularMarketVolume ?? dummy?.volume ?? 0) / 450),
		marketCap: q.marketCap ?? dummy?.marketCap ?? 0,
		pe: q.trailingPE ?? dummy?.pe ?? 0,
		pbv: q.priceToBook ?? dummy?.pbv ?? 0,
		dividendYield:
			q.trailingAnnualDividendYield != null
				? q.trailingAnnualDividendYield * 100
				: (dummy?.dividendYield ?? 0),
		high52w: q.fiftyTwoWeekHigh ?? dummy?.high52w ?? 0,
		low52w: q.fiftyTwoWeekLow ?? dummy?.low52w ?? 0,
		about: q.longBusinessSummary ?? dummy?.about ?? "",
	};
}

export function mapYfDetail(
	ticker: string,
	q: Record<string, any>,
): Stock & Record<string, any> {
	const base = mapYfQuote(ticker, q);
	const dummy = DUMMY_STOCKS[ticker];
	return {
		...base,
		employees: q.fullTimeEmployees ?? dummy?.employees ?? 0,
		website: q.website ?? dummy?.website ?? "",
		industry: q.industry ?? dummy?.industry ?? "",
		country: q.country ?? dummy?.country ?? "Indonesia",
		eps: q.trailingEps ?? dummy?.eps ?? 0,
		beta: q.beta ?? dummy?.beta ?? 1,
		avgVolume: q.averageDailyVolume3Month ?? dummy?.avgVolume ?? 0,
		openPrice: q.regularMarketOpen ?? dummy?.openPrice ?? base.price,
		prevClose: q.regularMarketPreviousClose ?? dummy?.prevClose ?? base.price,
		dayHigh: q.regularMarketDayHigh ?? dummy?.dayHigh ?? base.price,
		dayLow: q.regularMarketDayLow ?? dummy?.dayLow ?? base.price,
	};
}
