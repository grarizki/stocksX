import { getAllStocks } from "../../utils/dummy";
import { yf } from "../../utils/yf";
import { mapYfQuote } from "../../utils/yfMapper";

type MoverType = "gainers" | "losers" | "volume" | "frequency";

const SCREENER_MAP: Record<MoverType, string> = {
	gainers: "day_gainers",
	losers: "day_losers",
	volume: "most_actives",
	frequency: "most_actives",
};

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const type = (query.type as MoverType) ?? "gainers";
	const limit = Number(query.limit ?? 5);

	try {
		const result = await yf.screener(SCREENER_MAP[type], {
			count: 50,
			region: "ID",
			lang: "id-ID",
		});

		const quotes = (result.quotes ?? [])
			.filter((q: any) => q.symbol?.endsWith(".JK"))
			.map((q: any) => mapYfQuote(q.symbol, q));

		if (quotes.length > 0) {
			if (type === "gainers") {
				return quotes
					.filter((s) => s.changePercent > 0)
					.sort((a, b) => b.changePercent - a.changePercent)
					.slice(0, limit);
			}
			if (type === "losers") {
				return quotes
					.filter((s) => s.changePercent < 0)
					.sort((a, b) => a.changePercent - b.changePercent)
					.slice(0, limit);
			}
			if (type === "frequency") {
				return quotes.sort((a, b) => b.frequency - a.frequency).slice(0, limit);
			}
			return quotes.sort((a, b) => b.volume - a.volume).slice(0, limit);
		}
	} catch {
		// screener failed or returned no IDX stocks — fall through to dummy
	}

	// Fallback
	const all = getAllStocks();
	if (type === "gainers") {
		return all
			.filter((s) => s.changePercent > 0)
			.sort((a, b) => b.changePercent - a.changePercent)
			.slice(0, limit);
	}
	if (type === "losers") {
		return all
			.filter((s) => s.changePercent < 0)
			.sort((a, b) => a.changePercent - b.changePercent)
			.slice(0, limit);
	}
	if (type === "frequency") {
		return all.sort((a, b) => b.frequency - a.frequency).slice(0, limit);
	}
	return all.sort((a, b) => b.volume - a.volume).slice(0, limit);
});
