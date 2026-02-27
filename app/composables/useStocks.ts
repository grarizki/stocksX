import type { Stock } from "~/data/stocks";

export const useStocks = () => {
	const getStocks = () => useApiFetch<Stock[]>("/api/stocks/quotes");

	const getStock = (ticker: string) =>
		useApiFetch<Stock & Record<string, unknown>>(
			`/api/stocks/${ticker}/summary`,
		);

	const getTopGainers = (limit: number = 5) =>
		useApiFetch<Stock[]>("/api/stocks/movers", {
			query: { type: "gainers", limit },
		});

	const getTopLosers = (limit: number = 5) =>
		useApiFetch<Stock[]>("/api/stocks/movers", {
			query: { type: "losers", limit },
		});

	const getMostActive = (limit: number = 5) =>
		useApiFetch<Stock[]>("/api/stocks/movers", {
			query: { type: "volume", limit },
		});

	const getTrendingStocks = (limit: number = 8) =>
		useApiFetch<Stock[]>("/api/stocks/movers", {
			query: { type: "volume", limit },
		});

	return {
		getStocks,
		getStock,
		getTopGainers,
		getTopLosers,
		getMostActive,
		getTrendingStocks,
	};
};
