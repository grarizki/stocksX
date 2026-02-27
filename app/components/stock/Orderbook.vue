<script setup lang="ts">
import { formatCompact } from "@/lib/utils";

const props = defineProps<{
	ticker: string;
	price: number;
	change: number;
	volume: number;
	high52w: number;
	low52w: number;
	pe: number;
	pbv: number;
	dividendYield: number;
	marketCap: number;
}>();

// Seeded PRNG for deterministic ladder data
function seededRand(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) & 0xffffffff;
		return (s >>> 0) / 0xffffffff;
	};
}

const tickerSeed = props.ticker
	.split("")
	.reduce((a, c) => a + c.charCodeAt(0), 0);

// ── Today's OHLC from real API ─────────────────────────────────────────────────
interface OHLCVBar {
	time: number | string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}
const { data: historyData } = useApiFetch<OHLCVBar[]>(
	`/api/stocks/${props.ticker}/history?range=1W`,
);

const open = computed(() => historyData.value?.at(-1)?.open ?? props.price);
const prevClose = computed(
	() => historyData.value?.at(-2)?.close ?? props.price - props.change,
);
const high = computed(() => historyData.value?.at(-1)?.high ?? props.price);
const low = computed(() => historyData.value?.at(-1)?.low ?? props.price);

const ara = computed(() => Math.round(prevClose.value * 1.35));
const arb = computed(() => Math.round(prevClose.value * 0.7));

const lot = computed(() => formatCompact(props.volume / 100));
const val = computed(() => formatCompact(props.volume * props.price));
const avg = computed(() => Math.round((open.value + props.price) / 2));
const freq = computed(() => formatCompact(Math.round(props.volume / 450)));
const fBuy = computed(() =>
	formatCompact(Math.round(props.volume * props.price * 0.38)),
);
const fSell = computed(() =>
	formatCompact(Math.round(props.volume * props.price * 0.51)),
);

const statsRows = computed(() => [
	[
		{ label: "Open", value: open.value.toLocaleString(), color: "" },
		{ label: "Prev", value: prevClose.value.toLocaleString(), color: "" },
		{ label: "Lot", value: lot.value, color: "text-gain" },
	],
	[
		{ label: "High", value: high.value.toLocaleString(), color: "text-gain" },
		{ label: "ARA", value: ara.value.toLocaleString(), color: "" },
		{ label: "Val", value: val.value, color: "text-gain" },
	],
	[
		{ label: "Low", value: low.value.toLocaleString(), color: "text-loss" },
		{ label: "ARB", value: arb.value.toLocaleString(), color: "" },
		{ label: "Avg", value: avg.value.toLocaleString(), color: "text-gain" },
	],
	[
		{ label: "F Buy", value: fBuy.value, color: "text-gain" },
		{ label: "F Sell", value: fSell.value, color: "text-loss" },
		{ label: "Freq", value: freq.value, color: "text-gain" },
	],
]);

// ── Bid/Ask Ladder ────────────────────────────────────────────────────────────
// IDX tick size rules (simplified)
function tickSize(p: number): number {
	if (p < 200) return 1;
	if (p < 500) return 2;
	if (p < 2000) return 5;
	if (p < 5000) return 10;
	return 25;
}

type LadderRow = {
	bidFreq: number;
	bidLot: number;
	bid: number;
	ask: number;
	askLot: number;
	askFreq: number;
};

const ladder = computed<LadderRow[]>(() => {
	const rand = seededRand(tickerSeed);
	const tick = tickSize(props.price);
	// Best bid just below current price, best ask just above
	const bestBid = props.price - tick;
	const bestAsk = props.price + tick;

	return Array.from({ length: 10 }, (_, i) => {
		const bid = bestBid - i * tick;
		const ask = bestAsk + i * tick;
		// More volume near the spread, less further out
		const proximity = 1 / (i + 1);
		const bidLot = Math.round((rand() * 800 + 50) * proximity);
		const askLot = Math.round((rand() * 800 + 50) * proximity);
		const bidFreq = Math.round(rand() * 40 * proximity + 1);
		const askFreq = Math.round(rand() * 40 * proximity + 1);
		return { bidFreq, bidLot, bid, ask, askLot, askFreq };
	});
});

// Max lot across all rows — for proportional volume bar widths
const maxLot = computed(() =>
	Math.max(...ladder.value.flatMap((r) => [r.bidLot, r.askLot])),
);

const totalBidLot = computed(() =>
	ladder.value.reduce((s, r) => s + r.bidLot, 0),
);
const totalAskLot = computed(() =>
	ladder.value.reduce((s, r) => s + r.askLot, 0),
);
const totalBidFreq = computed(() =>
	ladder.value.reduce((s, r) => s + r.bidFreq, 0),
);
const totalAskFreq = computed(() =>
	ladder.value.reduce((s, r) => s + r.askFreq, 0),
);

