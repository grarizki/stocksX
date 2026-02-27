import { IDX_STOCKS } from "../../../app/data/idxStocks";

export default defineEventHandler((event) => {
	const query = getQuery(event);
	const q = (query.q as string | undefined)?.trim().toLowerCase();
	if (!q) return [];

	return IDX_STOCKS.filter(
		(s) =>
			s.ticker.replace(".JK", "").toLowerCase().includes(q) ||
			s.name.toLowerCase().includes(q),
	).slice(0, 10);
});
