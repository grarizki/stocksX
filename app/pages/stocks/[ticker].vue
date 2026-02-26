<script setup lang="ts">
import { ArrowLeft, ExternalLink, Zap, Shield } from 'lucide-vue-next'
import { useWatchlistStore } from '~/stores/watchlist'
import { STOCKS_DATA } from '@/data/stocksData'
import { StarFilledIcon, StarIcon } from '@radix-icons/vue'

const dayTradeOpen = ref(false)
const tradingLimitOpen = ref(false)

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const ticker = computed(() => {
  const raw = (route.params.ticker as string).toUpperCase()
  return raw.endsWith('.JK') ? raw : `${raw}.JK`
})

const stock = computed(() => STOCKS_DATA[ticker.value] ?? null)

useHead({
  title: computed(() => stock.value ? `${stock.value.ticker.replace('.JK', '')} - ${stock.value.name} - StoxLyz` : 'Stock Not Found'),
})

const watchlistStore = useWatchlistStore()
const isWatched = computed(() => watchlistStore.isInWatchlist(ticker.value))

type Tab = 'orderbook' | 'tradebook' | 'keystats' | 'about' | 'financials' | 'broker' | 'historical'
const activeTab = ref<Tab>('orderbook')

</script>

<template>
  <div>
    <div v-if="!stock" class="py-16 text-center text-sm text-muted-foreground">
      Stock not found
    </div>

    <div v-else class="space-y-3">
      <!-- Header -->
      <div>
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <!-- Ticker + badges row -->
            <div class="flex flex-wrap items-center gap-1.5">
              <h1 class="text-xl font-bold">{{ stock.ticker.replace('.JK', '') }}</h1>
              <button
                v-if="stock.dayTradeMultiplier"
                class="flex items-center gap-0.5 rounded px-1 py-0.5 text-amber-500 hover:bg-amber-500/10"
                aria-label="Day Trade info"
                @click="dayTradeOpen = true"
              >
                <Zap class="h-3.5 w-3.5 fill-current" />
                <span class="text-[11px] font-bold leading-none">{{ stock.dayTradeMultiplier }}x</span>
              </button>
              <button
                v-if="stock.tradingLimitHaircut"
                class="flex h-5 w-5 items-center justify-center rounded text-blue-500 hover:bg-blue-500/10"
                aria-label="Trading Limit info"
                @click="tradingLimitOpen = true"
              >
                <Shield class="h-3.5 w-3.5" />
              </button>
            </div>
            <!-- Company name -->
            <p class="mt-0.5 truncate text-sm text-muted-foreground">{{ stock.name }}</p>
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

      <!-- Day Trade modal -->
      <Dialog v-model:open="dayTradeOpen">
        <DialogContent class="left-0 top-auto bottom-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-2xl rounded-b-none px-4 pb-8 pt-6 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0">
          <div class="mb-4 flex items-center gap-2">
            <Zap class="h-5 w-5 fill-current text-amber-500" />
            <h2 class="text-base font-semibold">Day Trade</h2>
          </div>
          <p class="mb-4 text-sm text-muted-foreground">
            Saham ini tersedia untuk fasilitas <span class="font-medium text-foreground">Day Trade</span> — pembelian saham yang dapat dijual pada hari yang sama tanpa perlu dana penuh di muka.
          </p>
          <div class="rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
            <p class="text-xs text-muted-foreground">Multiplier</p>
            <p class="text-2xl font-bold text-amber-500">{{ stock?.dayTradeMultiplier }}x</p>
          </div>
        </DialogContent>
      </Dialog>

      <!-- Trading Limit modal -->
      <Dialog v-model:open="tradingLimitOpen">
        <DialogContent class="left-0 top-auto bottom-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-2xl rounded-b-none px-4 pb-8 pt-6 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0">
          <div class="mb-4 flex items-center gap-2">
            <Shield class="h-5 w-5 text-blue-500" />
            <h2 class="text-base font-semibold">Trading Limit</h2>
          </div>
          <p class="mb-4 text-sm text-muted-foreground">
            Saham ini dapat digunakan sebagai jaminan untuk fasilitas <span class="font-medium text-foreground">Trading Limit</span> — kredit trading berbasis nilai portofolio Anda.
          </p>
          <div class="rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
            <p class="text-xs text-muted-foreground">Haircut</p>
            <p class="text-2xl font-bold text-blue-500">{{ stock?.tradingLimitHaircut }}%</p>
          </div>
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
