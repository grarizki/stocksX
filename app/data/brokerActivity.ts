// Deterministic seeded PRNG (same seed → same data)
function seededRand(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) & 0xffffffff;
		return (s >>> 0) / 0xffffffff;
	};
}

function tickerSeed(ticker: string): number {
	return ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31;
}

// IDX broker codes (top active brokers)
const BROKER_CODES = [
	"YP",
	"OD",
	"ZP",
	"RX",
	"AK",
	"CC",
	"BK",
	"YU",
	"DR",
	"GR",
	"CS",
	"DB",
	"MK",
	"DH",
	"LG",
	"KK",
	"EP",
	"FS",
	"ML",
	"AI",
];

export const BROKER_NAMES: Record<string, string> = {
	YP: "Indo Premier Sekuritas",
	OD: "Mirae Asset Sekuritas",
	ZP: "Kim Eng Sekuritas",
	RX: "Phillip Sekuritas Indonesia",
	AK: "UBS Sekuritas Indonesia",
	CC: "Mandiri Sekuritas",
	BK: "J.P. Morgan Sekuritas",
	YU: "CIMB Sekuritas Indonesia",
	DR: "OSO Sekuritas Indonesia",
	GR: "Panin Sekuritas",
	CS: "Credit Suisse Sekuritas",
	DB: "Deutsche Sekuritas Indonesia",
	MK: "Minna Padi Investama",
	DH: "Sinarmas Sekuritas",
	LG: "Trimegah Sekuritas",
	KK: "Valbury Sekuritas",
	EP: "MNC Sekuritas",
	FS: "Kresna Sekuritas",
	ML: "Merrill Lynch Indonesia",
	AI: "BNI Sekuritas",
};

export type BrokerRow = {
	rank: number;
	buyBroker: string;
	bVal: number; // in billions IDR
	bLot: number; // in thousands lots
	bAvg: number; // avg price IDR
	sellBroker: string;
	sVal: number;
	sLot: number;
	sAvg: number;
	netVal: number; // buy - sell (signed)
};

export type BrokerSummaryRow = {
	broker: string;
	bVal: number; // billions IDR
	bLot: number; // lots
	bAvg: number; // avg buy price
	sVal: number;
	sLot: number;
	sAvg: number;
	netVal: number; // bVal - sVal
	netLot: number; // bLot - sLot
};

export type IntradayPoint = {
	time: string; // HH:MM
	[broker: string]: number | string;
};

export type BrokerActivityData = {
	brokers: string[]; // top 5 broker codes shown in chart
	colors: string[]; // hex color per broker
	intraday: IntradayPoint[]; // cumulative net flow per broker over trading day
	table: BrokerRow[];
};

const CHART_COLORS = [
	"#3b82f6", // blue
	"#f59e0b", // amber
	"#10b981", // emerald
	"#ef4444", // red
	"#8b5cf6", // violet
];

// Trading hours: 09:00 – 16:00, every 15 min → 29 points
function generateTradingTimes(): string[] {
	const times: string[] = [];
	for (let h = 9; h <= 16; h++) {
		for (let m = 0; m < 60; m += 15) {
			if (h === 16 && m > 0) break;
			times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
		}
	}
	return times;
}

