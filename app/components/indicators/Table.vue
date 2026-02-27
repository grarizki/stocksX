<script setup lang="ts">
import type { EconomicIndicator } from "@/data/indicators";

defineProps<{ indicators: EconomicIndicator[] }>();
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="text-xs">{{ $t('indicators.indicator') }}</TableHead>
          <TableHead class="text-right text-xs">{{ $t('indicators.value') }}</TableHead>
          <TableHead class="text-right text-xs">{{ $t('indicators.previous') }}</TableHead>
          <TableHead class="text-right text-xs">{{ $t('indicators.change') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="ind in indicators" :key="ind.id">
          <TableCell class="text-xs font-medium">{{ ind.name }}</TableCell>
          <TableCell class="text-right text-xs font-semibold">{{ ind.value }}</TableCell>
          <TableCell class="text-right text-xs text-muted-foreground">{{ ind.previousValue }}</TableCell>
          <TableCell
            class="text-right text-xs font-semibold"
            :class="ind.change >= 0 ? 'text-gain' : 'text-loss'"
          >
            {{ ind.change >= 0 ? '+' : '' }}{{ ind.changePercent.toFixed(2) }}%
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Card>
</template>
