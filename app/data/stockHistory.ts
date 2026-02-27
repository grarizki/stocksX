// Dummy price history for IDX stocks
// Generates realistic-looking OHLC + volume data seeded from each stock's current price

export type OHLCPoint = {
	date: string; // ISO date string
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
};

// Seeded pseudo-random walk — deterministic per ticker so refresh doesn't flicker
function seededRand(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) & 0xffffffff;
		return (s >>> 0) / 0xffffffff;
	};
}

function generateHistory(
	ticker: string,
	currentPrice: number,
	currentVolume: number,
	days: number,
): OHLCPoint[] {
	const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const rand = seededRand(seed);

	const points: OHLCPoint[] = [];
	let price = currentPrice * (0.6 + rand() * 0.15); // start ~60-75% of current price (uptrend)
	const trend = (currentPrice / price) ** (1 / days); // compound growth factor

	const now = new Date(2026, 1, 24); // Feb 24 2026 (today)
	for (let i = days; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);

		// Skip weekends
		const dow = date.getDay();
		if (dow === 0 || dow === 6) continue;

		const dailyVol = (rand() - 0.48) * 0.025; // ±2.5% daily move
		const open = price;
		const close = Math.round(price * trend * (1 + dailyVol));
		const high = Math.round(Math.max(open, close) * (1 + rand() * 0.012));
		const low = Math.round(Math.min(open, close) * (1 - rand() * 0.012));
		const volume = Math.round(currentVolume * (0.5 + rand() * 1.2));

		points.push({
			date: date.toISOString().slice(0, 10),
			open,
			high,
			low,
			close,
			volume,
		});
		price = close;
	}

	// Force last close to match current price
	if (points.length) {
		const last = points[points.length - 1];
		last.close = currentPrice;
		last.high = Math.max(last.high, currentPrice);
		last.low = Math.min(last.low, currentPrice);
	}

	return points;
}

// Base prices and volumes from DUMMY_STOCKS
const BASE: Record<string, { price: number; volume: number }> = {
	"BBCA.JK": { price: 9350, volume: 32_500_000 },
	"BBRI.JK": { price: 4180, volume: 78_000_000 },
	"BMRI.JK": { price: 6250, volume: 45_000_000 },
	"TLKM.JK": { price: 2750, volume: 55_000_000 },
	"ASII.JK": { price: 4480, volume: 22_000_000 },
	"BYAN.JK": { price: 18500, volume: 5_200_000 },
	"UNVR.JK": { price: 1800, volume: 18_000_000 },
	"ICBP.JK": { price: 10050, volume: 8_500_000 },
	"KLBF.JK": { price: 1550, volume: 30_000_000 },
	"HMSP.JK": { price: 680, volume: 25_000_000 },
	"GOTO.JK": { price: 62, volume: 3_200_000_000 },
	"BBNI.JK": { price: 4540, volume: 33_000_000 },
	"INDF.JK": { price: 6975, volume: 11_000_000 },
	"SMGR.JK": { price: 3740, volume: 9_500_000 },
	"MNCN.JK": { price: 960, volume: 14_000_000 },
	"CPIN.JK": { price: 4700, volume: 7_000_000 },
	"ADRO.JK": { price: 1580, volume: 42_000_000 },
	"PTBA.JK": { price: 2920, volume: 15_000_000 },
	"INKP.JK": { price: 7200, volume: 4_500_000 },
	"EXCL.JK": { price: 1840, volume: 12_000_000 },
	"SIDO.JK": { price: 620, volume: 18_000_000 },
	"ACES.JK": { price: 680, volume: 9_000_000 },
	"MAPI.JK": { price: 1140, volume: 6_500_000 },
	"PWON.JK": { price: 490, volume: 35_000_000 },
	"BSDE.JK": { price: 1080, volume: 20_000_000 },
	"JPFA.JK": { price: 1390, volume: 8_000_000 },
	"TKIM.JK": { price: 6850, volume: 3_000_000 },
	"SMRA.JK": { price: 630, volume: 25_000_000 },
	"INTP.JK": { price: 6850, volume: 4_800_000 },
	"TBIG.JK": { price: 2460, volume: 7_000_000 },
};

// Cache: generate 5Y (1825 days) once per ticker
const _cache: Record<string, OHLCPoint[]> = {};

export function getStockHistory(ticker: string): OHLCPoint[] {
	if (!_cache[ticker]) {
		const base = BASE[ticker];
		if (!base) return [];
		_cache[ticker] = generateHistory(ticker, base.price, base.volume, 1825);
	}
	return _cache[ticker];
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" | "3Y" | "5Y";

export function filterByRange(
	history: OHLCPoint[],
	range: TimeRange,
): OHLCPoint[] {
	if (!history.length) return [];
	const last = new Date(history[history.length - 1].date);
	const from = new Date(last);

	switch (range) {
		case "1D":
			return history.slice(-1);
		case "1W":
			from.setDate(from.getDate() - 7);
			break;
		case "1M":
			from.setMonth(from.getMonth() - 1);
			break;
		case "3M":
			from.setMonth(from.getMonth() - 3);
			break;
		case "YTD":
			from.setMonth(0);
			from.setDate(1);
			break;
		case "1Y":
			from.setFullYear(from.getFullYear() - 1);
			break;
		case "3Y":
			from.setFullYear(from.getFullYear() - 3);
			break;
		case "5Y":
			from.setFullYear(from.getFullYear() - 5);
			break;
	}

	const fromStr = from.toISOString().slice(0, 10);
	return history.filter((p) => p.date >= fromStr);
}