export function getBrokerActivity(
	ticker: string,
	range: "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" = "1D",
): BrokerActivityData {
	const rng = seededRand(
		tickerSeed(ticker) ^
			range.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
	);

	// Pick 5 brokers for this ticker (shuffle top brokers)
	const shuffled = [...BROKER_CODES].sort(() => rng() - 0.5);
	const topBrokers = shuffled.slice(0, 5);

	// Scale factor based on stock price & range
	const baseScale = 50 + rng() * 200; // 50–250 billion IDR range

	// Generate intraday cumulative net flow per broker
	const times = generateTradingTimes();
	const cumulative: Record<string, number> = {};
	topBrokers.forEach((b) => {
		cumulative[b] = 0;
	});

	const intraday: IntradayPoint[] = times.map((time) => {
		const point: IntradayPoint = { time };
		topBrokers.forEach((broker) => {
			// Each 15-min tick: random delta (can be positive or negative)
			const delta = (rng() - 0.45) * baseScale * 0.08;
			cumulative[broker] = parseFloat(
				((cumulative[broker] ?? 0) + delta).toFixed(2),
			);
			point[broker] = cumulative[broker];
		});
		return point;
	});

	// Generate broker table: top 10 buyers + sellers
	const tableRng = seededRand(tickerSeed(ticker) + 777);
	const allBrokers = [...BROKER_CODES].sort(() => tableRng() - 0.5);

	const avgPrice = 3000 + tableRng() * 12000;
	const table: BrokerRow[] = Array.from({ length: 10 }, (_, i) => {
		const bVal = (tableRng() * baseScale * 1.5 * (10 - i)) / 10;
		const sVal = (tableRng() * baseScale * 1.5 * (10 - i)) / 10;
		const bAvg = avgPrice * (0.98 + tableRng() * 0.04);
		const sAvg = avgPrice * (0.98 + tableRng() * 0.04);
		const bLot = Math.round((bVal * 1e9) / (bAvg * 100) / 1000);
		const sLot = Math.round((sVal * 1e9) / (sAvg * 100) / 1000);
		return {
			rank: i + 1,
			buyBroker: allBrokers[i * 2] ?? "YP",
			bVal: parseFloat(bVal.toFixed(2)),
			bLot,
			bAvg: Math.round(bAvg),
			sellBroker: allBrokers[i * 2 + 1] ?? "OD",
			sVal: parseFloat(sVal.toFixed(2)),
			sLot,
			sAvg: Math.round(sAvg),
			netVal: parseFloat((bVal - sVal).toFixed(2)),
		};
	});

	return {
		brokers: topBrokers,
		colors: CHART_COLORS,
		intraday,
		table,
	};
}

export type BrokerTableRow = {
	rank: number;
	stock: string; // ticker bought by this broker
	bVal: number;
	bLot: number;
	bAvg: number;
	sStock: string; // ticker sold by this broker
	sVal: number;
	sLot: number;
	sAvg: number;
};

// Per-broker table: which stocks they buy (left) and sell (right), ranked by buy value
export function getBrokerTable(
	broker: string,
	range: "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" = "1D",
): BrokerTableRow[] {
	const seed =
		(broker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 113) ^
		range.split("").reduce((a, c) => a + c.charCodeAt(0), 0) ^
		0xbeefdead;
	const rng = seededRand(seed);

	const shuffled = [...STOCK_POOL].sort(() => rng() - 0.5);
	const shuffledSell = [...STOCK_POOL].sort(() => rng() - 0.5);
	const baseScale = 30 + rng() * 150;
	const count = 10;

	return Array.from({ length: count }, (_, i) => {
		const buyStock = shuffled[i % shuffled.length]!;
		const sellStock = shuffledSell[i % shuffledSell.length]!;
		const bAvgPrice = 1000 + rng() * 12000;
		const sAvgPrice = 1000 + rng() * 12000;
		const bVal = parseFloat((rng() * baseScale * (1 - i * 0.07)).toFixed(2));
		const sVal = parseFloat((rng() * baseScale * (0.8 - i * 0.06)).toFixed(2));
		const bAvg = Math.round(bAvgPrice);
		const sAvg = Math.round(sAvgPrice);
		const bLot = Math.round((bVal * 1e9) / (bAvg * 100));
		const sLot = Math.round((sVal * 1e9) / (sAvg * 100));
		return {
			rank: i + 1,
			stock: buyStock.ticker,
			bVal,
			bLot,
			bAvg,
			sStock: sellStock.ticker,
			sVal,
			sLot,
			sAvg,
		};
	});
}

