<script setup lang="ts">
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
} from "chart.js";
import { Calendar, ChevronDown } from "lucide-vue-next";
import { Bar, Line } from "vue-chartjs";
import type {
	BrokerActivityData,
	BrokerRow,
	BrokerTableRow,
} from "@/data/brokerActivity";
import {
	BROKER_NAMES,
	getBrokerActivity,
	getBrokerTable,
	getForeignDomestic,
} from "@/data/brokerActivity";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Tooltip,
	Legend,
	Filler,
);

const props = defineProps<{ ticker: string }>();

type ViewMode = "stock" | "broker";
const viewMode = ref<ViewMode>("stock");

type DataRange = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y";
const DATA_RANGES: DataRange[] = ["1D", "1W", "1M", "3M", "YTD", "1Y"];

// activeDataRange is always a valid DataRange for data functions
const activeDataRange = ref<DataRange>("1D");
const showNet = ref(false);
const showSummary = ref(false);

// ── Date range picker ──────────────────────────────────────────
const TODAY = new Date(); // Feb 26 2026 (matches project date)
const dateRange = ref<{ start: Date; end: Date }>({ start: TODAY, end: TODAY });
const showCalendar = ref(false);
const isCustomRange = ref(false);

const { t } = useI18n();

const PRESETS = computed(() => [
	{ label: t("stock.brokerActivity.presetDay"), range: "1D" as DataRange },
	{ label: t("stock.brokerActivity.presetWeek"), range: "1W" as DataRange },
	{ label: t("stock.brokerActivity.presetMonth"), range: "1M" as DataRange },
	{ label: t("stock.brokerActivity.preset3Month"), range: "3M" as DataRange },
	{ label: t("stock.brokerActivity.presetYTD"), range: "YTD" as DataRange },
	{ label: t("stock.brokerActivity.presetYear"), range: "1Y" as DataRange },
]);

function applyPreset(r: DataRange) {
	activeDataRange.value = r;
	isCustomRange.value = false;
	showCalendar.value = false;
	const end = new Date(TODAY);
	const start = new Date(TODAY);
	if (r === "1W") start.setDate(end.getDate() - 7);
	else if (r === "1M") start.setMonth(end.getMonth() - 1);
	else if (r === "3M") start.setMonth(end.getMonth() - 3);
	else if (r === "YTD") {
		start.setMonth(0);
		start.setDate(1);
	} else if (r === "1Y") start.setFullYear(end.getFullYear() - 1);
	dateRange.value = { start, end };
}

function onCalendarUpdate(val: { start: Date; end: Date } | null) {
	if (!val?.start || !val?.end) return;
	dateRange.value = val;
	isCustomRange.value = true;
	const diffDays = Math.round(
		(val.end.getTime() - val.start.getTime()) / 86400000,
	);
	if (diffDays <= 1) activeDataRange.value = "1D";
	else if (diffDays <= 7) activeDataRange.value = "1W";
	else if (diffDays <= 31) activeDataRange.value = "1M";
	else if (diffDays <= 92) activeDataRange.value = "3M";
	else activeDataRange.value = "1Y";
}

function fmtD(d: Date) {
	const dd = String(d.getDate()).padStart(2, "0");
	const mon = d.toLocaleString("en", { month: "short" });
	const yy = String(d.getFullYear()).slice(2);
	return `${dd} ${mon} ${yy}`;
}

function fmtMonth(d: Date) {
	const month = d.toLocaleString("en", { month: "short" });
	const year = d.getFullYear();
	return `${month} ${year}`;
}

const dateLabel = computed(() => {
	// For single day, show the specific date
	if (!isCustomRange.value && activeDataRange.value === "1D")
		return fmtD(TODAY);

	// For ranges, show month name of the end date
	return fmtMonth(dateRange.value.end);
});

