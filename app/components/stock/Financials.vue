<script setup lang="ts">
import type { Stock } from "@/data/stocks";
import { formatCompact } from "@/lib/utils";

const props = defineProps<{ stock: Stock }>();

// Mock quarterly financials
const quarters = computed(() => {
	const base = props.stock.marketCap / (props.stock.pe || 15);
	return [
		{ period: "Q4 2025", revenue: base * 0.28, earnings: base * 0.065 },
		{ period: "Q3 2025", revenue: base * 0.26, earnings: base * 0.058 },
		{ period: "Q2 2025", revenue: base * 0.25, earnings: base * 0.055 },
		{ period: "Q1 2025", revenue: base * 0.24, earnings: base * 0.052 },
	];
});
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <h3 class="mb-3 text-sm font-semibold">{{ $t('stock.financials') }}</h3>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="text-xs">{{ $t('stock.period') }}</TableHead>
          <TableHead class="text-right text-xs">{{ $t('stock.revenue') }}</TableHead>
          <TableHead class="text-right text-xs">{{ $t('stock.earnings') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="q in quarters" :key="q.period">
          <TableCell class="text-xs font-medium">{{ q.period }}</TableCell>
          <TableCell class="text-right text-xs">{{ formatCompact(q.revenue) }}</TableCell>
          <TableCell class="text-right text-xs">{{ formatCompact(q.earnings) }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Card>
</template>