// Stocks held/bought by a specific broker
export type BrokerStockRow = {
	ticker: string;
	name: string;
	bVal: number; // billions IDR
	bLot: number; // lots
	bAvg: number; // avg buy price
	sVal: number;
	sLot: number;
	sAvg: number;
	netVal: number;
	netLot: number;
};

const STOCK_POOL = [
	{ ticker: "BBCA", name: "Bank Central Asia" },
	{ ticker: "BBRI", name: "Bank Rakyat Indonesia" },
	{ ticker: "BMRI", name: "Bank Mandiri" },
	{ ticker: "TLKM", name: "Telkom Indonesia" },
	{ ticker: "ASII", name: "Astra International" },
	{ ticker: "GOTO", name: "GoTo Gojek Tokopedia" },
	{ ticker: "BYAN", name: "Bayan Resources" },
	{ ticker: "UNVR", name: "Unilever Indonesia" },
	{ ticker: "ICBP", name: "Indofood CBP" },
	{ ticker: "KLBF", name: "Kalbe Farma" },
	{ ticker: "ADRO", name: "Adaro Energy" },
	{ ticker: "PTBA", name: "Bukit Asam" },
	{ ticker: "BBNI", name: "Bank Negara Indonesia" },
	{ ticker: "SMGR", name: "Semen Indonesia" },
	{ ticker: "INDF", name: "Indofood Sukses Makmur" },
];

// Per-broker: which stocks they are buying/selling
export function getBrokerStockList(
	broker: string,
	range: "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" = "1D",
): BrokerStockRow[] {
	const seed =
		(broker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 97) ^
		range.split("").reduce((a, c) => a + c.charCodeAt(0), 0) ^
		0xcafebabe;
	const rng = seededRand(seed);

	// Pick 8–12 stocks for this broker
	const shuffled = [...STOCK_POOL].sort(() => rng() - 0.5);
	const count = 8 + Math.floor(rng() * 5);
	const stocks = shuffled.slice(0, count);

	const baseScale = 20 + rng() * 120;

	return stocks
		.map((stock) => {
			const avgPrice = 1000 + rng() * 10000;
			const bVal = parseFloat(
				(rng() * baseScale * (0.3 + rng() * 0.7)).toFixed(2),
			);
			const sVal = parseFloat(
				(rng() * baseScale * (0.2 + rng() * 0.5)).toFixed(2),
			);
			const bAvg = Math.round(avgPrice * (0.98 + rng() * 0.04));
			const sAvg = Math.round(avgPrice * (0.98 + rng() * 0.04));
			const bLot = Math.round((bVal * 1e9) / (bAvg * 100));
			const sLot = Math.round((sVal * 1e9) / (sAvg * 100));
			return {
				ticker: stock.ticker,
				name: stock.name,
				bVal,
				bLot,
				bAvg,
				sVal,
				sLot,
				sAvg,
				netVal: parseFloat((bVal - sVal).toFixed(2)),
				netLot: bLot - sLot,
			};
		})
		.sort((a, b) => b.bVal - a.bVal);
}

// All brokers summary for the broker page: net buyer/seller ranking across all stocks
export type BrokerOverviewRow = {
	broker: string;
	totalBVal: number;
	totalSVal: number;
	totalNetVal: number;
	totalBLot: number;
	totalSLot: number;
	totalNetLot: number;
	topBuyStock: string;
	topSellStock: string;
};

export function getBrokerOverview(
	range: "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" = "1D",
): BrokerOverviewRow[] {
	return BROKER_CODES.map((broker) => {
		const stocks = getBrokerStockList(broker, range);
		const totalBVal = parseFloat(
			stocks.reduce((s, r) => s + r.bVal, 0).toFixed(2),
		);
		const totalSVal = parseFloat(
			stocks.reduce((s, r) => s + r.sVal, 0).toFixed(2),
		);
		const totalBLot = stocks.reduce((s, r) => s + r.bLot, 0);
		const totalSLot = stocks.reduce((s, r) => s + r.sLot, 0);
		const topBuy = stocks.reduce(
			(a, b) => (b.bVal > a.bVal ? b : a),
			stocks[0]!,
		);
		const topSell = stocks.reduce(
			(a, b) => (b.sVal > a.sVal ? b : a),
			stocks[0]!,
		);
		return {
			broker,
			totalBVal,
			totalSVal,
			totalNetVal: parseFloat((totalBVal - totalSVal).toFixed(2)),
			totalBLot,
			totalSLot,
			totalNetLot: totalBLot - totalSLot,
			topBuyStock: topBuy?.ticker ?? "-",
			topSellStock: topSell?.ticker ?? "-",
		};
	}).sort((a, b) => b.totalNetVal - a.totalNetVal);
}