function lotWidth(lot: number) {
	return `${Math.min(100, (lot / maxLot.value) * 100)}%`;
}
</script>

<template>
  <div class="space-y-3">
    <!-- Stats grid: Open/Prev/Lot … F.Buy/F.Sell/Freq -->
    <div class="rounded-2xl border border-border/50 bg-card/80 p-3 backdrop-blur-xl">
      <div class="space-y-1.5">
        <div
          v-for="(row, ri) in statsRows"
          :key="ri"
          class="grid grid-cols-3 gap-1.5"
        >
          <div
            v-for="cell in row"
            :key="cell.label"
            class="flex items-center justify-between rounded-lg bg-muted/20 px-2 py-1.5"
          >
            <span class="text-[10px] text-muted-foreground">{{ cell.label }}</span>
            <span class="text-xs font-semibold" :class="cell.color || 'text-foreground'">
              {{ cell.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- 52-week range bar -->
      <div class="mt-3">
        <div class="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>52W Low: {{ low52w.toLocaleString() }}</span>
          <span>52W High: {{ high52w.toLocaleString() }}</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-muted/40">
          <div
            class="h-1.5 rounded-full bg-blue-500"
            :style="{ width: `${Math.min(100, Math.max(0, ((price - low52w) / (high52w - low52w)) * 100))}%` }"
          />
        </div>
        <div class="mt-0.5 text-center text-[10px] text-muted-foreground">
          Current: {{ price.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- Bid / Ask Ladder -->
    <div class="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
      <!-- Column headers -->
      <div class="grid grid-cols-[2.5rem_3.5rem_1fr_1fr_3.5rem_2.5rem] border-b border-border/40 px-2 py-2 text-[10px] font-semibold text-muted-foreground">
        <span class="text-center">Freq</span>
        <span class="text-right">Lot</span>
        <span class="text-right pr-2">Bid</span>
        <span class="text-left pl-2">Ask</span>
        <span class="text-left">Lot</span>
        <span class="text-center">Freq</span>
      </div>

      <!-- Ladder rows -->
      <div
        v-for="(row, i) in ladder"
        :key="i"
        class="grid grid-cols-[2.5rem_3.5rem_1fr_1fr_3.5rem_2.5rem] items-center border-b border-border/10 text-[11px]"
        :class="i === 0 ? 'bg-muted/10' : ''"
      >
        <!-- Bid Freq -->
        <span class="py-1.5 text-center text-blue-400">{{ row.bidFreq }}</span>

        <!-- Bid Lot with red bar behind (right-aligned bar) -->
        <div class="relative py-1.5 text-right">
          <div
            class="absolute right-0 top-0 h-full rounded-sm bg-loss/15"
            :style="{ width: lotWidth(row.bidLot) }"
          />
          <span class="relative z-10 pr-1 text-foreground">{{ row.bidLot.toLocaleString() }}</span>
        </div>

        <!-- Bid Price -->
        <div class="py-1.5 text-right pr-2">
          <span class="font-semibold text-loss">{{ row.bid.toLocaleString() }}</span>
        </div>

        <!-- Ask Price -->
        <div class="py-1.5 text-left pl-2">
          <span class="font-semibold text-gain">{{ row.ask.toLocaleString() }}</span>
        </div>

        <!-- Ask Lot with green bar behind (left-aligned bar) -->
        <div class="relative py-1.5">
          <div
            class="absolute left-0 top-0 h-full rounded-sm bg-gain/15"
            :style="{ width: lotWidth(row.askLot) }"
          />
          <span class="relative z-10 pl-1 text-foreground">{{ row.askLot.toLocaleString() }}</span>
        </div>

        <!-- Ask Freq -->
        <span class="py-1.5 text-center text-blue-400">{{ row.askFreq }}</span>
      </div>

      <!-- Totals row -->
      <div class="grid grid-cols-[2.5rem_3.5rem_1fr_1fr_3.5rem_2.5rem] items-center border-t border-border/40 bg-muted/10 px-0 py-2 text-[11px] font-bold">
        <span class="text-center text-blue-400">{{ totalBidFreq }}</span>
        <span class="text-right pr-1 text-foreground">{{ totalBidLot.toLocaleString() }}</span>
        <span class="pr-2 text-right text-muted-foreground text-[9px] font-normal">Total</span>
        <span class="pl-2 text-left text-muted-foreground text-[9px] font-normal">Total</span>
        <span class="pl-1 text-foreground">{{ totalAskLot.toLocaleString() }}</span>
        <span class="text-center text-blue-400">{{ totalAskFreq }}</span>
      </div>
    </div>
  </div>
</template>
