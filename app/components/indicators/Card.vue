<script setup lang="ts">
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-vue-next";
import { INDICATOR_HISTORY } from "@/data/indicatorHistory";
import type { EconomicIndicator } from "@/data/indicators";

const props = defineProps<{ indicator: EconomicIndicator }>();
const localePath = useLocalePath();

const sparkValues = computed(
	() => INDICATOR_HISTORY[props.indicator.id]?.map((h) => h.value) ?? [],
);
const isPositive = computed(() => props.indicator.change >= 0);
</script>

<template>
  <NuxtLink :to="localePath(`/indicators/${indicator.id}`)" class="block">
    <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md active:scale-[0.99] cursor-pointer">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">{{ indicator.name }}</span>
        <div class="flex items-center gap-1">
          <component
            :is="isPositive ? TrendingUp : TrendingDown"
            class="h-4 w-4"
            :class="isPositive ? 'text-gain' : 'text-loss'"
          />
          <ChevronRight class="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>
      </div>

      <div class="flex items-end justify-between gap-2">
        <div>
          <p class="text-2xl font-bold">{{ indicator.value }}</p>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="text-xs font-semibold"
              :class="isPositive ? 'text-gain' : 'text-loss'"
            >
              {{ isPositive ? '+' : '' }}{{ indicator.changePercent.toFixed(2) }}%
            </span>
            <span class="text-xs text-muted-foreground">
              {{ $t('indicators.prev') }}: {{ indicator.previousValue }}
            </span>
          </div>
        </div>

        <IndicatorsMiniChart
          v-if="sparkValues.length >= 2"
          :values="sparkValues"
          :positive="isPositive"
        />
      </div>
    </Card>
  </NuxtLink>
</template>
