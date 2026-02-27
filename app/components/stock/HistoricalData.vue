<script setup lang="ts">
import type { OHLCPoint } from "@/data/stockHistory";
import { getStockHistory } from "@/data/stockHistory";
import { formatCompact } from "@/lib/utils";

const props = defineProps<{ ticker: string }>();

type Period = "daily" | "weekly" | "monthly";
const period = ref<Period>("daily");
const PERIODS: Period[] = ["daily", "weekly", "monthly"];

const showAll = ref(false);
const PAGE_SIZE = 15;

const fullHistory = computed(() => getStockHistory(props.ticker));

// Aggregate weekly: last close of week, sum volume, max high, min low
function aggregateWeekly(points: OHLCPoint[]): OHLCPoint[] {
	const weeks: Record<string, OHLCPoint[]> = {};
	for (const p of points) {
		const d = new Date(p.date);
		const day = d.getDay();
		const monday = new Date(d);
		monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
		const key = monday.toISOString().slice(0, 10);
		if (!weeks[key]) weeks[key] = [];
		weeks[key].push(p);
	}
	return Object.entries(weeks)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, pts]) => ({
			date: pts[pts.length - 1]!.date,
			open: pts[0]!.open,
			high: Math.max(...pts.map((p) => p.high)),
			low: Math.min(...pts.map((p) => p.low)),
			close: pts[pts.length - 1]!.close,
			volume: pts.reduce((s, p) => s + p.volume, 0),
		}));
}

// Aggregate monthly: last close of month, sum volume
function aggregateMonthly(points: OHLCPoint[]): OHLCPoint[] {
	const months: Record<string, OHLCPoint[]> = {};
	for (const p of points) {
		const key = p.date.slice(0, 7); // YYYY-MM
		if (!months[key]) months[key] = [];
		months[key].push(p);
	}
	return Object.entries(months)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, pts]) => ({
			date: pts[pts.length - 1]!.date,
			open: pts[0]!.open,
			high: Math.max(...pts.map((p) => p.high)),
			low: Math.min(...pts.map((p) => p.low)),
			close: pts[pts.length - 1]!.close,
			volume: pts.reduce((s, p) => s + p.volume, 0),
		}));
}

const aggregated = computed<OHLCPoint[]>(() => {
	const h = fullHistory.value;
	if (period.value === "daily") return [...h].reverse();
	if (period.value === "weekly") return aggregateWeekly(h).reverse();
	return aggregateMonthly(h).reverse();
});

const visible = computed(() =>
	showAll.value ? aggregated.value : aggregated.value.slice(0, PAGE_SIZE),
);

function fmtDate(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "2-digit",
	});
}

function changeVsRow(idx: number): { value: number; pct: number } | null {
	const cur = aggregated.value[idx];
	const prev = aggregated.value[idx + 1];
	if (!cur || !prev) return null;
	const diff = cur.close - prev.close;
	const pct = (diff / prev.close) * 100;
	return { value: diff, pct };
}

function fmtChange(v: number) {
	return (v >= 0 ? "+" : "") + v.toLocaleString();
}
function fmtPct(v: number) {
	return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}
function fmtValue(vol: number, price: number) {
	return formatCompact(vol * price);
}

// Derive dummy foreign flow & freq from volume (deterministic, seeded per date)
function deriveExtras(row: OHLCPoint) {
	const seed = row.date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const r = (n: number) =>
		((seed * (n + 1) * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
	const fBuyRatio = 0.2 + r(1) * 0.6;
	const fBuy = Math.round(row.volume * fBuyRatio * row.close);
	const fSell = Math.round(
		row.volume * (1 - fBuyRatio) * r(2) * 0.8 * row.close,
	);
	const nForeign = fBuy - fSell;
	const freq = Math.round(row.volume * (0.005 + r(3) * 0.02));
	const avg = Math.round((row.open + row.high + row.low + row.close) / 4);
	return { fBuy, fSell, nForeign, freq, avg };
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">{{ $t('stock.historical.title') }}</h3>
    </div>

    <!-- Period toggle -->
    <div class="flex gap-1.5">
      <button
        v-for="p in PERIODS"
        :key="p"
        class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="period === p
          ? 'bg-blue-500 text-white'
          : 'border border-border/50 text-muted-foreground hover:text-foreground'"
        @click="period = p; showAll = false"
      >{{ $t(`stock.historical.${p}`) }}</button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-xl border border-border/40">
      <table class="w-full text-[11px]">
        <thead>
          <tr class="border-b border-border/40 text-muted-foreground">
            <th class="sticky left-0 bg-card px-3 py-2 text-left font-medium">{{ $t('stock.historical.date') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.value') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.volume') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.freq') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.fBuy') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.fSell') }}</th>
            <th class="px-3 py-2 text-center font-medium">{{ $t('stock.historical.nForeign') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.open') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.high') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.low') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.avg') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.close') }}</th>
            <th class="px-3 py-2 text-right font-medium">{{ $t('stock.historical.change') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in visible"
            :key="row.date"
            class="border-b border-border/20 hover:bg-accent/20"
          >
            <td class="sticky left-0 bg-card px-3 py-2 font-medium text-foreground">{{ fmtDate(row.date) }}</td>
            <td class="px-3 py-2 text-right text-muted-foreground">{{ fmtValue(row.volume, row.close) }}</td>
            <td class="px-3 py-2 text-right text-muted-foreground">{{ formatCompact(row.volume) }}</td>
            <td class="px-3 py-2 text-right text-muted-foreground">{{ formatCompact(deriveExtras(row).freq) }}</td>
            <td class="px-3 py-2 text-right text-gain">{{ formatCompact(deriveExtras(row).fBuy) }}</td>
            <td class="px-3 py-2 text-right text-loss">{{ formatCompact(deriveExtras(row).fSell) }}</td>
            <td class="px-3 py-2 text-right" :class="deriveExtras(row).nForeign >= 0 ? 'text-gain' : 'text-loss'">
              {{ formatCompact(Math.abs(deriveExtras(row).nForeign)) }}
            </td>
            <td class="px-3 py-2 text-right text-muted-foreground">{{ row.open.toLocaleString() }}</td>
            <td class="px-3 py-2 text-right text-gain">{{ row.high.toLocaleString() }}</td>
            <td class="px-3 py-2 text-right text-loss">{{ row.low.toLocaleString() }}</td>
            <td class="px-3 py-2 text-right text-muted-foreground">{{ deriveExtras(row).avg.toLocaleString() }}</td>
            <td class="px-3 py-2 text-right font-semibold" :class="(changeVsRow(i)?.value ?? 0) >= 0 ? 'text-gain' : 'text-loss'">
              {{ row.close.toLocaleString() }}
            </td>
            <td class="px-3 py-2 text-right">
              <template v-if="changeVsRow(i)">
                <div :class="changeVsRow(i)!.value >= 0 ? 'text-gain' : 'text-loss'">
                  {{ fmtChange(changeVsRow(i)!.value) }}
                </div>
                <div class="text-[10px]" :class="changeVsRow(i)!.value >= 0 ? 'text-gain' : 'text-loss'">
                  {{ fmtPct(changeVsRow(i)!.pct) }}
                </div>
              </template>
              <span v-else class="text-muted-foreground">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- See More / Less -->
    <button
      v-if="aggregated.length > PAGE_SIZE"
      class="flex w-full items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
      @click="showAll = !showAll"
    >
      {{ showAll ? $t('stock.historical.seeLess') : $t('stock.historical.seeMore') }}
      <svg class="h-3.5 w-3.5 transition-transform" :class="showAll ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
  </div>
</template>
