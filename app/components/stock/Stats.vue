<script setup lang="ts">
import type { Stock } from "@/data/stocks";
import { formatCompact, formatNumber } from "@/lib/utils";

const { t } = useI18n();
const props = defineProps<{ stock: Stock }>();

const stats = computed(() => [
	{ label: t("stock.marketCap"), value: formatCompact(props.stock.marketCap) },
	{ label: t("stock.peRatio"), value: props.stock.pe.toFixed(2) },
	{ label: t("stock.pbValue"), value: props.stock.pbv.toFixed(2) },
	{ label: t("stock.volume"), value: formatCompact(props.stock.volume) },
	{
		label: t("stock.divYield"),
		value: `${props.stock.dividendYield.toFixed(2)}%`,
	},
	{ label: t("stock.high52w"), value: formatNumber(props.stock.high52w) },
	{ label: t("stock.low52w"), value: formatNumber(props.stock.low52w) },
	{
		label: t("stock.dayRange"),
		value: `${formatNumber(props.stock.price - Math.abs(props.stock.change))} - ${formatNumber(props.stock.price + 50)}`,
	},
]);
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <h3 class="mb-3 text-sm font-semibold">{{ $t('stock.keyStats') }}</h3>
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
      >
        <span class="text-xs text-muted-foreground">{{ stat.label }}</span>
        <span class="text-sm font-semibold">{{ stat.value }}</span>
      </div>
    </div>
  </Card>
</template>
