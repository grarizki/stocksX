<script setup lang="ts">
import { StarFilledIcon, StarIcon } from "@radix-icons/vue";
import { Bell, ExternalLink } from "lucide-vue-next";
import type { StockDetail } from "@/data/stocksData";
import { STOCKS_DATA } from "@/data/stocksData";
import { usePriceAlertStore } from "~/stores/priceAlert";
import { useWatchlistStore } from "~/stores/watchlist";

const notationOpen = ref(false);
const priceAlertOpen = ref(false);

const priceAlertStore = usePriceAlertStore();

const route = useRoute();
const ticker = computed(() => {
	const raw = (route.params.ticker as string).toUpperCase();
	return raw.endsWith(".JK") ? raw : `${raw}.JK`;
});

const { data: liveData, status } = useApiFetch<StockDetail>(
	() => `/api/stocks/${ticker.value}/summary`,
	{ watch: [ticker] },
);

// Merge live data with static notations from STOCKS_DATA
const stock = computed<StockDetail | null>(() => {
	if (!liveData.value) return null;
	const staticEntry = STOCKS_DATA[ticker.value];
	return { ...liveData.value, notations: staticEntry?.notations };
});

const hasAlerts = computed(() =>
	stock.value
		? priceAlertStore.alertsForTicker(stock.value.ticker).length > 0
		: false,
);

useHead({
	title: computed(() =>
		stock.value
			? `${stock.value.ticker.replace(".JK", "")} - ${stock.value.name} - StoxLyz`
			: "Stock Not Found",
	),
});

const watchlistStore = useWatchlistStore();
const isWatched = computed(() => watchlistStore.isInWatchlist(ticker.value));

type Tab =
	| "orderbook"
	| "tradebook"
	| "keystats"
	| "about"
	| "financials"
	| "broker"
	| "historical";
