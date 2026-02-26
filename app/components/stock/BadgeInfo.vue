<script setup lang="ts">
import { Zap, TrendingUp } from 'lucide-vue-next'

defineProps<{
  ticker: string
  name: string
  dayTradeMultiplier?: number
  tradingLimitHaircut?: number
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <!-- Day Trade badge — own sheet -->
    <BottomSheet v-if="dayTradeMultiplier">
      <BottomSheetTrigger as-child>
        <button
          class="inline-flex items-center justify-center rounded p-1 transition-opacity active:opacity-70 bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/40"
          :aria-label="t('stock.badgeInfo.dayTradeLabel', { n: dayTradeMultiplier })"
        >
          <Zap class="h-3 w-3 fill-current" />
        </button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>{{ ticker }}</BottomSheetTitle>
          <BottomSheetDescription>{{ name }}</BottomSheetDescription>
        </BottomSheetHeader>
        <div class="space-y-1.5 px-4 pb-6">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/40">
              <Zap class="h-3 w-3 fill-current" />
              {{ t('stock.badgeInfo.dayTrade') }}
            </span>
            <span class="text-sm font-semibold">{{ dayTradeMultiplier }}x</span>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed">
            {{ t('stock.badgeInfo.dayTradeDesc', { ticker, n: dayTradeMultiplier }) }}
          </p>
        </div>
      </BottomSheetContent>
    </BottomSheet>

    <!-- Trading Limit badge — own sheet, always independent -->
    <BottomSheet v-if="tradingLimitHaircut">
      <BottomSheetTrigger as-child>
        <button
          class="inline-flex items-center justify-center rounded p-1 transition-opacity active:opacity-70 bg-yellow-500/10 text-yellow-500 ring-1 ring-inset ring-yellow-500/40"
          :aria-label="t('stock.badgeInfo.tradingLimitLabel')"
        >
          <TrendingUp class="h-3 w-3" />
        </button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>{{ ticker }}</BottomSheetTitle>
          <BottomSheetDescription>{{ name }}</BottomSheetDescription>
        </BottomSheetHeader>
        <div class="space-y-1.5 px-4 pb-6">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold bg-yellow-500/10 text-yellow-500 ring-1 ring-inset ring-yellow-500/40">
              {{ t('stock.badgeInfo.tradingLimit') }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed">
            {{ t('stock.badgeInfo.tradingLimitDesc', { ticker, n: tradingLimitHaircut }) }}
          </p>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  </div>
</template>
