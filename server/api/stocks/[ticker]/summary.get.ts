import { DUMMY_STOCKS } from "../../../utils/dummy";
import { yf } from "../../../utils/yf";
import { mapYfDetail } from "../../../utils/yfMapper";

export default defineEventHandler(async (event) => {
	const raw = getRouterParam(event, "ticker")!.toUpperCase();
	const ticker = raw.endsWith(".JK") ? raw : `${raw}.JK`;

	try {
		const data = await yf.quoteSummary(ticker, {
			modules: [
				"price",
				"summaryDetail",
				"defaultKeyStatistics",
				"assetProfile",
				"financialData",
			],
		});
		const q = {
			...(data.price ?? {}),
			...(data.summaryDetail ?? {}),
			...(data.defaultKeyStatistics ?? {}),
			...(data.assetProfile ?? {}),
			...(data.financialData ?? {}),
		};
		return mapYfDetail(ticker, q);
	} catch {
		const stock = DUMMY_STOCKS[ticker];
		if (!stock) {
			throw createError({
				statusCode: 404,
				statusMessage: `Stock ${ticker} not found`,
			});
		}
		return stock;
	}
});
