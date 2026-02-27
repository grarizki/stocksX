<script setup lang="ts">
import { ArrowUpDown } from "lucide-vue-next";
import type { Stock } from "~/data/stocks";
import { useWatchlistStore } from "~/stores/watchlist";

const { t } = useI18n();

useHead({ title: computed(() => `${t("watchlist.title")} - StoxLyz`) });

const watchlistStore = useWatchlistStore();

type SortOption = "default" | "alpha" | "change" | "marketCap";
const sortBy = ref<SortOption>("default");

const tickersQuery = computed(() => watchlistStore.items.join(","));

const { data: fetchedStocks, status } = useApiFetch<Stock[]>(
	"/api/stocks/quotes",
	{
		query: computed(() => ({ tickers: tickersQuery.value })),
		watch: [tickersQuery],
	},
);

const watchedStocks = computed<Stock[]>(() => {
	const stocks = fetchedStocks.value ?? [];
	switch (sortBy.value) {
		case "alpha":
			return [...stocks].sort((a, b) => a.ticker.localeCompare(b.ticker));
		case "change":
			return [...stocks].sort((a, b) => b.changePercent - a.changePercent);
		case "marketCap":
			return [...stocks].sort((a, b) => b.marketCap - a.marketCap);
		default:
			return stocks;
	}
});
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ $t('watchlist.title') }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ $t('watchlist.stockCount', { n: watchedStocks.length }) }}
        </p>
      </div>

      <DropdownMenu v-if="watchlistStore.items.length > 0">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
            <ArrowUpDown class="h-3 w-3" />
            {{ $t('watchlist.sort') }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="sortBy = 'default'">{{ $t('watchlist.sortDefault') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'alpha'">{{ $t('watchlist.sortAlpha') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'change'">{{ $t('watchlist.sortChange') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'marketCap'">{{ $t('watchlist.sortMarketCap') }}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending' && watchlistStore.items.length > 0" class="space-y-2">
      <div v-for="i in watchlistStore.items.length" :key="i" class="h-16 animate-pulse rounded-lg border border-border/30 bg-muted/20" />
    </div>

    <div v-else-if="watchedStocks.length > 0" class="space-y-2">
      <WatchlistCard
        v-for="stock in watchedStocks"
        :key="stock.ticker"
        :stock="stock"
        class="animate-slide-up"
        @remove="(ticker) => watchlistStore.removeFromWatchlist(ticker)"
      />
    </div>
    <WatchlistEmpty v-else />
  </div>
</template>