// ── By-Stock view ──────────────────────────────────────────────
type SortKey = "bVal" | "bLot" | "bAvg" | "sVal" | "sLot" | "sAvg" | "netVal";
type SortDir = "asc" | "desc";
const sortKey = ref<SortKey>("bVal");
const sortDir = ref<SortDir>("desc");

function toggleSort(key: SortKey) {
	if (sortKey.value === key) {
		sortDir.value = sortDir.value === "desc" ? "asc" : "desc";
	} else {
		sortKey.value = key;
		sortDir.value = "desc";
	}
}

const data = computed<BrokerActivityData>(() =>
	getBrokerActivity(props.ticker, activeDataRange.value),
);

const sortedTable = computed<BrokerRow[]>(() => {
	return [...data.value.table].sort((a, b) => {
		const va = a[sortKey.value] as number;
		const vb = b[sortKey.value] as number;
		return sortDir.value === "desc" ? vb - va : va - vb;
	});
});

const lineChartData = computed(() => {
	const { brokers, colors, intraday } = data.value;
	const labels = intraday.map((p) => p.time as string);
	const sparseLabels = labels.map((l, i) => (i % 4 === 0 ? l : ""));
	const datasets = brokers.map((broker, idx) => ({
		label: broker,
		data: intraday.map((p) => p[broker] as number),
		borderColor: colors[idx],
		backgroundColor: colors[idx] + "18",
		borderWidth: 1.5,
		pointRadius: 0,
		pointHoverRadius: 4,
		tension: 0.3,
		fill: false,
	}));
	return { labels: sparseLabels, datasets };
});

const lineYBounds = computed(() => {
	const { brokers, intraday } = data.value;
	let max = 0;
	for (const p of intraday) {
		for (const b of brokers) {
			const v = Math.abs(p[b] as number);
			if (v > max) max = v;
		}
	}
	const bound = Math.ceil(max * 1.15 * 10) / 10 || 1;
	return { min: -bound, max: bound };
});

const lineChartOptions = computed(() => ({
	responsive: true,
	maintainAspectRatio: false,
	interaction: { mode: "index" as const, intersect: false },
	plugins: {
		legend: {
			display: true,
			position: "top" as const,
			labels: {
				color: "#9ca3af",
				font: { size: 10 },
				boxWidth: 10,
				padding: 8,
				pointStyle: "line" as const,
			},
		},
		tooltip: {
			backgroundColor: "#1f2937",
			titleColor: "#9ca3af",
			bodyColor: "#d1d5db",
			padding: 10,
			callbacks: {
				label: (ctx: any) =>
					` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(2)}B`,
			},
		},
	},
	scales: {
		x: {
			grid: { display: false },
			ticks: { color: "#6b7280", font: { size: 9 }, maxRotation: 0 },
		},
		y: {
			position: "left" as const,
			min: lineYBounds.value.min,
			max: lineYBounds.value.max,
			grid: {
				color: (ctx: any) => (ctx.tick.value === 0 ? "#6b728060" : "#1f293733"),
				lineWidth: (ctx: any) => (ctx.tick.value === 0 ? 1.5 : 1),
			},
			ticks: {
				color: "#6b7280",
				font: { size: 9 },
				callback: (v: any) => `${Number(v).toFixed(1)}B`,
			},
		},
	},
}));

function fmtVal(v: number) {
	return `${v.toFixed(2)}B`;
}
function fmtLot(v: number) {
	return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);
}
function fmtPrice(v: number) {
	return v.toLocaleString();
}

// ── Foreign-Domestic ───────────────────────────────────────────
type FDMarket = "Regular" | "All Market";
type FDMetric = "Value" | "Volume";
const FD_MARKETS: FDMarket[] = ["Regular", "All Market"];
const FD_METRICS: FDMetric[] = ["Value", "Volume"];
const fdMarket = ref<FDMarket>("Regular");
const fdMetric = ref<FDMetric>("Value");

const fdData = computed(() =>
	getForeignDomestic(props.ticker, activeDataRange.value, fdMarket.value),
);
const fdIsValue = computed(() => fdMetric.value === "Value");

