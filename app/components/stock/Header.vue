<script setup lang="ts">
import type { Stock } from '@/data/stocks'
import { formatNumber } from '@/lib/utils'

defineProps<{ stock: Stock }>()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-start gap-4">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-sm font-bold">
        {{ stock.ticker.slice(0, 2) }}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold">{{ stock.ticker }}</h1>
          <Badge variant="secondary">{{ stock.sector }}</Badge>
        </div>
        <p class="text-sm text-muted-foreground">{{ stock.name }}</p>
      </div>
    </div>

    <div>
      <p class="text-4xl font-extrabold tracking-tight">
        {{ formatNumber(stock.price) }}
        <span class="text-lg font-normal text-muted-foreground">USD</span>
      </p>
      <SharedPriceChange
        :change="stock.change"
        :change-percent="stock.changePercent"
        show-icon
        size="md"
        class="mt-1"
      />
    </div>
  </div>
</template>
