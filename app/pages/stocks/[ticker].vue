<script setup lang="ts">
import { ArrowLeft, Star, StarOff, ExternalLink } from 'lucide-vue-next'
import { useWatchlistStore } from '~/stores/watchlist'
import { STOCKS_DATA } from '@/data/stocksData'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const ticker = computed(() => (route.params.ticker as string).toUpperCase())

const stock = computed(() => STOCKS_DATA[ticker.value] ?? null)

useHead({
  title: computed(() => stock.value ? `${stock.value.ticker} - ${stock.value.name} - StoxLyz` : 'Stock Not Found'),
})

const watchlistStore = useWatchlistStore()
const isWatched = computed(() => watchlistStore.isInWatchlist(ticker.value))

type Tab = 'orderbook' | 'keystats' | 'about' | 'financials' | 'broker'
const activeTab = ref<Tab>('orderbook')

function goBack() {
  if (window.history.length > 1) window.history.back()
  else navigateTo(localePath('/home'))
}
</script>

<template>
  <div>
    <Button variant="ghost" size="sm" class="mb-3 h-8 gap-1 px-2" @click="goBack">
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      {{ $t('stock.back') }}
    </Button>

    <div v-if="!stock" class="py-16 text-center text-sm text-muted-foreground">
      Stock not found
    </div>

    <div v-else class="space-y-3">
      <!-- Header -->
      <div>
        <div class="flex items-start gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold">
            {{ stock.ticker.replace('.JK', '').slice(0, 2) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <h1 class="text-xl font-bold">{{ stock.ticker.replace('.JK', '') }}</h1>
              <Badge variant="secondary" class="text-[10px]">{{ stock.sector }}</Badge>
              <Badge variant="outline" class="text-[10px]">IDX</Badge>
            </div>
            <p class="truncate text-xs text-muted-foreground">{{ stock.name }}</p>
          </div>
          <a
            v-if="stock.website"
            :href="stock.website"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink class="h-4 w-4" />
          </a>
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
            <span class="text-xs text-muted-foreground">Hari Ini</span>
          </div>
        </div>
      </div>

      <!-- Price Chart -->
      <StockChart :ticker="stock.ticker" :change-percent="stock.changePercent" />

      <!-- Section tabs -->
      <div class="flex overflow-x-auto border-b border-border/40 scrollbar-none">
        <button
          v-for="tab in (['orderbook', 'keystats', 'broker', 'about', 'financials'] as Tab[])"
          :key="tab"
          class="shrink-0 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === tab
            ? 'border-blue-500 text-blue-500'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = tab"
        >
          {{ tab === 'keystats' ? $t('stock.keyStats') : tab === 'orderbook' ? 'Orderbook' : tab === 'about' ? $t('stock.about') : tab === 'broker' ? 'Broker' : $t('stock.financials') }}
        </button>
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
      <StockStats v-else-if="activeTab === 'keystats'" :stock="stock" />
      <StockBrokerActivity v-else-if="activeTab === 'broker'" :ticker="stock.ticker" />
      <StockAbout v-else-if="activeTab === 'about'" :stock="stock" />
      <StockFinancials v-else-if="activeTab === 'financials'" :stock="stock" />

      <!-- Related news always visible -->
      <StockNews :ticker="stock.ticker" />

      <!-- FAB: watchlist toggle -->
      <button
        class="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 lg:bottom-8"
        :class="isWatched ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'"
        :aria-label="isWatched ? $t('stock.removeFromWatchlist') : $t('stock.addToWatchlist')"
        @click="watchlistStore.toggleWatchlist(ticker)"
      >
        <StarOff v-if="isWatched" class="h-5 w-5" aria-hidden="true" />
        <Star v-else class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
