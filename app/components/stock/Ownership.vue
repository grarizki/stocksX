<script setup lang="ts">
const props = defineProps<{ ticker: string }>();

const { data, status, error, refresh } = useApiFetch<OwnershipRow[]>(
	() => `/api/stocks/${props.ticker}/ownership`,
	{ watch: [() => props.ticker] },
);

const isLoading = computed(() => status.value === "pending");
const loadFailed = computed(() => status.value === "error" && !!error.value);
const rows = computed(() => data.value ?? []);

const fmtPct = (value: number) => `${value.toFixed(2)}%`;
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold">{{ $t('stock.ownershipData.title') }}</h3>

    <div v-if="isLoading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-8 w-full" />
    </div>

    <div
      v-else-if="loadFailed"
      role="alert"
      class="flex items-center justify-between rounded-lg border border-border/40 p-3"
    >
      <p class="text-sm text-muted-foreground">{{ $t('stock.ownershipData.error') }}</p>
      <Button variant="outline" size="sm" @click="refresh()">{{ $t('stock.ownershipData.retry') }}</Button>
    </div>

    <div
      v-else-if="rows.length === 0"
      class="py-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('stock.ownershipData.noData') }}
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-border/40">
      <table class="w-full text-[10px]">
        <thead>
          <tr class="border-b border-border/40 text-muted-foreground">
            <th class="px-2 py-1.5 text-left font-medium">{{ $t('stock.ownershipData.investor') }}</th>
            <th class="px-2 py-1.5 text-right font-medium">{{ $t('stock.ownershipData.percentage') }}</th>
            <th class="px-2 py-1.5 text-right font-medium">{{ $t('stock.ownershipData.notes') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="row.investor_code"
            class="border-b border-border/20 transition-colors hover:bg-accent/20"
            :class="index < 3 ? 'bg-accent/5' : ''"
          >
            <td class="px-2 py-1.5 font-bold text-foreground">{{ row.investor_code }}</td>
            <td class="px-2 py-1.5 text-right font-semibold" :class="row.percentage >= 5 ? 'text-blue-400' : 'text-foreground'">
              {{ fmtPct(row.percentage) }}
            </td>
            <td class="px-2 py-1.5 text-right text-muted-foreground">{{ row.notes ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>