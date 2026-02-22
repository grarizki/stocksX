<script setup lang="ts">
import { TrendingUp, TrendingDown, Zap } from 'lucide-vue-next'
import { formatCompact } from '@/lib/utils'
import type { Stock } from '@/data/stocks'

const { t } = useI18n()
const activeTab = ref('gainers')

const tabs = computed(() => [
  { value: 'gainers', label: t('home.gainers'), icon: TrendingUp, color: 'text-gain' },
  { value: 'losers', label: t('home.losers'), icon: TrendingDown, color: 'text-loss' },
  { value: 'active', label: t('home.active'), icon: Zap, color: 'text-yellow-400' },
])

const { data: gainers, status: gainersStatus } = useApiFetch<Stock[]>('/api/stocks/movers', { query: { type: 'gainers', limit: 5 } })
const { data: losers, status: losersStatus } = useApiFetch<Stock[]>('/api/stocks/movers', { query: { type: 'losers', limit: 5 } })
const { data: active, status: activeStatus } = useApiFetch<Stock[]>('/api/stocks/movers', { query: { type: 'active', limit: 5 } })

const currentStocks = computed<Stock[]>(() => {
  switch (activeTab.value) {
    case 'gainers': return gainers.value ?? []
    case 'losers': return losers.value ?? []
    case 'active': return active.value ?? []
    default: return []
  }
})

const isPending = computed(() => {
  switch (activeTab.value) {
    case 'gainers': return gainersStatus.value === 'pending'
    case 'losers': return losersStatus.value === 'pending'
    case 'active': return activeStatus.value === 'pending'
    default: return false
  }
})

const hoveredIdx = ref<number | null>(null)
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
        <component :is="tab.icon" class="h-3.5 w-3.5" :class="activeTab === tab.value && tab.color" />
        {{ tab.label }}
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
        :to="`/stocks/${stock.ticker}`"
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
          {{ stock.ticker.slice(0, 2) }}
        </div>

        <!-- Info -->
        <div class="flex-1 overflow-hidden">
          <span class="text-sm font-bold">{{ stock.ticker }}</span>
          <p class="truncate text-[11px] text-muted-foreground">{{ stock.name }}</p>
        </div>

        <!-- Volume (active tab) -->
        <div v-if="activeTab === 'active'" class="text-right">
          <p class="text-xs text-muted-foreground">{{ $t('home.vol') }}</p>
          <p class="text-sm font-bold tabular-nums">{{ formatCompact(stock.volume) }}</p>
        </div>

        <!-- Price & Change -->
        <div class="text-right">
          <p class="text-sm font-bold tabular-nums">${{ stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
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