// Foreign-Domestic activity for a ticker
export type ForeignDomesticData = {
	// Value (billions IDR)
	fBuy: number;
	fSell: number;
	dBuy: number;
	dSell: number;
	netForeign: number;
	// Volume (millions lots)
	fBuyVol: number;
	fSellVol: number;
	dBuyVol: number;
	dSellVol: number;
	netForeignVol: number;
};

export function getForeignDomestic(
	ticker: string,
	range: "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" = "1D",
	market: "Regular" | "All Market" = "Regular",
): ForeignDomesticData {
	const seed =
		tickerSeed(ticker) ^
		range.split("").reduce((a, c) => a + c.charCodeAt(0), 0) ^
		market.split("").reduce((a, c) => a + c.charCodeAt(0), 0) ^
		0xf0ed;
	const rng = seededRand(seed);

	const baseScale = 100 + rng() * 900; // 100B – 1T IDR
	const fBuy = parseFloat((rng() * baseScale * 0.4).toFixed(2));
	const fSell = parseFloat((rng() * baseScale * 0.5).toFixed(2));
	const dBuy = parseFloat((rng() * baseScale).toFixed(2));
	const dSell = parseFloat((rng() * baseScale * 0.9).toFixed(2));

	// Volume in millions lots (rough: value / avgPrice / 100, scaled to M)
	const avgPrice = 1000 + rng() * 9000;
	const toVol = (val: number) =>
		parseFloat(((val * 1e9) / (avgPrice * 100) / 1e6).toFixed(2));
	const fBuyVol = toVol(fBuy);
	const fSellVol = toVol(fSell);
	const dBuyVol = toVol(dBuy);
	const dSellVol = toVol(dSell);

	return {
		fBuy,
		fSell,
		dBuy,
		dSell,
		netForeign: parseFloat((fBuy - fSell).toFixed(2)),
		fBuyVol,
		fSellVol,
		dBuyVol,
		dSellVol,
		netForeignVol: parseFloat((fBuyVol - fSellVol).toFixed(2)),
	};
}

// Full broker summary — one row per broker code, all 20 brokers
export function getBrokerSummary(
	ticker: string,
	range: "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" = "1D",
): BrokerSummaryRow[] {
	const seed =
		tickerSeed(ticker) ^
		range.split("").reduce((a, c) => a + c.charCodeAt(0), 0) ^
		0xdeadbeef;
	const rng = seededRand(seed);

	const baseScale = 30 + rng() * 180;
	const avgPrice = 2000 + rng() * 13000;

	return BROKER_CODES.map((broker) => {
		const bVal = parseFloat((rng() * baseScale).toFixed(2));
		const sVal = parseFloat((rng() * baseScale).toFixed(2));
		const bAvg = Math.round(avgPrice * (0.97 + rng() * 0.06));
		const sAvg = Math.round(avgPrice * (0.97 + rng() * 0.06));
		const bLot = Math.round((bVal * 1e9) / (bAvg * 100));
		const sLot = Math.round((sVal * 1e9) / (sAvg * 100));
		return {
			broker,
			bVal,
			bLot,
			bAvg,
			sVal,
			sLot,
			sAvg,
			netVal: parseFloat((bVal - sVal).toFixed(2)),
			netLot: bLot - sLot,
		};
	});
}
