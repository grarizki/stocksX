<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import type { EconomicIndicator } from '@/data/indicators'

defineProps<{ indicator: EconomicIndicator }>()
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-xs font-medium text-muted-foreground">{{ indicator.name }}</span>
      <component
        :is="indicator.change >= 0 ? TrendingUp : TrendingDown"
        class="h-4 w-4"
        :class="indicator.change >= 0 ? 'text-gain' : 'text-loss'"
      />
    </div>
    <p class="text-2xl font-bold">{{ indicator.value }}</p>
    <div class="mt-1 flex items-center gap-2">
      <span
        class="text-xs font-semibold"
        :class="indicator.change >= 0 ? 'text-gain' : 'text-loss'"
      >
        {{ indicator.change >= 0 ? '+' : '' }}{{ indicator.changePercent.toFixed(2) }}%
      </span>
      <span class="text-xs text-muted-foreground">
        {{ $t('indicators.prev') }}: {{ indicator.previousValue }}
      </span>
    </div>
  </Card>
</template>
