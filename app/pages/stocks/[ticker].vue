<script setup lang="ts">
import { ArrowLeft, Star, StarOff } from 'lucide-vue-next'
import { useWatchlistStore } from '~/stores/watchlist'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const ticker = computed(() => (route.params.ticker as string).toUpperCase())

const { data: stock, status } = await useApiFetch(() => `/api/stocks/${ticker.value}/summary`)

const watchlistStore = useWatchlistStore()
const isWatched = computed(() => watchlistStore.isInWatchlist(ticker.value))

useHead({
  title: computed(() => stock.value ? `${(stock.value as any).ticker} - ${(stock.value as any).name}` : 'Stock Not Found'),
})

watchEffect(() => {
  if (status.value === 'success' && !stock.value) {
    throw createError({ statusCode: 404, statusMessage: 'Stock not found' })
  }
})

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  }
  else {
    navigateTo(localePath('/home'))
  }
}
</script>

<template>
  <div>
    <Button variant="ghost" size="sm" class="mb-4 h-8 gap-1 px-2" @click="goBack">
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      {{ $t('stock.back') }}
    </Button>

    <!-- Skeleton -->
    <div v-if="status === 'pending'" class="space-y-4">
      <div class="h-24 animate-pulse rounded-xl border border-border/30 bg-muted/20" />
      <div class="h-32 animate-pulse rounded-xl border border-border/30 bg-muted/20" />
      <div class="h-48 animate-pulse rounded-xl border border-border/30 bg-muted/20" />
    </div>

    <div v-else-if="stock" class="space-y-4">
      <StockHeader :stock="stock as any" />

      <div class="space-y-4">
        <StockStats :stock="stock as any" />
        <StockAbout :stock="stock as any" />
        <StockFinancials :stock="stock as any" />
        <StockNews :ticker="(stock as any).ticker" />
      </div>

      <!-- FAB: Add to watchlist -->
      <button
        class="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 lg:bottom-8"
        :class="isWatched ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'"
        :aria-label="isWatched ? $t('stock.removeFromWatchlist') : $t('stock.addToWatchlist')"
        :aria-pressed="isWatched"
        @click="watchlistStore.toggleWatchlist(ticker)"
      >
        <StarOff v-if="isWatched" class="h-5 w-5" aria-hidden="true" />
        <Star v-else class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
