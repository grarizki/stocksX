<script setup lang="ts">
import { Minus, TrendingDown, TrendingUp } from "lucide-vue-next";
import { formatPercent } from "@/lib/utils";

const props = defineProps<{
	change: number;
	changePercent: number;
	showIcon?: boolean;
	size?: "sm" | "md" | "lg";
}>();

const isPositive = computed(() => props.change > 0);
const isNegative = computed(() => props.change < 0);
const isNeutral = computed(() => props.change === 0);

const sizeClasses = computed(() => {
	switch (props.size) {
		case "lg":
			return "text-lg font-bold";
		case "sm":
			return "text-xs font-medium";
		default:
			return "text-sm font-semibold";
	}
});
</script>

<template>
  <div
    class="flex items-center gap-1"
    :class="[
      isPositive && 'text-gain',
      isNegative && 'text-loss',
      isNeutral && 'text-muted-foreground',
      sizeClasses,
    ]"
  >
    <TrendingUp v-if="isPositive && showIcon" class="h-3.5 w-3.5" />
    <TrendingDown v-else-if="isNegative && showIcon" class="h-3.5 w-3.5" />
    <Minus v-else-if="showIcon" class="h-3.5 w-3.5" />
    <span>{{ change >= 0 ? '+' : '' }}{{ change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
    <span>({{ formatPercent(changePercent) }})</span>
  </div>
</template>
