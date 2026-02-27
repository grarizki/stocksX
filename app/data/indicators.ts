export type EconomicIndicator = {
	id: string;
	name: string;
	value: string;
	numericValue: number;
	previousValue: string;
	change: number;
	changePercent: number;
	unit: string;
	category: "monetary" | "fiscal" | "trade" | "market";
	updatedAt: string;
};

export const indicators: EconomicIndicator[] = [
	{
		id: "bi-rate",
		name: "BI Rate",
		value: "5.75%",
		numericValue: 5.75,
		previousValue: "6.00%",
		change: -0.25,
		changePercent: -4.17,
		unit: "%",
		category: "monetary",
		updatedAt: "2026-02-12T14:00:00.000Z",
	},
	{
		id: "inflation-yoy",
		name: "Inflation YoY",
		value: "2.68%",
		numericValue: 2.68,
		previousValue: "2.51%",
		change: 0.17,
		changePercent: 6.77,
		unit: "%",
		category: "monetary",
		updatedAt: "2026-02-10T09:00:00.000Z",
	},
	{
		id: "gdp-growth",
		name: "GDP Growth",
		value: "5.05%",
		numericValue: 5.05,
		previousValue: "5.11%",
		change: -0.06,
		changePercent: -1.17,
		unit: "%",
		category: "fiscal",
		updatedAt: "2026-02-05T09:00:00.000Z",
	},
	{
		id: "idr-usd",
		name: "IDR/USD",
		value: "15,830",
		numericValue: 15830,
		previousValue: "15,725",
		change: 105,
		changePercent: 0.67,
		unit: "IDR",
		category: "monetary",
		updatedAt: "2026-02-14T16:00:00.000Z",
	},
	{
		id: "ihsg",
		name: "IHSG",
		value: "7,285.45",
		numericValue: 7285.45,
		previousValue: "7,198.32",
		change: 87.13,
		changePercent: 1.21,
		unit: "points",
		category: "market",
		updatedAt: "2026-02-14T16:00:00.000Z",
	},
	{
		id: "foreign-flow-mtd",
		name: "Foreign Flow (MTD)",
		value: "-2.3T",
		numericValue: -2.3,
		previousValue: "-1.8T",
		change: -0.5,
		changePercent: -27.78,
		unit: "trillion IDR",
		category: "market",
		updatedAt: "2026-02-14T16:00:00.000Z",
	},
	{
		id: "trade-balance",
		name: "Trade Balance",
		value: "$3.56B",
		numericValue: 3.56,
		previousValue: "$2.89B",
		change: 0.67,
		changePercent: 23.18,
		unit: "billion USD",
		category: "trade",
		updatedAt: "2026-02-07T09:30:00.000Z",
	},
	{
		id: "foreign-reserve",
		name: "Foreign Reserve",
		value: "$139.5B",
		numericValue: 139.5,
		previousValue: "$138.2B",
		change: 1.3,
		changePercent: 0.94,
		unit: "billion USD",
		category: "trade",
		updatedAt: "2026-02-11T12:00:00.000Z",
	},
];
