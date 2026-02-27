import { TICKERS } from "../../../app/data/stocks";
import { getAllStocks, getStocksByTickers } from "../../utils/dummy";
import { yf } from "../../utils/yf";
import { mapYfQuote } from "../../utils/yfMapper";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const tickersParam = query.tickers as string | undefined;
	const tickers = tickersParam
		? tickersParam
				.split(",")
				.map((t) => t.trim().toUpperCase())
				.filter(Boolean)
				.map((t) => (t.endsWith(".JK") ? t : `${t}.JK`))
		: TICKERS;

	const results = await Promise.allSettled(
		tickers.map((ticker) =>
			yf
				.quoteSummary(ticker, {
					modules: [
						"price",
						"summaryDetail",
						"defaultKeyStatistics",
						"assetProfile",
					],
				})
				.then((data) => {
					const q = {
						...(data.price ?? {}),
						...(data.summaryDetail ?? {}),
						...(data.defaultKeyStatistics ?? {}),
						...(data.assetProfile ?? {}),
					};
					return mapYfQuote(ticker, q);
				}),
		),
	);

	const stocks = results
		.map((result, i) => {
			if (result.status === "fulfilled") return result.value;
			const dummy = getStocksByTickers([tickers[i]]);
			return dummy[0] ?? null;
		})
		.filter(Boolean);

	return stocks.length > 0 ? stocks : getAllStocks();
});
