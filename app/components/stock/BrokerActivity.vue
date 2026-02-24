<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { getBrokerActivity } from '@/data/brokerActivity'
import type { BrokerActivityData, BrokerRow } from '@/data/brokerActivity'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps<{ ticker: string }>()

type Range = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y'
const RANGES: Range[] = ['1D', '1W', '1M', '3M', 'YTD', '1Y']
const activeRange = ref<Range>('1D')
const showNet = ref(false)
const showSummary = ref(false)

type SortKey = 'bVal' | 'bLot' | 'bAvg' | 'sVal' | 'sLot' | 'sAvg' | 'netVal'
type SortDir = 'asc' | 'desc'
const sortKey = ref<SortKey>('bVal')
const sortDir = ref<SortDir>('desc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
}

const data = computed<BrokerActivityData>(() =>
  getBrokerActivity(props.ticker, activeRange.value)
)

const sortedTable = computed<BrokerRow[]>(() => {
  return [...data.value.table].sort((a, b) => {
    const va = a[sortKey.value] as number
    const vb = b[sortKey.value] as number
    return sortDir.value === 'desc' ? vb - va : va - vb
  })
})

// Line chart: intraday cumulative net flow for top 5 brokers
const lineChartData = computed(() => {
  const { brokers, colors, intraday } = data.value
  const labels = intraday.map(p => p.time as string)
  // Only show every 4th label to avoid crowding
  const sparseLabels = labels.map((l, i) => (i % 4 === 0 ? l : ''))

  const datasets = brokers.map((broker, idx) => ({
    label: broker,
    data: intraday.map(p => p[broker] as number),
    borderColor: colors[idx],
    backgroundColor: colors[idx] + '18',
    borderWidth: 1.5,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0.3,
    fill: false,
  }))

  return { labels: sparseLabels, datasets }
})

// Compute symmetric Y axis bounds so 0 is always centered
const lineYBounds = computed(() => {
  const { brokers, intraday } = data.value
  let max = 0
  for (const p of intraday) {
    for (const b of brokers) {
      const v = Math.abs(p[b] as number)
      if (v > max) max = v
    }
  }
  const bound = Math.ceil(max * 1.15 * 10) / 10 || 1
  return { min: -bound, max: bound }
})