const activeTab = ref<Tab>("orderbook");
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="space-y-3">
      <div class="space-y-1">
        <Skeleton class="h-7 w-24" />
        <Skeleton class="h-4 w-48" />
      </div>
      <Skeleton class="h-14 w-36" />
      <Skeleton class="h-48 w-full" />
    </div>

    <div v-else-if="!stock" class="py-16 text-center text-sm text-muted-foreground">
      Stock not found
    </div>
    
    <div v-else class="space-y-3">
      <!-- Header -->
      <div>
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <!-- Ticker + badges row -->
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-bold">{{ stock.ticker.replace('.JK', '') }}</h1>
              <!-- Notation pill -->
              <div v-if="stock.notations?.length" class="flex items-center gap-1">
                <button
                  v-for="code in stock.notations"
                  :key="code"
                  class="rounded border border-rose-500/40 px-1.5 py-1 text-[11px] font-bold leading-none text-rose-500 hover:bg-rose-500/10"
                  :aria-label="`Notasi ${code}`"
                  @click="notationOpen = true"
                >
                  {{ code }}
                </button>
              </div>
            </div>
            <!-- Company name -->
            <p class="mt-0.5 truncate text-sm text-muted-foreground">{{ stock.name }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <button
              class="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-red-500"
              aria-label="Price Alert"
              @click="priceAlertOpen = true"
            >
              <Bell class="h-4 w-4" :class="hasAlerts ? 'text-red-500' : ''" />
              <span class="text-xs font-medium">{{ $t('stock.priceAlertBtn') }}</span>
              <span
                v-if="hasAlerts"
                class="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500"
              />
            </button>
            <a
              v-if="stock.website"
              :href="stock.website"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink class="h-4 w-4" />
            </a>
          </div>
        </div>

        <!-- Price -->
        <div class="mt-3">
          <p class="text-4xl font-extrabold tracking-tight">
            {{ stock.price.toLocaleString() }}
            <span class="text-base font-normal text-muted-foreground">IDR</span>
          </p>
          <div class="mt-1 flex items-center gap-2">
            <SharedPriceChange
              :change="stock.change"
              :change-percent="stock.changePercent"
              show-icon
              size="md"
            />
            <span class="text-xs text-muted-foreground">{{ $t('stock.today') }}</span>
          </div>
        </div>
      </div>

      <!-- Price Chart -->
      <StockChart :ticker="stock.ticker" :change-percent="stock.changePercent" />

      <!-- Section tabs -->
      <div class="flex overflow-x-auto border-b border-border/40 scrollbar-none">
        <button
          v-for="tab in (['orderbook', 'tradebook', 'broker', 'historical', 'keystats', 'about', 'financials'] as Tab[])"
          :key="tab"
          class="shrink-0 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === tab
            ? 'border-blue-500 text-blue-500'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = tab"
        >
          {{ tab === 'keystats' ? $t('stock.keyStats') : tab === 'orderbook' ? 'Orderbook' : tab === 'tradebook' ? 'Trade Book' : tab === 'about' ? $t('stock.about') : tab === 'broker' ? 'Broker' : tab === 'historical' ? 'Historical' : $t('stock.financials') }}
        </button>
        <a
          :href="`/stocks/${stock.ticker.replace('.JK', '')}/chart`"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 border-b-2 border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          Chart ↗
        </a>
      </div>

      <!-- Tab content -->
      <StockOrderbook
        v-if="activeTab === 'orderbook'"
        :ticker="stock.ticker"
        :price="stock.price"
        :change="stock.change"
        :volume="stock.volume"
        :high52w="stock.high52w"
        :low52w="stock.low52w"
        :pe="stock.pe"
        :pbv="stock.pbv"
        :dividend-yield="stock.dividendYield"
        :market-cap="stock.marketCap"
      />
      <StockTradeBook v-else-if="activeTab === 'tradebook'" :ticker="stock.ticker" :price="stock.price" />
      <StockStats v-else-if="activeTab === 'keystats'" :stock="stock" />
      <StockBrokerActivity v-else-if="activeTab === 'broker'" :ticker="stock.ticker" />
      <StockHistoricalData v-else-if="activeTab === 'historical'" :ticker="stock.ticker" />
      <StockAbout v-else-if="activeTab === 'about'" :stock="stock" />
      <StockFinancials v-else-if="activeTab === 'financials'" :stock="stock" />

      <!-- Related news always visible -->
      <StockNews :ticker="stock.ticker" />

      <!-- Notation modal -->
      <Dialog v-model:open="notationOpen">
        <DialogContent class="left-0 top-auto bottom-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-2xl rounded-b-none px-4 pb-8 pt-6 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0">
          <h2 class="mb-1 text-base font-semibold">{{ $t('stock.notation.title') }}</h2>
          <p class="mb-4 text-xs text-muted-foreground">{{ $t('stock.notation.subtitle') }}</p>
          <div class="space-y-2">
            <div
              v-for="code in stock?.notations"
              :key="code"
              class="flex gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5"
            >
              <span class="mt-0.5 shrink-0 text-sm font-bold text-rose-500">{{ code }}</span>
              <p class="text-sm text-foreground/80">{{ $t(`stock.notation.${code}`) }}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <!-- Price Alert modal -->
      <Dialog v-model:open="priceAlertOpen">
        <DialogContent class="left-0 top-auto bottom-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-2xl rounded-b-none px-4 pb-8 pt-6 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0">
          <StockPriceAlert :ticker="stock.ticker" :price="stock.price" />
        </DialogContent>
      </Dialog>

      <!-- FAB: watchlist toggle -->
      <button
        class="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 lg:bottom-8"
        :class="isWatched ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'"
        :aria-label="isWatched ? $t('stock.removeFromWatchlist') : $t('stock.addToWatchlist')"
        @click="watchlistStore.toggleWatchlist(ticker)"
      >
        <StarFilledIcon v-if="isWatched" class="h-5 w-5 fill-current" aria-hidden="true" />
        <StarIcon v-else class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
