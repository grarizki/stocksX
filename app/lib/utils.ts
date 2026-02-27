import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function formatCompact(value: number): string {
	if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
	if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
	if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
	if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
	return value.toString();
}

export function formatPercent(value: number): string {
	const sign = value >= 0 ? "+" : "";
	return `${sign}${value.toFixed(2)}%`;
}

export function timeAgo(date: string): string {
	const now = new Date();
	const past = new Date(date);
	const diffMs = now.getTime() - past.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return past.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
