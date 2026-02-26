<script setup lang="ts">
import { Flame } from 'lucide-vue-next'
import type { Stock } from '@/data/stocks'

const { data: trending, status } = useApiFetch<Stock[]>('/api/stocks/movers', {
  query: { type: 'volume', limit: 8 },
})

const marqueeItems = computed(() => {
  const items = trending.value ?? []
  return [...items, ...items]
})

const isPaused = ref(false)
</script>

<template>
  <section>
    <div class="mb-3 flex items-center gap-2">
      <Flame class="h-4 w-4 text-orange-400" />
      <h2 class="text-lg font-bold">{{ $t('home.trendingNow') }}</h2>
    </div>

    <!-- Skeleton -->
    <div v-if="status === 'pending'" class="h-14 animate-pulse rounded-xl border border-border/30 bg-muted/20" />

    <!-- Marquee scroll -->
    <div
      v-else
      class="relative overflow-hidden rounded-xl border border-border/30 bg-card/30 py-2.5"
      @mouseenter="isPaused = true"
      @mouseleave="isPaused = false"
      @touchstart="isPaused = true"
      @touchend="isPaused = false"
    >
      <div class="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
      <div class="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />

      <div
        class="flex gap-3 px-4"
        :class="isPaused ? 'animate-marquee-paused' : 'animate-marquee'"
      >
        <NuxtLink
          v-for="(stock, i) in marqueeItems"
          :key="`${stock.ticker}-${i}`"
          :to="`/stocks/${stock.ticker}`"
          class="flex shrink-0 items-center gap-2.5 rounded-full border border-border/40 bg-card/60 px-3.5 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-accent/40 hover:shadow-md active:scale-95"
        >
          <div class="hidden h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-bold lg:flex">
            {{ stock.ticker.slice(0, 2) }}
          </div>
          <span class="text-xs font-bold">{{ stock.ticker.replace('.JK', '') }}</span>
          <span
            class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
            :class="stock.changePercent >= 0
              ? 'bg-gain/10 text-gain'
              : 'bg-loss/10 text-loss'"
          >
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
