<script setup lang="ts">
import type { Stock } from "@/data/stocks";
import { useWatchlistStore } from "~/stores/watchlist";

const { t } = useI18n();
const localePath = useLocalePath();
const watchlistStore = useWatchlistStore();

const tickersQuery = computed(() => watchlistStore.items.join(","));

const { data: fetchedStocks, status } = useApiFetch<Stock[]>(
	"/api/stocks/quotes",
	{
		query: computed(() => ({ tickers: tickersQuery.value })),
		watch: [tickersQuery],
	},
);

const stocks = computed<Stock[]>(() => fetchedStocks.value ?? []);
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-bold">{{ $t('watchlist.title') }}</h2>
      <NuxtLink
        :to="localePath('/watchlist')"
        class="text-xs font-medium text-blue-500 hover:underline"
      >
        {{ $t('home.seeAll') }}
      </NuxtLink>
    </div>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending' && watchlistStore.items.length > 0" class="overflow-hidden rounded-xl border border-border/30">
      <div v-for="i in Math.min(watchlistStore.items.length, 5)" :key="i" class="flex items-center gap-3 border-b border-border/20 p-3 last:border-0">
        <div class="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3 w-16 animate-pulse rounded bg-muted/40" />
          <div class="h-2.5 w-28 animate-pulse rounded bg-muted/40" />
        </div>
        <div class="h-8 w-14 animate-pulse rounded bg-muted/40" />
      </div>
    </div>

    <!-- Watchlist stocks -->
    <div v-else-if="stocks.length > 0" class="overflow-hidden rounded-xl border border-border/30">
      <NuxtLink
        v-for="stock in stocks.slice(0, 5)"
        :key="stock.ticker"
        :to="localePath(`/stocks/${stock.ticker.replace('.JK', '')}`)"
        class="flex items-center gap-3 border-b border-border/20 p-3 transition-colors last:border-0 hover:bg-accent/40"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
          {{ stock.ticker.slice(0, 2) }}
        </div>
        <div class="flex-1 overflow-hidden">
          <p class="text-sm font-bold">{{ stock.ticker.replace('.JK', '') }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ stock.name }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold tabular-nums">{{ stock.price.toLocaleString('id-ID') }}</p>
          <p
            class="text-xs font-semibold tabular-nums"
            :class="stock.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'"
          >
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </p>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else class="rounded-xl border border-dashed border-border/50 py-8 text-center">
      <p class="text-sm font-medium text-muted-foreground">{{ $t('watchlist.emptyTitle') }}</p>
      <NuxtLink :to="localePath('/stocks')" class="mt-2 inline-block text-xs text-blue-500 hover:underline">
        {{ $t('watchlist.browseStocks') }}
      </NuxtLink>
    </div>
  </section>
</template>
