<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { Stock } from '@/data/stocks'
import { formatNumber } from '@/lib/utils'

defineProps<{ stock: Stock }>()
defineEmits<{ remove: [ticker: string] }>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-accent/20">
    <NuxtLink :to="`/stocks/${stock.ticker}`" class="flex flex-1 items-center gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold">
        {{ stock.ticker.slice(0, 2) }}
      </div>
      <div class="flex-1 overflow-hidden">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold">{{ stock.ticker.replace('.JK', '') }}</span>
        </div>
        <p class="truncate text-xs text-muted-foreground">{{ stock.name }}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-bold">{{ formatNumber(stock.price) }}</p>
        <SharedPriceChange
          :change="stock.change"
          :change-percent="stock.changePercent"
          size="sm"
        />
      </div>
    </NuxtLink>
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      @click="$emit('remove', stock.ticker)"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>
</template>
