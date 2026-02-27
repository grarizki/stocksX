import {
	filterByRange,
	getStockHistory,
	type TimeRange,
} from "../../../../app/data/stockHistory";
import { yf } from "../../../utils/yf";

type Range = "5H" | "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" | "3Y" | "5Y";

function getPeriod(range: Range): {
	period1: Date;
	interval: "5m" | "1d" | "1wk";
	intraday: boolean;
} {
	const now = new Date();
	const p = new Date(now);

	switch (range) {
		case "5H":
			p.setHours(p.getHours() - 5);
			return { period1: p, interval: "5m", intraday: true };
		case "1D":
			p.setDate(p.getDate() - 1);
			return { period1: p, interval: "5m", intraday: true };
		case "1W":
			p.setDate(p.getDate() - 7);
			return { period1: p, interval: "1d", intraday: false };
		case "1M":
			p.setMonth(p.getMonth() - 1);
			return { period1: p, interval: "1d", intraday: false };
		case "3M":
			p.setMonth(p.getMonth() - 3);
			return { period1: p, interval: "1d", intraday: false };
		case "YTD":
			p.setMonth(0);
			p.setDate(1);
			return { period1: p, interval: "1d", intraday: false };
		case "1Y":
			p.setFullYear(p.getFullYear() - 1);
			return { period1: p, interval: "1d", intraday: false };
		case "3Y":
			p.setFullYear(p.getFullYear() - 3);
			return { period1: p, interval: "1wk", intraday: false };
		case "5Y":
			p.setFullYear(p.getFullYear() - 5);
			return { period1: p, interval: "1wk", intraday: false };
	}
}

export default defineEventHandler(async (event) => {
	const raw = getRouterParam(event, "ticker")!.toUpperCase();
	const ticker = raw.endsWith(".JK") ? raw : `${raw}.JK`;
	const query = getQuery(event);
	const range: Range = (query.range as Range) || "1M";

	try {
		const { period1, interval, intraday } = getPeriod(range);

		if (intraday) {
			const result = await yf.chart(ticker, {
				period1,
				period2: new Date(),
				interval: "5m",
			});
			const quotes = result.quotes ?? [];
			if (!quotes.length) throw new Error("empty");
			return quotes
				.filter((q) => q.open != null && q.close != null)
				.map((q) => ({
					time: Math.floor(new Date(q.date).getTime() / 1000),
					open: q.open!,
					high: q.high!,
					low: q.low!,
					close: q.close!,
					volume: q.volume ?? 0,
				}));
		}

		const result = await yf.chart(ticker, {
			period1,
			period2: new Date(),
			interval,
		});
		const quotes = result.quotes ?? [];
		if (!quotes.length) throw new Error("empty");
		return quotes
			.filter((q) => q.open != null && q.close != null)
			.map((q) => ({
				time: new Date(q.date).toISOString().slice(0, 10),
				open: q.open!,
				high: q.high!,
				low: q.low!,
				close: q.close!,
				volume: q.volume ?? 0,
			}));
	} catch {
		// Fallback to dummy data
		const history = getStockHistory(ticker);
		const filtered = filterByRange(history, range as TimeRange);
		return filtered.map((p) => ({
			time: p.date,
			open: p.open,
			high: p.high,
			low: p.low,
			close: p.close,
			volume: p.volume,
		}));
	}
});