const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 10, padding: 8, pointStyle: 'line' as const },
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#9ca3af',
      bodyColor: '#d1d5db',
      padding: 10,
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(2)}B`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { size: 9 }, maxRotation: 0 },
    },
    y: {
      position: 'left' as const,
      min: lineYBounds.value.min,
      max: lineYBounds.value.max,
      grid: {
        color: (ctx: any) => ctx.tick.value === 0 ? '#6b728060' : '#1f293733',
        lineWidth: (ctx: any) => ctx.tick.value === 0 ? 1.5 : 1,
      },
      ticks: {
        color: '#6b7280',
        font: { size: 9 },
        callback: (v: any) => `${Number(v).toFixed(1)}B`,
      },
    },
  },
}))

function fmtVal(v: number) {
  return `${v.toFixed(2)}B`
}
function fmtLot(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)
}
function fmtPrice(v: number) {
  return v.toLocaleString()
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header row: title + controls -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">Broker Activity</h3>
      <div class="flex items-center gap-2">
        <!-- All Brokers button -->
        <button
          class="flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          @click="showSummary = true"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          All Brokers
        </button>
        <!-- Net toggle -->
        <label class="flex cursor-pointer items-center gap-2">
          <span class="text-xs text-muted-foreground">Net</span>
          <div
            class="relative h-5 w-9 rounded-full transition-colors"
            :class="showNet ? 'bg-blue-500' : 'bg-muted'"
            @click="showNet = !showNet"
          >
            <div
              class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              :class="showNet ? 'translate-x-4' : 'translate-x-0.5'"
            />
          </div>
        </label>
      </div>
    </div>

    <!-- Broker Summary Sidebar -->
    <StockBrokerSummary v-model:open="showSummary" :ticker="ticker" :range="activeRange" :show-net="showNet" />

    <!-- Range tabs -->
    <div class="flex gap-1 overflow-x-auto scrollbar-none">
      <button
        v-for="r in RANGES"
        :key="r"
        class="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="activeRange === r
          ? 'bg-blue-500 text-white'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click="activeRange = r"
      >
        {{ r }}
      </button>
    </div>

    <!-- Chart: Intraday cumulative net flow per broker -->
    <div class="rounded-xl border border-border/40 bg-card/50 p-3">
      <p class="mb-2 text-[10px] text-muted-foreground">
        Net flow · <span class="font-semibold text-foreground">Billion IDR</span>
      </p>
      <div class="h-44 w-full">
        <Line :data="lineChartData" :options="lineChartOptions" />
      </div>
    </div>

    <!-- Broker table -->
    <div class="overflow-x-auto rounded-xl border border-border/40">
      <table class="w-full text-[10px]">
        <thead>
          <tr class="border-b border-border/40 text-muted-foreground">
            <th class="px-2 py-1.5 text-left font-medium">BY</th>
            <th
              v-for="col in ([
                { key: 'bVal', label: 'B.val', cls: 'text-emerald-400' },
                { key: 'bLot', label: 'B.lot', cls: 'text-emerald-400' },
                { key: 'bAvg', label: 'B.avg', cls: 'text-emerald-400' },
              ] as { key: SortKey; label: string; cls: string }[])"
              :key="col.key"
              class="cursor-pointer select-none px-2 py-1.5 text-right font-medium transition-colors hover:text-foreground"
              :class="[col.cls, sortKey === col.key ? 'opacity-100' : 'opacity-70']"
              @click="toggleSort(col.key)"
            >
              <span class="inline-flex items-center gap-0.5">
                {{ col.label }}
                <span v-if="sortKey === col.key" class="text-[8px]">{{ sortDir === 'desc' ? '▼' : '▲' }}</span>
              </span>
            </th>
            <th class="px-2 py-1.5 text-left font-medium">SL</th>
            <th
              v-for="col in ([
                { key: 'sVal', label: 'S.val', cls: 'text-red-400' },
                { key: 'sLot', label: 'S.lot', cls: 'text-red-400' },
                { key: 'sAvg', label: 'S.avg', cls: 'text-red-400' },
              ] as { key: SortKey; label: string; cls: string }[])"
              :key="col.key"
              class="cursor-pointer select-none px-2 py-1.5 text-right font-medium transition-colors hover:text-foreground"
              :class="[col.cls, sortKey === col.key ? 'opacity-100' : 'opacity-70']"
              @click="toggleSort(col.key)"
            >
              <span class="inline-flex items-center gap-0.5">
                {{ col.label }}
                <span v-if="sortKey === col.key" class="text-[8px]">{{ sortDir === 'desc' ? '▼' : '▲' }}</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in sortedTable"
            :key="row.rank"
            class="border-b border-border/20 transition-colors hover:bg-accent/20"
            :class="i < 5 ? 'bg-accent/5' : ''"
          >
            <td class="px-2 py-1.5 font-bold text-foreground">{{ row.buyBroker }}</td>
            <td class="px-2 py-1.5 text-right" :class="sortKey === 'bVal' ? 'text-foreground font-semibold' : 'text-emerald-400'">{{ fmtVal(row.bVal) }}</td>
            <td class="px-2 py-1.5 text-right" :class="sortKey === 'bLot' ? 'text-foreground font-semibold' : 'text-emerald-400'">{{ fmtLot(row.bLot) }}</td>
            <td class="px-2 py-1.5 text-right" :class="sortKey === 'bAvg' ? 'text-foreground font-semibold' : 'text-emerald-400'">{{ fmtPrice(row.bAvg) }}</td>
            <td class="px-2 py-1.5 font-bold text-foreground">{{ row.sellBroker }}</td>
            <td class="px-2 py-1.5 text-right" :class="sortKey === 'sVal' ? 'text-foreground font-semibold' : 'text-red-400'">{{ fmtVal(row.sVal) }}</td>
            <td class="px-2 py-1.5 text-right" :class="sortKey === 'sLot' ? 'text-foreground font-semibold' : 'text-red-400'">{{ fmtLot(row.sLot) }}</td>
            <td class="px-2 py-1.5 text-right" :class="sortKey === 'sAvg' ? 'text-foreground font-semibold' : 'text-red-400'">{{ fmtPrice(row.sAvg) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
