<script setup lang="ts">
import { X } from "lucide-vue-next";
import type { BrokerSummaryRow } from "@/data/brokerActivity";
import { getBrokerSummary } from "@/data/brokerActivity";

const props = defineProps<{
	ticker: string;
	range: string;
	showNet?: boolean;
}>();
const open = defineModel<boolean>("open", { default: false });

type SortKey = "bVal" | "bLot" | "sVal" | "sLot" | "netVal" | "netLot";
type SortDir = "asc" | "desc";

const sortKey = ref<SortKey>("bVal");
const sortDir = ref<SortDir>("desc");

watch(
	() => props.showNet,
	(isNet) => {
		sortKey.value = isNet ? "netVal" : "bVal";
		sortDir.value = "desc";
	},
);

function toggleSort(key: SortKey) {
	if (sortKey.value === key) {
		sortDir.value = sortDir.value === "desc" ? "asc" : "desc";
	} else {
		sortKey.value = key;
		sortDir.value = "desc";
	}
}

const rows = computed<BrokerSummaryRow[]>(() => {
	const raw = getBrokerSummary(props.ticker, props.range as any);
	return [...raw].sort((a, b) => {
		const va = a[sortKey.value];
		const vb = b[sortKey.value];
		return sortDir.value === "desc" ? vb - va : va - vb;
	});
});

// Max values for bar scaling — use the same scale for buy and sell so bars are comparable
const maxGross = computed(() =>
	Math.max(...rows.value.map((r) => Math.max(r.bVal, r.sVal))),
);
const maxAbsNet = computed(() =>
	Math.max(...rows.value.map((r) => Math.abs(r.netVal))),
);

// Each half of the diverging bar is at most 50% wide
function halfBarPct(val: number, max: number) {
	return max === 0 ? 0 : Math.min(50, (val / max) * 50);
}
function netBarPct(val: number, max: number) {
	return max === 0 ? 0 : Math.min(50, (Math.abs(val) / max) * 50);
}

function fmtVal(v: number) {
	return `${v.toFixed(1)}B`;
}
function fmtLot(v: number) {
	if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
	if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
	return String(v);
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
	{ key: "bVal", label: "Buy Val" },
	{ key: "bLot", label: "Buy Lot" },
	{ key: "sVal", label: "Sell Val" },
	{ key: "sLot", label: "Sell Lot" },
	{ key: "netVal", label: "Net Val" },
	{ key: "netLot", label: "Net Lot" },
];

// Total aggregates
const totalBuy = computed(() => rows.value.reduce((s, r) => s + r.bVal, 0));
const totalSell = computed(() => rows.value.reduce((s, r) => s + r.sVal, 0));
const totalNet = computed(() => rows.value.reduce((s, r) => s + r.netVal, 0));
const totalNetLot = computed(() =>
	rows.value.reduce((s, r) => s + r.netLot, 0),
);

