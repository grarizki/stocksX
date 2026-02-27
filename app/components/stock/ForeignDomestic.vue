<script setup lang="ts">
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	LinearScale,
	Tooltip,
} from "chart.js";
import { Bar } from "vue-chartjs";
import { getForeignDomestic } from "@/data/brokerActivity";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps<{ ticker: string }>();

type Range = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y";
const RANGES: Range[] = ["1D", "1W", "1M", "3M", "YTD", "1Y"];
const activeRange = ref<Range>("1D");

type FDMarket = "Regular" | "All Market";
type FDMetric = "Value" | "Volume";
const FD_MARKETS: FDMarket[] = ["Regular", "All Market"];
const FD_METRICS: FDMetric[] = ["Value", "Volume"];
const fdMarket = ref<FDMarket>("Regular");
const fdMetric = ref<FDMetric>("Value");

const fdData = computed(() =>
	getForeignDomestic(props.ticker, activeRange.value, fdMarket.value),
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
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold">Foreign-Domestic Activity</h3>

    <!-- Range tabs -->
    <div class="flex gap-1 overflow-x-auto scrollbar-none">
      <button
        v-for="r in RANGES"
        :key="r"
        class="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="activeRange === r ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="activeRange = r"
      >{{ r }}</button>
    </div>

    <div class="rounded-xl border border-border/40 bg-card/50 p-3 space-y-3">
      <!-- Market toggle -->
      <div class="flex items-center justify-between">
        <div class="flex rounded-lg border border-border/50 p-0.5 text-[10px] font-medium">
          <button
            v-for="m in FD_MARKETS"
            :key="m"
            class="rounded-md px-2 py-0.5 transition-colors"
            :class="fdMarket === m ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="fdMarket = m"
          >{{ m }}</button>
        </div>
        <!-- Value / Volume toggle -->
        <div class="flex rounded-lg border border-border/50 p-0.5 text-[10px] font-medium">
          <button
            v-for="mt in FD_METRICS"
            :key="mt"
            class="rounded-md px-3 py-1 transition-colors"
            :class="fdMetric === mt ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="fdMetric = mt"
          >{{ mt }}</button>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="flex justify-between">
          <span class="text-muted-foreground">F Buy</span>
          <span class="font-semibold text-cyan-400">{{ fmtFD(fdIsValue ? fdData.fBuy : fdData.fBuyVol, fdIsValue) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">F Sell</span>
          <span class="font-semibold text-red-400">{{ fmtFD(fdIsValue ? fdData.fSell : fdData.fSellVol, fdIsValue) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">D Buy</span>
          <span class="font-semibold text-violet-400">{{ fmtFD(fdIsValue ? fdData.dBuy : fdData.dBuyVol, fdIsValue) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">D Sell</span>
          <span class="font-semibold text-red-400/80">{{ fmtFD(fdIsValue ? fdData.dSell : fdData.dSellVol, fdIsValue) }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs border-t border-border/30 pt-2">
        <span class="text-muted-foreground">Net Foreign</span>
        <span
          class="font-bold"
          :class="(fdIsValue ? fdData.netForeign : fdData.netForeignVol) >= 0 ? 'text-cyan-400' : 'text-red-400'"
        >{{ (fdIsValue ? fdData.netForeign : fdData.netForeignVol) >= 0 ? '+' : '' }}{{ fmtFD(fdIsValue ? fdData.netForeign : fdData.netForeignVol, fdIsValue) }}</span>
      </div>

      <!-- Bar chart -->
      <div class="h-40 w-full">
        <Bar :data="fdBarData" :options="fdBarOptions" />
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-cyan-500/70" />Foreign</span>
        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-sm bg-violet-600/70" />Domestic</span>
        <span class="flex items-center gap-1"><span class="inline-block h-2.5 w-2.5 rounded-sm border border-border/60 bg-muted/40 opacity-60" />Buy (light) / Sell (dark)</span>
      </div>

      <!-- F/D percentage bar -->
      <div class="flex overflow-hidden rounded-lg text-[10px] font-semibold">
        <div
          class="flex items-center justify-center gap-1 bg-cyan-500/20 py-1.5 text-cyan-400 transition-all"
          :style="{ width: fdForeignPct + '%' }"
        >
          <span>Foreign</span>
          <span>{{ fdForeignPct }}%</span>
        </div>
        <div
          class="flex items-center justify-center gap-1 bg-violet-500/20 py-1.5 text-violet-400 transition-all"
          :style="{ width: fdDomesticPct + '%' }"
        >
          <span>Domestic</span>
          <span>{{ fdDomesticPct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
