<script setup lang="ts">
import { StarFilledIcon, StarIcon } from "@radix-icons/vue";
import {
	Search,
	SlidersHorizontal,
	Star,
	StarOff,
	TrendingDown,
	TrendingUp,
} from "lucide-vue-next";
import type { Stock } from "@/data/stocks";
import { formatCompact, formatNumber } from "@/lib/utils";
import { useWatchlistStore } from "~/stores/watchlist";

const { t } = useI18n();
const localePath = useLocalePath();
useHead({ title: computed(() => `${t("stocks.title")} - StoxLyz`) });

const SECTOR_ID: Record<string, string> = {
	All: "Semua",
	Financials: "Keuangan",
	Infrastructure: "Infrastruktur",
	"Consumer Cyclicals": "Konsumer Siklikal",
	"Consumer Non-Cyclicals": "Konsumer Primer",
	Technology: "Teknologi",
	Energy: "Energi",
	"Basic Materials": "Material Dasar",
	"Health Care": "Kesehatan",
	"Properties & Real Estate": "Properti",
};

const watchlistStore = useWatchlistStore();

const { data: allStocks, status } = useApiFetch<Stock[]>("/api/stocks/quotes");

// Unique sectors from data
const sectors = computed(() => {
	const s = new Set(allStocks.value?.map((s) => s.sector) ?? []);
	return ["All", ...Array.from(s).sort()];
});

const search = ref("");
const selectedSector = ref("All");
type SortKey = "default" | "change" | "price" | "marketCap" | "volume";
const sortBy = ref<SortKey>("default");

const debouncedSearch = ref("");
let debounceTimer: ReturnType<typeof setTimeout>;
watch(search, (val) => {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debouncedSearch.value = val.trim();
	}, 300);
});

// When search has a query, fetch matching stubs from the full 905-stock list
const { data: searchResults } = useApiFetch<{ ticker: string; name: string }[]>(
	"/api/stocks/search",
	{
		query: computed(() => ({ q: debouncedSearch.value })),
		watch: [debouncedSearch],
	},
);

const filtered = computed<
	(Stock | { ticker: string; name: string; _stub?: true })[]
>(() => {
	const q = debouncedSearch.value.toLowerCase();

	if (q) {
		// Stocks from quotes API that match
		const liveMatches = (allStocks.value ?? []).filter(
			(s) =>
				s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
		);
		const liveTickerSet = new Set(liveMatches.map((s) => s.ticker));

		// Stub entries from full IDX list that aren't in the live set
		const stubs = (searchResults.value ?? [])
			.filter((r) => !liveTickerSet.has(r.ticker))
			.map((r) => ({ ...r, _stub: true as const }));

		return [...liveMatches, ...stubs];
	}

	let list = allStocks.value ?? [];

	if (selectedSector.value !== "All") {
		list = list.filter((s) => s.sector === selectedSector.value);
	}

	switch (sortBy.value) {
		case "change":
			return [...list].sort((a, b) => b.changePercent - a.changePercent);
		case "price":
			return [...list].sort((a, b) => b.price - a.price);
		case "marketCap":
			return [...list].sort((a, b) => b.marketCap - a.marketCap);
		case "volume":
			return [...list].sort((a, b) => b.volume - a.volume);
		default:
			return list;
	}
});

