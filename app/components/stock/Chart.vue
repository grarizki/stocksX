<script setup lang="ts">
import {
	AreaSeries,
	createChart,
	type IChartApi,
	type ISeriesApi,
	type LineData,
	type UTCTimestamp,
} from "lightweight-charts";

const props = defineProps<{
	ticker: string;
	changePercent: number;
	height?: string;
}>();

type Range = "1M" | "3M" | "YTD" | "1Y" | "3Y" | "5Y";
const RANGES: Range[] = ["1M", "3M", "YTD", "1Y", "3Y", "5Y"];
const activeRange = ref<Range>("1Y");

const chartEl = ref<HTMLElement | null>(null);
let chart: IChartApi | null = null;
let series: ISeriesApi<"Area"> | null = null;

const lineColor = computed(() =>
	props.changePercent >= 0 ? "#26a69a" : "#ef5350",
);

const { data: historyData, pending } = useApiFetch<
	{ time: string | number; close: number }[]
>(() => `/api/stocks/${props.ticker}/history?range=${activeRange.value}`, {
	watch: [activeRange],
});

function buildChart() {
	if (!chartEl.value) return;
	const heightPx = chartEl.value.clientHeight || 520;

	chart = createChart(chartEl.value, {
		width: chartEl.value.clientWidth,
		height: heightPx,
		layout: {
			background: { color: "#131722" },
			textColor: "#d1d4dc",
		},
		grid: {
			vertLines: { color: "#1e2330" },
			horzLines: { color: "#1e2330" },
		},
		crosshair: { mode: 1 },
		rightPriceScale: { borderColor: "#2a2e39" },
		timeScale: { borderColor: "#2a2e39", timeVisible: true },
	});

	series = chart.addSeries(AreaSeries, {
		lineColor: lineColor.value,
		topColor: lineColor.value + "40",
		bottomColor: lineColor.value + "00",
		lineWidth: 2,
		priceLineVisible: false,
	});
}

function updateData() {
	if (!series || !historyData.value?.length) return;
	const points: LineData[] = historyData.value.map((d) => ({
		time: (typeof d.time === "string" ? d.time : d.time) as UTCTimestamp,
		value: d.close,
	}));
	series.setData(points);
	chart?.timeScale().fitContent();
}

onMounted(() => {
	buildChart();
	updateData();

	const ro = new ResizeObserver(() => {
		if (chart && chartEl.value) {
			chart.applyOptions({
				width: chartEl.value.clientWidth,
				height: chartEl.value.clientHeight,
			});
		}
	});
	if (chartEl.value) ro.observe(chartEl.value);
});

watch(historyData, updateData);

watch(lineColor, (color) => {
	series?.applyOptions({
		lineColor: color,
		topColor: color + "40",
		bottomColor: color + "00",
	});
});

watch(
	() => props.ticker,
	async () => {
		await nextTick();
		series?.setData([]);
	},
);

onUnmounted(() => {
	chart?.remove();
});
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-border/50 bg-[#131722]">
    <!-- Range selector -->
    <div class="flex items-center gap-1 px-4 pt-3">
      <button
        v-for="r in RANGES"
        :key="r"
        class="rounded px-2.5 py-1 text-xs font-medium transition-colors"
        :class="activeRange === r
          ? 'bg-white/10 text-white'
          : 'text-white/40 hover:text-white/70'"
        @click="activeRange = r"
      >
        {{ r }}
      </button>
    </div>

    <!-- Chart area -->
    <div
      class="relative"
      :style="{ height: props.height ? `calc(${props.height} - 40px)` : '480px' }"
    >
      <div ref="chartEl" class="h-full w-full" />
      <div
        v-if="pending"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      </div>
    </div>
  </div>
</template>
