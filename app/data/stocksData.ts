import type { Stock } from "./stocks";

export type StockDetail = Stock & {
	employees: number;
	website: string;
	industry: string;
	country: string;
	eps: number;
	beta: number;
	avgVolume: number;
	openPrice: number;
	prevClose: number;
	dayHigh: number;
	dayLow: number;
	notations?: string[];
};

/** Notation overrides per ticker. Only stocks with notations are listed. */
export const STOCKS_DATA: Record<string, { notations?: string[] }> = {
	"BBCA.JK": { notations: ["B"] },
	"BBRI.JK": { notations: ["B", "L"] },
	"TLKM.JK": { notations: ["M"] },
	"KLBF.JK": { notations: ["D"] },
	"HMSP.JK": { notations: ["X"] },
	"GOTO.JK": { notations: ["E", "S"] },
	"BUVA.JK": { notations: ["C"] },
};
