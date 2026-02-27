import { yf } from "../../utils/yf";

export default defineEventHandler(async () => {
	try {
		const result = await yf.quote("^JKSE");
		return [
			{
				ticker: "^JKSE",
				name: "IDX Composite",
				price: result.regularMarketPrice ?? 0,
				change: result.regularMarketChange ?? 0,
				changePercent: result.regularMarketChangePercent ?? 0,
			},
		];
	} catch {
		return [
			{
				ticker: "^JKSE",
				name: "IDX Composite",
				price: 7_125.48,
				change: 42.31,
				changePercent: 0.6,
			},
		];
	}
});