function fmtFD(v: number, isValue: boolean) {
	if (isValue) {
		const abs = Math.abs(v);
		if (abs >= 1000) return `${(v / 1000).toFixed(2)} T`;
		if (abs >= 1) return `${v.toFixed(2)} B`;
		return `${(v * 1000).toFixed(0)} M`;
	} else {
		return `${v.toFixed(2)} M`;
	}
}

const fdBarData = computed(() => {
	const d = fdData.value;
	const isVal = fdIsValue.value;
	const raw = isVal
		? { fBuy: d.fBuy, fSell: d.fSell, dBuy: d.dBuy, dSell: d.dSell }
		: {
				fBuy: d.fBuyVol,
				fSell: d.fSellVol,
				dBuy: d.dBuyVol,
				dSell: d.dSellVol,
			};
	const scale =
		isVal && Math.max(raw.fBuy, raw.fSell, raw.dBuy, raw.dSell) >= 1000
			? 1000
			: 1;
	const v = (n: number) => parseFloat((n / scale).toFixed(3));
	return {
		labels: ["Foreign", "Domestic"],
		datasets: [
			{
				label: "Buy",
				data: [v(raw.fBuy), v(raw.dBuy)],
				backgroundColor: ["#06b6d440", "#7c3aed40"],
				borderColor: ["#06b6d4", "#7c3aed"],
				borderWidth: 1.5,
				borderRadius: 4,
			},
			{
				label: "Sell",
				data: [v(raw.fSell), v(raw.dSell)],
				backgroundColor: ["#06b6d480", "#7c3aed80"],
				borderColor: ["#06b6d4", "#7c3aed"],
				borderWidth: 1.5,
				borderRadius: 4,
			},
		],
	};
});

const fdBarOptions = computed(() => {
	const d = fdData.value;
	const isVal = fdIsValue.value;
	const maxVal = isVal
		? Math.max(d.fBuy, d.fSell, d.dBuy, d.dSell)
		: Math.max(d.fBuyVol, d.fSellVol, d.dBuyVol, d.dSellVol);
	const unit = isVal ? (maxVal >= 1000 ? "T" : maxVal >= 1 ? "B" : "M") : "M";
	return {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: "#1f2937",
				titleColor: "#9ca3af",
				bodyColor: "#d1d5db",
				callbacks: {
					label: (ctx: any) =>
						` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(2)} ${unit}`,
				},
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { color: "#6b7280", font: { size: 10 } },
			},
			y: {
				grid: { color: "#1f293733" },
				ticks: {
					color: "#6b7280",
					font: { size: 9 },
					callback: (v: any) => `${Number(v).toFixed(1)}${unit}`,
				},
			},
		},
	};
});

const fdForeignPct = computed(() => {
	const d = fdData.value;
	const isVal = fdIsValue.value;
	const fTotal = isVal ? d.fBuy + d.fSell : d.fBuyVol + d.fSellVol;
	const dTotal = isVal ? d.dBuy + d.dSell : d.dBuyVol + d.dSellVol;
	const total = fTotal + dTotal;
	return total > 0 ? ((fTotal / total) * 100).toFixed(2) : "0.00";
});
const fdDomesticPct = computed(() => {
	const d = fdData.value;
	const isVal = fdIsValue.value;
	const fTotal = isVal ? d.fBuy + d.fSell : d.fBuyVol + d.fSellVol;
	const dTotal = isVal ? d.dBuy + d.dSell : d.dBuyVol + d.dSellVol;
	const total = fTotal + dTotal;
	return total > 0 ? ((dTotal / total) * 100).toFixed(2) : "0.00";
});

// ── By-Broker view ─────────────────────────────────────────────
const BROKER_CODES = Object.keys(BROKER_NAMES);
const selectedBroker = ref<string>(BROKER_CODES[0] ?? "YP");