const gainers = computed(
	() => (allStocks.value ?? []).filter((s) => s.changePercent > 0).length,
);
const losers = computed(
	() => (allStocks.value ?? []).filter((s) => s.changePercent < 0).length,
);
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-2xl font-bold">{{ $t('stocks.title') }}</h1>
      <p class="text-sm text-muted-foreground">{{ $t('stocks.subtitle') }}</p>
    </div>

    <!-- Market summary bar -->
    <div v-if="status !== 'pending'" class="mb-4 flex items-center gap-3 rounded-xl border border-border/30 bg-card/60 px-4 py-2.5">
      <span class="text-xs text-muted-foreground">{{ allStocks?.length ?? 0 }} {{ $t('stocks.listed') }}</span>
      <span class="text-border/60">·</span>
      <div class="flex items-center gap-1 text-xs font-semibold text-gain">
        <TrendingUp class="h-3.5 w-3.5" />
        {{ gainers }} {{ $t('stocks.up') }}
      </div>
      <span class="text-border/60">·</span>
      <div class="flex items-center gap-1 text-xs font-semibold text-loss">
        <TrendingDown class="h-3.5 w-3.5" />
        {{ losers }} {{ $t('stocks.down') }}
      </div>
    </div>

    <!-- Search + Sort -->
    <div class="mb-3 flex gap-2">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="search"
          type="search"
          :placeholder="$t('stocks.searchPlaceholder')"
          class="h-9 w-full rounded-lg border border-border/50 bg-background pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-9 gap-1.5 shrink-0">
            <SlidersHorizontal class="h-3.5 w-3.5" />
            {{ $t('watchlist.sort') }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="sortBy = 'default'">{{ $t('watchlist.sortDefault') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'change'">{{ $t('watchlist.sortChange') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'price'">{{ $t('stocks.sortPrice') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'marketCap'">{{ $t('watchlist.sortMarketCap') }}</DropdownMenuItem>
          <DropdownMenuItem @click="sortBy = 'volume'">{{ $t('stocks.sortVolume') }}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Sector filter chips -->
    <div class="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="sector in sectors"
        :key="sector"
        class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="selectedSector === sector
          ? 'bg-blue-500 text-white'
          : 'border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground'"
        @click="selectedSector = sector"
      >
        {{ SECTOR_ID[sector] ?? sector }}
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="status === 'pending'" class="space-y-2">
      <div v-for="i in 10" :key="i" class="h-16 animate-pulse rounded-lg border border-border/30 bg-muted/20" />
    </div>

    <!-- Stock list -->
    <div v-else-if="filtered.length" class="space-y-2">
      <NuxtLink
        v-for="stock in filtered"
        :key="stock.ticker"
        :to="localePath(`/stocks/${stock.ticker.replace('.JK', '')}`)"
        class="group flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/60 hover:bg-accent/20 hover:shadow-md active:scale-[0.99]"
      >
        <!-- Logo / initials -->
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold">
          {{ stock.ticker.replace('.JK', '').slice(0, 2) }}
        </div>

        <!-- Name + sector -->
        <div class="flex-1 overflow-hidden">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-bold">{{ stock.ticker.replace('.JK', '') }}</span>
            <Badge v-if="'sector' in stock && stock.sector" variant="secondary" class="hidden text-[9px] px-1 py-0 sm:inline-flex">{{ stock.sector }}</Badge>
          </div>
          <p class="truncate text-xs text-muted-foreground">{{ stock.name }}</p>
        </div>

        <!-- Volume (live stocks only) -->
        <div v-if="'volume' in stock" class="hidden text-right sm:block">
          <p class="text-[10px] text-muted-foreground">Vol</p>
          <p class="text-xs font-medium">{{ formatCompact(stock.volume) }}</p>
        </div>

        <!-- Price + change (live stocks only) -->
        <div v-if="'price' in stock" class="text-right">
          <p class="text-sm font-bold">{{ formatNumber(stock.price) }}</p>
          <div
            class="flex items-center justify-end gap-0.5 text-xs font-semibold"
            :class="stock.changePercent >= 0 ? 'text-gain' : 'text-loss'"
          >
            <TrendingUp v-if="stock.changePercent >= 0" class="h-3 w-3" />
            <TrendingDown v-else class="h-3 w-3" />
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </div>
        </div>
        <!-- Stub: no price data yet -->
        <div v-else class="text-right text-xs text-muted-foreground">
          —
        </div>

        <!-- Watchlist toggle -->
        <button
          class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          :class="watchlistStore.isInWatchlist(stock.ticker) ? 'text-yellow-400' : ''"
          @click.prevent="watchlistStore.toggleWatchlist(stock.ticker)"
        >
          <StarFilledIcon v-if="watchlistStore.isInWatchlist(stock.ticker)" class="h-4 w-4" />
          <StarIcon v-else class="h-4 w-4" />
        </button>
      </NuxtLink>
    </div>

    <p v-else class="py-12 text-center text-sm text-muted-foreground">
      {{ $t('stocks.noResults') }}
    </p>
  </div>
</template>