onMounted(() => {
	const handler = (e: KeyboardEvent) => {
		if (e.key === "Escape") open.value = false;
	};
	document.addEventListener("keydown", handler);
	onUnmounted(() => document.removeEventListener("keydown", handler));
});
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        @click="open = false"
      />
    </Transition>

    <!-- Sidebar panel -->
    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-sm flex-col border-l border-border/50 bg-background shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <h2 class="text-sm font-bold">Broker Summary</h2>
            <p class="text-[10px] text-muted-foreground">{{ ticker }} · {{ range }} · {{ showNet ? 'Net buying' : 'Gross buying' }}</p>
          </div>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            @click="open = false"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Totals bar -->
        <div class="grid grid-cols-4 gap-px border-b border-border/40 bg-border/20">
          <div class="bg-background px-2 py-2 text-center">
            <p class="text-[9px] text-muted-foreground">Buy</p>
            <p class="text-[11px] font-bold text-emerald-400">{{ fmtVal(totalBuy) }}</p>
          </div>
          <div class="bg-background px-2 py-2 text-center">
            <p class="text-[9px] text-muted-foreground">Sell</p>
            <p class="text-[11px] font-bold text-red-400">{{ fmtVal(totalSell) }}</p>
          </div>
          <div class="bg-background px-2 py-2 text-center">
            <p class="text-[9px] text-muted-foreground">Net val</p>
            <p class="text-[11px] font-bold" :class="totalNet >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ totalNet >= 0 ? '+' : '' }}{{ fmtVal(totalNet) }}
            </p>
          </div>
          <div class="bg-background px-2 py-2 text-center">
            <p class="text-[9px] text-muted-foreground">Net lot</p>
            <p class="text-[11px] font-bold" :class="totalNetLot >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ totalNetLot >= 0 ? '+' : '' }}{{ fmtLot(totalNetLot) }}
            </p>
          </div>
        </div>

        <!-- Sort chips -->
        <div class="flex gap-1 overflow-x-auto border-b border-border/40 px-3 py-2 scrollbar-none">
          <button
            v-for="opt in SORT_OPTIONS"
            :key="opt.key"
            class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors"
            :class="sortKey === opt.key
              ? 'bg-blue-500 text-white'
              : 'bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground'"
            @click="toggleSort(opt.key)"
          >
            {{ opt.label }}
            <span v-if="sortKey === opt.key" class="ml-0.5">{{ sortDir === 'desc' ? '▼' : '▲' }}</span>
          </button>
        </div>

        <!-- Broker list -->
        <div class="flex-1 overflow-y-auto">
          <!-- Column labels above bar -->
          <div class="sticky top-0 z-10 flex items-center border-b border-border/20 bg-background px-3 py-1.5">
            <span class="w-10 shrink-0 text-[9px] text-muted-foreground">Rank</span>
            <span class="w-14 shrink-0 text-right text-[9px] text-emerald-400">Buy</span>
            <div class="flex flex-1 items-center justify-center gap-px">
              <span class="w-1/2 text-right text-[9px] text-emerald-400/60 pr-1">buy</span>
              <div class="h-3 w-px bg-border/60" />
              <span class="w-1/2 text-left text-[9px] text-red-400/60 pl-1">sell</span>
            </div>
            <span class="w-14 shrink-0 text-left text-[9px] text-red-400">Sell</span>
          </div>

          <div
            v-for="(row, i) in rows"
            :key="row.broker"
            class="border-b border-border/10 px-3 py-2.5 transition-colors hover:bg-accent/20"
          >
            <!-- Top row: rank + broker + net badge -->
            <div class="mb-1.5 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span
                  class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[8px] font-bold"
                  :class="i < 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-muted/50 text-muted-foreground'"
                >{{ i + 1 }}</span>
                <span class="text-xs font-bold text-foreground">{{ row.broker }}</span>
              </div>
              <!-- Net badge -->
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                :class="row.netVal >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'"
              >
                {{ row.netVal >= 0 ? '+' : '' }}{{ fmtVal(row.netVal) }} net
              </span>
            </div>

            <!-- Diverging bar row -->
            <div class="flex items-center gap-1">
              <!-- Buy value label -->
              <span class="w-14 shrink-0 text-right text-[10px] font-medium text-emerald-400">{{ fmtVal(row.bVal) }}</span>

              <!-- Bar track -->
              <div class="relative flex flex-1 overflow-hidden rounded-full bg-muted/20" style="height: 8px;">
                <!-- Center line -->
                <div class="absolute inset-y-0 left-1/2 w-px bg-border/60 z-10" />

                <!-- Gross mode: green fills left from center, red fills right from center -->
                <template v-if="!showNet">
                  <!-- Buy bar: grows leftward from center -->
                  <div
                    class="absolute right-1/2 top-0 h-full rounded-l-full bg-emerald-500/70 transition-all duration-300"
                    :style="{ width: `${halfBarPct(row.bVal, maxGross)}%` }"
                  />
                  <!-- Sell bar: grows rightward from center -->
                  <div
                    class="absolute left-1/2 top-0 h-full rounded-r-full bg-red-500/70 transition-all duration-300"
                    :style="{ width: `${halfBarPct(row.sVal, maxGross)}%` }"
                  />
                </template>

                <!-- Net mode: green/red from center depending on sign -->
                <template v-else>
                  <div
                    class="absolute top-0 h-full rounded-full transition-all duration-300"
                    :class="row.netVal >= 0 ? 'right-1/2 bg-emerald-500/80 rounded-l-full' : 'left-1/2 bg-red-500/80 rounded-r-full'"
                    :style="{ width: `${netBarPct(row.netVal, maxAbsNet)}%` }"
                  />
                </template>
              </div>

              <!-- Sell value label -->
              <span class="w-14 shrink-0 text-left text-[10px] font-medium text-red-400">{{ fmtVal(row.sVal) }}</span>
            </div>

            <!-- Bottom row: lot details -->
            <div class="mt-1 flex items-center justify-between px-0.5 text-[9px] text-muted-foreground">
              <span class="text-emerald-400/70">{{ fmtLot(row.bLot) }} lot</span>
              <span :class="row.netLot >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'">
                {{ row.netLot >= 0 ? '+' : '' }}{{ fmtLot(row.netLot) }} net lot
              </span>
              <span class="text-red-400/70">{{ fmtLot(row.sLot) }} lot</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
