import { defineStore } from "pinia";
import { ref, watch } from "vue";

export type AlertCondition = "above" | "below";

export type PriceAlert = {
	id: string;
	ticker: string;
	condition: AlertCondition;
	targetPrice: number;
	createdAt: number;
	active: boolean;
};

export type AlertLogEntry = {
	id: string;
	ticker: string;
	condition: AlertCondition;
	targetPrice: number;
	triggeredAt: number;
};

const STORAGE_KEY = "StoxLyz-price-alerts";
const LOG_KEY = "StoxLyz-price-alert-log";

export const usePriceAlertStore = defineStore("priceAlert", () => {
	const alerts = ref<PriceAlert[]>([]);
	const log = ref<AlertLogEntry[]>([]);

	const load = () => {
		if (!import.meta.client) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) alerts.value = JSON.parse(raw);
		} catch {}
		try {
			const rawLog = localStorage.getItem(LOG_KEY);
			if (rawLog) log.value = JSON.parse(rawLog);
		} catch {}
	};

	load();

	if (import.meta.client) {
		watch(alerts, (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), {
			deep: true,
		});
		watch(log, (v) => localStorage.setItem(LOG_KEY, JSON.stringify(v)), {
			deep: true,
		});
	}

	const addAlert = (
		ticker: string,
		condition: AlertCondition,
		targetPrice: number,
	) => {
		alerts.value.push({
			id: Date.now().toString(),
			ticker,
			condition,
			targetPrice,
			createdAt: Date.now(),
			active: true,
		});
	};

	const removeAlert = (id: string) => {
		alerts.value = alerts.value.filter((a) => a.id !== id);
	};

	const alertsForTicker = (ticker: string) =>
		alerts.value.filter((a) => a.ticker === ticker && a.active);

	const logForTicker = (ticker: string) =>
		log.value.filter((e) => e.ticker === ticker);

	return { alerts, log, addAlert, removeAlert, alertsForTicker, logForTicker };
});
