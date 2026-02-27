import { SECTOR_ETFS } from "../../../app/data/sectors";
import { yf } from "../../utils/yf";

const FALLBACK: Record<
	string,
	{ change: number; price: number; marketCap: number }
> = {
	"IDXENERGY.JK": {
		change: 2.78,
		price: 1_842,
		marketCap: 258_000_000_000_000,
	},
	"IDXBASIC.JK": {
		change: -1.37,
		price: 1_205,
		marketCap: 140_000_000_000_000,
	},
	"IDXINDUST.JK": { change: 1.36, price: 985, marketCap: 210_000_000_000_000 },
	"IDXNONCYC.JK": { change: 0.74, price: 755, marketCap: 450_000_000_000_000 },
	"IDXCYCLIC.JK": { change: -0.83, price: 620, marketCap: 130_000_000_000_000 },
	"IDXHEALTH.JK": {
		change: -0.64,
		price: 1_380,
		marketCap: 110_000_000_000_000,
	},
	"IDXFINANCE.JK": {
		change: 0.81,
		price: 1_650,
		marketCap: 1_580_000_000_000_000,
	},
	"IDXPROPERT.JK": { change: 1.89, price: 410, marketCap: 95_000_000_000_000 },
	"IDXTECHNO.JK": {
		change: -4.61,
		price: 3_210,
		marketCap: 85_000_000_000_000,
	},
	"IDXINFRA.JK": { change: 1.1, price: 890, marketCap: 320_000_000_000_000 },
	"IDXTRANS.JK": { change: 0.55, price: 560, marketCap: 78_000_000_000_000 },
};

export default defineEventHandler(async () => {
	const results = await Promise.allSettled(
		SECTOR_ETFS.map((sector) =>
			yf.quote(sector.etfTicker).then((q) => ({
				id: sector.id,
				name: sector.name,
				etfTicker: sector.etfTicker,
				change: q.regularMarketChangePercent ?? 0,
				price: q.regularMarketPrice ?? 0,
				marketCap: q.marketCap ?? 0,
			})),
		),
	);

	return results.map((result, i) => {
		const sector = SECTOR_ETFS[i];
		if (result.status === "fulfilled") return result.value;
		const fb = FALLBACK[sector.etfTicker] ?? {
			change: 0,
			price: 0,
			marketCap: 0,
		};
		return {
			id: sector.id,
			name: sector.name,
			etfTicker: sector.etfTicker,
			change: fb.change,
			price: fb.price,
			marketCap: fb.marketCap,
		};
	});
});
