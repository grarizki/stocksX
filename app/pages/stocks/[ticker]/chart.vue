<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import type { StockDetail } from "@/data/stocksData";

definePageMeta({ layout: "blank" });

const route = useRoute();
const localePath = useLocalePath();

const ticker = computed(() => {
	const raw = (route.params.ticker as string).toUpperCase();
	return raw.endsWith(".JK") ? raw : `${raw}.JK`;
});

const { data: stock } = useApiFetch<StockDetail>(
	() => `/api/stocks/${ticker.value}/summary`,
	{ watch: [ticker] },
);

useHead({
	title: computed(() =>
		stock.value
			? `${ticker.value.replace(".JK", "")} Chart - StoxLyz`
			: "Chart",
	),
});
</script>

<template>
  <div class="flex h-dvh flex-col bg-[#131722]">
    <!-- Top bar -->
    <div class="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-2.5">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="localePath(`/stocks/${ticker.replace('.JK', '')}`)"
          class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          Back
        </NuxtLink>
        <div class="h-4 w-px bg-white/10" />
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-white">{{ ticker.replace('.JK', '') }}</span>
          <span v-if="stock" class="text-xs text-white/40">{{ stock.name }}</span>
        </div>
        <template v-if="stock">
          <div class="h-4 w-px bg-white/10" />
          <span
            class="text-sm font-semibold"
            :class="stock.changePercent >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'"
          >
            {{ stock.price.toLocaleString() }}
          </span>
          <span
            class="text-xs font-medium"
            :class="stock.changePercent >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'"
          >
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </span>
        </template>
      </div>
    </div>

    <!-- Pro chart fills remaining height -->
    <div class="min-h-0 flex-1">
      <StockChartPro
        v-if="stock"
        :ticker="ticker"
        :change-percent="stock.changePercent"
      />
    </div>
  </div>
</template>
