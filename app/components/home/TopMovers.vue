<script setup lang="ts">
import { Activity, BarChart2, TrendingDown, TrendingUp } from "lucide-vue-next";
import type { Stock } from "@/data/stocks";
import { formatCompact } from "@/lib/utils";

const { t } = useI18n();
const activeTab = ref("gainers");

const tabs = computed(() => [
	{
		value: "gainers",
		label: t("home.gainers"),
		icon: TrendingUp,
		color: "text-gain",
	},
	{
		value: "losers",
		label: t("home.losers"),
		icon: TrendingDown,
		color: "text-loss",
	},
	{
		value: "volume",
		label: t("home.volume"),
		icon: BarChart2,
		color: "text-blue-400",
	},
	{
		value: "frequency",
		label: t("home.frequency"),
		icon: Activity,
		color: "text-yellow-400",
	},
]);

const { data: gainers, status: gainersStatus } = useApiFetch<Stock[]>(
	"/api/stocks/movers",
	{ query: { type: "gainers", limit: 5 } },
);
const { data: losers, status: losersStatus } = useApiFetch<Stock[]>(
	"/api/stocks/movers",
	{ query: { type: "losers", limit: 5 } },
);
const { data: volume, status: volumeStatus } = useApiFetch<Stock[]>(
	"/api/stocks/movers",
	{ query: { type: "volume", limit: 5 } },
);
const { data: frequency, status: frequencyStatus } = useApiFetch<Stock[]>(
	"/api/stocks/movers",
	{ query: { type: "frequency", limit: 5 } },
);

const currentStocks = computed<Stock[]>(() => {
	switch (activeTab.value) {
		case "gainers":
			return gainers.value ?? [];
		case "losers":
			return losers.value ?? [];
		case "volume":
			return volume.value ?? [];
		case "frequency":
			return frequency.value ?? [];
		default:
			return [];
	}
});

const isPending = computed(() => {
	switch (activeTab.value) {
		case "gainers":
			return gainersStatus.value === "pending";
		case "losers":
			return losersStatus.value === "pending";
		case "volume":
			return volumeStatus.value === "pending";
		case "frequency":
			return frequencyStatus.value === "pending";
		default:
			return false;
	}
});

const hoveredIdx = ref<number | null>(null);
</script>

<template>
  <section>
    <h2 class="mb-3 text-lg font-bold">{{ $t('home.topMovers') }}</h2>

    <!-- Tabs -->
    <div class="mb-3 flex gap-1.5 rounded-xl border border-border/30 bg-card/30 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200"
        :class="activeTab === tab.value
          ? 'bg-accent text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'"
        @click="activeTab = tab.value"
      >
        <component :is="tab.icon" class="h-3.5 w-3.5 shrink-0" :class="activeTab === tab.value && tab.color" />
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="isPending" class="overflow-hidden rounded-xl border border-border/30">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3 border-b border-border/20 p-3 last:border-0">
        <div class="h-4 w-4 animate-pulse rounded bg-muted/40" />
        <div class="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3 w-16 animate-pulse rounded bg-muted/40" />
          <div class="h-2.5 w-28 animate-pulse rounded bg-muted/40" />
        </div>
        <div class="h-8 w-14 animate-pulse rounded bg-muted/40" />
      </div>
    </div>

    <!-- Stock list -->
    <div v-else class="overflow-hidden rounded-xl border border-border/30">
      <NuxtLink
        v-for="(stock, i) in currentStocks"
        :key="stock.ticker"
        :to="`/stocks/${stock.ticker.replace('.JK', '')}`"
        class="flex items-center gap-3 border-b border-border/20 p-3 transition-all duration-200 last:border-0"
        :class="hoveredIdx === i ? 'bg-accent/40' : 'bg-transparent'"
        @mouseenter="hoveredIdx = i"
        @mouseleave="hoveredIdx = null"
      >
        <!-- Rank -->
        <span class="w-5 text-center text-xs font-bold text-muted-foreground">{{ i + 1 }}</span>

        <!-- Ticker avatar -->
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold transition-transform duration-200"
          :class="hoveredIdx === i && 'scale-110'"
        >
          {{ stock.ticker.replace('.JK', '') }}
        </div>

        <!-- Info -->
        <div class="flex-1 overflow-hidden">
          <span class="text-sm font-bold">{{ stock.ticker.replace('.JK', '') }}</span>
          <p class="truncate text-[11px] text-muted-foreground">{{ stock.name }}</p>
        </div>

        <!-- Volume tab metric -->
        <div v-if="activeTab === 'volume'" class="text-right">
          <p class="text-xs text-muted-foreground">{{ $t('home.vol') }}</p>
          <p class="text-sm font-bold tabular-nums">{{ formatCompact(stock.volume) }}</p>
        </div>

        <!-- Frequency tab metric -->
        <div v-if="activeTab === 'frequency'" class="text-right">
          <p class="text-xs text-muted-foreground">{{ $t('home.freq') }}</p>
          <p class="text-sm font-bold tabular-nums">{{ formatCompact(stock.frequency) }}</p>
        </div>

        <!-- Price & Change -->
        <div class="text-right">
          <p class="text-sm font-bold tabular-nums">{{ stock.price.toLocaleString('id-ID') }}</p>
          <p
            class="text-xs font-semibold tabular-nums"
            :class="stock.changePercent >= 0 ? 'text-gain' : 'text-loss'"
          >
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </p>
        </div>

        <!-- Micro bar -->
        <div class="h-8 w-1 rounded-full" :class="stock.changePercent >= 0 ? 'bg-gain/40' : 'bg-loss/40'">
          <div
            class="w-full rounded-full transition-all duration-500"
            :class="stock.changePercent >= 0 ? 'bg-gain' : 'bg-loss'"
            :style="{ height: `${Math.min(Math.abs(stock.changePercent) * 15, 100)}%` }"
          />
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