type InvestorType = "All Investor" | "Foreign" | "Local";
type MarketType = "Regular" | "Nego" | "Tunai";
const investorType = ref<InvestorType>("All Investor");
const marketType = ref<MarketType>("Regular");
const showBrokerPicker = ref(false);
const showInvestorPicker = ref(false);
const showMarketPicker = ref(false);
const INVESTOR_TYPES: InvestorType[] = ["All Investor", "Foreign", "Local"];
const MARKET_TYPES: MarketType[] = ["Regular", "Nego", "Tunai"];

const brokerRows = computed<BrokerTableRow[]>(() =>
	getBrokerTable(selectedBroker.value, activeDataRange.value),
);

function fmtBVal(v: number) {
	if (v === 0) return "-";
	if (Math.abs(v) >= 1) return `${v.toFixed(1)}B`;
	return `${(v * 1000).toFixed(0)}M`;
}
function fmtBLot(v: number) {
	if (v === 0) return "0";
	if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
	if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
	return String(v);
}
function fmtBAvg(v: number) {
	return v.toLocaleString("id-ID");
}
</script>

<template>
  <div
    class="space-y-3"
    @click="showBrokerPicker = false; showInvestorPicker = false; showMarketPicker = false; showCalendar = false"
  >
    <!-- Header: title + view toggle + All button -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">{{ $t('stock.brokerActivity.title') }}</h3>
      <div class="flex items-center gap-2">
        <div class="flex rounded-lg border border-border/50 p-0.5 text-[10px] font-medium">
          <button
            class="rounded-md px-2 py-1 transition-colors"
            :class="viewMode === 'stock' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click.stop="viewMode = 'stock'"
          >{{ $t('stock.brokerActivity.byStock') }}</button>
          <button
            class="rounded-md px-2 py-1 transition-colors"
            :class="viewMode === 'broker' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click.stop="viewMode = 'broker'"
          >{{ $t('stock.brokerActivity.byBroker') }}</button>
        </div>
        <button
          v-if="viewMode === 'stock'"
          class="flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          @click.stop="showSummary = true"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          {{ $t('stock.brokerActivity.all') }}
        </button>
      </div>
    </div>

    <StockBrokerSummary v-model:open="showSummary" :ticker="ticker" :range="activeDataRange" :show-net="showNet" />

    <!-- Date picker row -->
    <div class="relative z-30" @click.stop>
      <div class="flex flex-wrap items-center gap-2">
        <!-- Date display / calendar trigger -->
        <button
          class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/30"
          :class="isCustomRange
            ? 'border-blue-500/40 text-blue-400'
            : 'border-border/50 text-blue-400'"
          @click.stop="showCalendar = !showCalendar"
        >
          <span>{{ dateLabel }}</span>
          <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <!-- Quick range pills -->
        <div class="flex gap-1 overflow-x-auto scrollbar-none">
          <button
            v-for="r in DATA_RANGES"
            :key="r"
            class="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="activeDataRange === r && !isCustomRange
              ? 'bg-blue-500 text-white'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
            @click.stop="applyPreset(r)"
          >{{ r }}</button>
        </div>
      </div>

      <!-- Calendar dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showCalendar"
          class="absolute left-0 top-full z-40 mt-1 rounded-2xl border border-border/50 bg-background shadow-2xl overflow-hidden"
          @click.stop
        >
          <VDatePicker
            v-model.range="dateRange"
            :columns="1"
            :max-date="TODAY"
            color="blue"
            is-dark
            @update:model-value="onCalendarUpdate"
          />
          <!-- Preset shortcuts -->

        </div>
      </Transition>
    </div>

    <!-- ── By-Stock view ── -->
    <template v-if="viewMode === 'stock'">
      <!-- Foreign-Domestic Activity -->
      <div class="rounded-xl border border-border/40 bg-card/50 p-3 space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold">{{ $t('stock.brokerActivity.foreignDomestic') }}</p>
          <div class="flex rounded-lg border border-border/50 p-0.5 text-[10px] font-medium">
            <button
              v-for="m in FD_MARKETS"
              :key="m"
              class="rounded-md px-2 py-0.5 transition-colors"
              :class="fdMarket === m ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
              @click.stop="fdMarket = m"
            >{{ m }}</button>
          </div>
        </div>

        <div class="flex rounded-lg border border-border/50 p-0.5 text-[10px] font-medium w-fit">
          <button
            v-for="mt in FD_METRICS"
            :key="mt"
            class="rounded-md px-3 py-1 transition-colors"
            :class="fdMetric === mt ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click.stop="fdMetric = mt"
          >{{ mt }}</button>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between">
            <span class="text-muted-foreground">{{ $t('stock.brokerActivity.fBuy') }}</span>
            <span class="font-semibold text-cyan-400">{{ fmtFD(fdIsValue ? fdData.fBuy : fdData.fBuyVol, fdIsValue) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">{{ $t('stock.brokerActivity.fSell') }}</span>
            <span class="font-semibold text-red-400">{{ fmtFD(fdIsValue ? fdData.fSell : fdData.fSellVol, fdIsValue) }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between text-xs border-t border-border/30 pt-2">
          <span class="text-muted-foreground">{{ $t('stock.brokerActivity.netForeign') }}</span>
          <span
            class="font-bold"
            :class="(fdIsValue ? fdData.netForeign : fdData.netForeignVol) >= 0 ? 'text-cyan-400' : 'text-red-400'"
          >{{ (fdIsValue ? fdData.netForeign : fdData.netForeignVol) >= 0 ? '+' : '' }}{{ fmtFD(fdIsValue ? fdData.netForeign : fdData.netForeignVol, fdIsValue) }}</span>
        </div>

        <div class="h-36 w-full">
          <Bar :data="fdBarData" :options="fdBarOptions" />
        </div>

        <div class="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-cyan-500/70" />{{ $t('stock.brokerActivity.foreign') }}</span>
          <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-violet-600/70" />{{ $t('stock.brokerActivity.domestic') }}</span>
          <span class="flex items-center gap-1"><span class="inline-block h-2.5 w-2.5 rounded-sm border border-border/60 bg-muted/40 opacity-60" />{{ $t('stock.brokerActivity.buyLightSellDark') }}</span>
        </div>

        <div class="flex overflow-hidden rounded-lg text-[10px] font-semibold">
          <div
            class="flex items-center justify-center gap-1 bg-cyan-500/20 py-1.5 text-cyan-400 transition-all"
            :style="{ width: fdForeignPct + '%' }"
          >
            <span>{{ $t('stock.brokerActivity.foreign') }}</span>
            <span>{{ fdForeignPct }}%</span>
          </div>
          <div
            class="flex items-center justify-center gap-1 bg-violet-500/20 py-1.5 text-violet-400 transition-all"
            :style="{ width: fdDomesticPct + '%' }"
          >
            <span>{{ $t('stock.brokerActivity.domestic') }}</span>
            <span>{{ fdDomesticPct }}%</span>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="rounded-xl border border-border/40 bg-card/50 p-3">
        <p class="mb-2 text-[10px] text-muted-foreground">
          {{ $t('stock.brokerActivity.netFlow') }} · <span class="font-semibold text-foreground">{{ $t('stock.brokerActivity.billionIDR') }}</span>
        </p>
        <div class="h-44 w-full">
          <Line :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>

      <!-- Broker table -->
      <div class="overflow-x-auto rounded-xl border border-border/40">
        <table class="w-full text-[10px]">
          <thead>
            <tr class="border-b border-border/40 text-muted-foreground">
              <th class="px-2 py-1.5 text-left font-medium">{{ $t('stock.brokerActivity.brokerCol') }}</th>
              <th
                v-for="col in ([
                  { key: 'bVal', label: 'B.val', cls: 'text-emerald-400' },
                  { key: 'bLot', label: 'B.lot', cls: 'text-emerald-400' },
                  { key: 'bAvg', label: 'B.avg', cls: 'text-emerald-400' },
                ] as { key: SortKey; label: string; cls: string }[])"
                :key="col.key"
                class="cursor-pointer select-none px-2 py-1.5 text-right font-medium transition-colors hover:text-foreground"
                :class="[col.cls, sortKey === col.key ? 'opacity-100' : 'opacity-70']"
                @click="toggleSort(col.key)"
              >
                <span class="inline-flex items-center gap-0.5">
                  {{ col.label }}
                  <span v-if="sortKey === col.key" class="text-[8px]">{{ sortDir === 'desc' ? '▼' : '▲' }}</span>
                </span>
              </th>
              <th class="px-2 py-1.5 text-left font-medium">{{ $t('stock.brokerActivity.stockCol') }}</th>
              <th
                v-for="col in ([
                  { key: 'sVal', label: 'S.val', cls: 'text-red-400' },
                  { key: 'sLot', label: 'S.lot', cls: 'text-red-400' },
                  { key: 'sAvg', label: 'S.avg', cls: 'text-red-400' },
                ] as { key: SortKey; label: string; cls: string }[])"
                :key="col.key"
                class="cursor-pointer select-none px-2 py-1.5 text-right font-medium transition-colors hover:text-foreground"
                :class="[col.cls, sortKey === col.key ? 'opacity-100' : 'opacity-70']"
                @click="toggleSort(col.key)"
              >
                <span class="inline-flex items-center gap-0.5">
                  {{ col.label }}
                  <span v-if="sortKey === col.key" class="text-[8px]">{{ sortDir === 'desc' ? '▼' : '▲' }}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in sortedTable"
              :key="row.rank"
              class="border-b border-border/20 transition-colors hover:bg-accent/20"
              :class="i < 5 ? 'bg-accent/5' : ''"
            >
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.buyBroker }}</td>
              <td class="px-2 py-1.5 text-right" :class="sortKey === 'bVal' ? 'text-foreground font-semibold' : 'text-emerald-400'">{{ fmtVal(row.bVal) }}</td>
              <td class="px-2 py-1.5 text-right" :class="sortKey === 'bLot' ? 'text-foreground font-semibold' : 'text-emerald-400'">{{ fmtLot(row.bLot) }}</td>
              <td class="px-2 py-1.5 text-right" :class="sortKey === 'bAvg' ? 'text-foreground font-semibold' : 'text-emerald-400'">{{ fmtPrice(row.bAvg) }}</td>
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.sellBroker }}</td>
              <td class="px-2 py-1.5 text-right" :class="sortKey === 'sVal' ? 'text-foreground font-semibold' : 'text-red-400'">{{ fmtVal(row.sVal) }}</td>
              <td class="px-2 py-1.5 text-right" :class="sortKey === 'sLot' ? 'text-foreground font-semibold' : 'text-red-400'">{{ fmtLot(row.sLot) }}</td>
              <td class="px-2 py-1.5 text-right" :class="sortKey === 'sAvg' ? 'text-foreground font-semibold' : 'text-red-400'">{{ fmtPrice(row.sAvg) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── By-Broker view ── -->
    <template v-else>
      <!-- Broker selector -->
      <div class="relative z-20" @click.stop>
        <button
          class="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-sm transition-colors hover:bg-accent/30"
          @click.stop="showBrokerPicker = !showBrokerPicker; showInvestorPicker = false; showMarketPicker = false"
        >
          <span>
            <span class="font-bold text-violet-400">{{ selectedBroker }}</span>
            <span class="ml-2 text-foreground">- {{ BROKER_NAMES[selectedBroker] }}</span>
          </span>
          <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform" :class="showBrokerPicker ? 'rotate-180' : ''" />
        </button>
        <Transition name="dropdown">
          <div
            v-if="showBrokerPicker"
            class="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border/50 bg-background shadow-xl"
          >
            <button
              v-for="code in BROKER_CODES"
              :key="code"
              class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
              :class="selectedBroker === code ? 'bg-accent/30 text-foreground' : 'text-muted-foreground'"
              @click.stop="selectedBroker = code; showBrokerPicker = false"
            >
              <span class="w-8 font-bold text-violet-400">{{ code }}</span>
              <span class="truncate">{{ BROKER_NAMES[code] }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Filter dropdowns row -->
      <div class="flex gap-2" @click.stop>
        <div class="relative z-10 flex-1">
          <button
            class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-xs transition-colors hover:bg-accent/30"
            @click.stop="showInvestorPicker = !showInvestorPicker; showBrokerPicker = false; showMarketPicker = false"
          >
            <span class="text-foreground">{{ investorType }}</span>
            <ChevronDown class="h-3 w-3 shrink-0 text-muted-foreground" :class="showInvestorPicker ? 'rotate-180' : ''" />
          </button>
          <Transition name="dropdown">
            <div
              v-if="showInvestorPicker"
              class="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border/50 bg-background shadow-xl"
            >
              <button
                v-for="opt in INVESTOR_TYPES"
                :key="opt"
                class="flex w-full px-3 py-2 text-xs transition-colors hover:bg-accent/50"
                :class="investorType === opt ? 'bg-accent/30 font-semibold text-foreground' : 'text-muted-foreground'"
                @click.stop="investorType = opt; showInvestorPicker = false"
              >{{ opt }}</button>
            </div>
          </Transition>
        </div>

        <div class="relative z-10 flex-1">
          <button
            class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-xs transition-colors hover:bg-accent/30"
            @click.stop="showMarketPicker = !showMarketPicker; showBrokerPicker = false; showInvestorPicker = false"
          >
            <span class="text-foreground">{{ marketType }}</span>
            <ChevronDown class="h-3 w-3 shrink-0 text-muted-foreground" :class="showMarketPicker ? 'rotate-180' : ''" />
          </button>
          <Transition name="dropdown">
            <div
              v-if="showMarketPicker"
              class="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border/50 bg-background shadow-xl"
            >
              <button
                v-for="opt in MARKET_TYPES"
                :key="opt"
                class="flex w-full px-3 py-2 text-xs transition-colors hover:bg-accent/50"
                :class="marketType === opt ? 'bg-accent/30 font-semibold text-foreground' : 'text-muted-foreground'"
                @click.stop="marketType = opt; showMarketPicker = false"
              >{{ opt }}</button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-border/40">
        <table class="w-full min-w-[480px] text-[10px]">
          <thead>
            <tr class="border-b border-border/40 text-muted-foreground">
              <th class="px-2 py-1.5 text-left font-medium">{{ $t('stock.brokerActivity.brokerCol') }}</th>
              <th class="px-2 py-1.5 text-right font-medium text-emerald-400">B.val</th>
              <th class="px-2 py-1.5 text-right font-medium text-emerald-400">B.lot</th>
              <th class="px-2 py-1.5 text-right font-medium text-emerald-400">B.avg</th>
              <th class="px-2 py-1.5 text-left font-medium">{{ $t('stock.brokerActivity.stockCol') }}</th>
              <th class="px-2 py-1.5 text-right font-medium text-red-400">S.val</th>
              <th class="px-2 py-1.5 text-right font-medium text-red-400">S.lot</th>
              <th class="px-2 py-1.5 text-right font-medium text-red-400">S.avg</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in brokerRows"
              :key="row.rank"
              class="border-b border-border/20 transition-colors hover:bg-accent/20"
            >
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.stock }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtBVal(row.bVal) }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtBLot(row.bLot) }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtBAvg(row.bAvg) }}</td>
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.sStock }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtBVal(row.sVal) }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtBLot(row.sLot) }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtBAvg(row.sAvg) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
