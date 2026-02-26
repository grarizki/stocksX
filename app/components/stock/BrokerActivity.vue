<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
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
import { getBrokerActivity, getBrokerTable, BROKER_NAMES } from '@/data/brokerActivity'
import type { BrokerActivityData, BrokerRow, BrokerTableRow } from '@/data/brokerActivity'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps<{ ticker: string }>()

type ViewMode = 'stock' | 'broker'
const viewMode = ref<ViewMode>('stock')

type Range = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y'
const RANGES: Range[] = ['1D', '1W', '1M', '3M', 'YTD', '1Y']
const activeRange = ref<Range>('1D')
const showNet = ref(false)
const showSummary = ref(false)

// ── By-Stock view ──────────────────────────────────────────────
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

const lineChartData = computed(() => {
  const { brokers, colors, intraday } = data.value
  const labels = intraday.map(p => p.time as string)
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

// ── By-Broker view ─────────────────────────────────────────────
const BROKER_CODES = Object.keys(BROKER_NAMES)
const selectedBroker = ref<string>(BROKER_CODES[0] ?? 'YP')

type InvestorType = 'All Investor' | 'Foreign' | 'Local'
type MarketType = 'Regular' | 'Nego' | 'Tunai'
const investorType = ref<InvestorType>('All Investor')
const marketType = ref<MarketType>('Regular')
const showBrokerPicker = ref(false)
const showInvestorPicker = ref(false)
const showMarketPicker = ref(false)
const INVESTOR_TYPES: InvestorType[] = ['All Investor', 'Foreign', 'Local']
const MARKET_TYPES: MarketType[] = ['Regular', 'Nego', 'Tunai']

const brokerRows = computed<BrokerTableRow[]>(() =>
  getBrokerTable(selectedBroker.value, activeRange.value)
)

function fmtBVal(v: number) {
  if (v === 0) return '-'
  if (Math.abs(v) >= 1) return `${v.toFixed(1)}B`
  return `${(v * 1000).toFixed(0)}M`
}
function fmtBLot(v: number) {
  if (v === 0) return '0'
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}
function fmtBAvg(v: number) {
  return v.toLocaleString('id-ID')
}

const today = new Date()
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const dateRangeLabel = computed(() => {
  const end = new Date(today)
  const start = new Date(today)
  const r = activeRange.value
  if (r === '1D') return fmtDate(end)
  if (r === '1W') start.setDate(end.getDate() - 7)
  else if (r === '1M') start.setMonth(end.getMonth() - 1)
  else if (r === '3M') start.setMonth(end.getMonth() - 3)
  else if (r === 'YTD') { start.setMonth(0); start.setDate(1) }
  else if (r === '1Y') start.setFullYear(end.getFullYear() - 1)
  return `${fmtDate(start)} - ${fmtDate(end)}`
})
</script>

<template>
  <div
    class="space-y-3"
    @click="showBrokerPicker = false; showInvestorPicker = false; showMarketPicker = false"
  >
    <!-- Header row: title + view toggle + controls -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">Broker Activity</h3>
      <div class="flex items-center gap-2">
        <!-- View toggle -->
        <div class="flex rounded-lg border border-border/50 p-0.5 text-[10px] font-medium">
          <button
            class="rounded-md px-2 py-1 transition-colors"
            :class="viewMode === 'stock' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click.stop="viewMode = 'stock'"
          >By Stock</button>
          <button
            class="rounded-md px-2 py-1 transition-colors"
            :class="viewMode === 'broker' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click.stop="viewMode = 'broker'"
          >By Broker</button>
        </div>

        <!-- All Brokers button (stock view only) -->
        <button
          v-if="viewMode === 'stock'"
          class="flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          @click.stop="showSummary = true"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          All
        </button>

        <!-- Net toggle -->
        <label class="flex cursor-pointer items-center gap-1.5">
          <span class="text-xs text-muted-foreground">Net</span>
          <div
            class="relative h-5 w-9 rounded-full transition-colors"
            :class="showNet ? 'bg-blue-500' : 'bg-muted'"
            @click.stop="showNet = !showNet"
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

    <!-- Range tabs (shared) -->
    <div class="flex gap-1 overflow-x-auto scrollbar-none">
      <button
        v-for="r in RANGES"
        :key="r"
        class="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="activeRange === r ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
        @click.stop="activeRange = r"
      >{{ r }}</button>
    </div>

    <!-- ── By-Stock view ── -->
    <template v-if="viewMode === 'stock'">
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
    </template>

    <!-- ── By-Broker view ── -->
    <template v-else>
      <!-- Broker selector -->
      <div class="relative z-20" @click.stop>
        <button
          class="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-sm transition-colors hover:bg-accent/30"
          @click.stop="showBrokerPicker = !showBrokerPicker; showInvestorPicker = false; showMarketPicker = false"
        >
          <span>
            <span class="font-bold text-violet-400">{{ selectedBroker }}</span>
            <span class="ml-2 text-foreground">- {{ BROKER_NAMES[selectedBroker] }}</span>
          </span>
          <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform" :class="showBrokerPicker ? 'rotate-180' : ''" />
        </button>
        <Transition name="dropdown">
          <div
            v-if="showBrokerPicker"
            class="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border/50 bg-background shadow-xl"
          >
            <button
              v-for="code in BROKER_CODES"
              :key="code"
              class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
              :class="selectedBroker === code ? 'bg-accent/30 text-foreground' : 'text-muted-foreground'"
              @click.stop="selectedBroker = code; showBrokerPicker = false"
            >
              <span class="w-8 font-bold text-violet-400">{{ code }}</span>
              <span class="truncate">{{ BROKER_NAMES[code] }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Filter dropdowns row -->
      <div class="flex gap-2" @click.stop>
        <!-- Investor type -->
        <div class="relative z-10 flex-1">
          <button
            class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-xs transition-colors hover:bg-accent/30"
            @click.stop="showInvestorPicker = !showInvestorPicker; showBrokerPicker = false; showMarketPicker = false"
          >
            <span class="text-foreground">{{ investorType }}</span>
            <ChevronDown class="h-3 w-3 shrink-0 text-muted-foreground" :class="showInvestorPicker ? 'rotate-180' : ''" />
          </button>
          <Transition name="dropdown">
            <div
              v-if="showInvestorPicker"
              class="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border/50 bg-background shadow-xl"
            >
              <button
                v-for="opt in INVESTOR_TYPES"
                :key="opt"
                class="flex w-full px-3 py-2 text-xs transition-colors hover:bg-accent/50"
                :class="investorType === opt ? 'bg-accent/30 font-semibold text-foreground' : 'text-muted-foreground'"
                @click.stop="investorType = opt; showInvestorPicker = false"
              >{{ opt }}</button>
            </div>
          </Transition>
        </div>

        <!-- Market type -->
        <div class="relative z-10 flex-1">
          <button
            class="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-xs transition-colors hover:bg-accent/30"
            @click.stop="showMarketPicker = !showMarketPicker; showBrokerPicker = false; showInvestorPicker = false"
          >
            <span class="text-foreground">{{ marketType }}</span>
            <ChevronDown class="h-3 w-3 shrink-0 text-muted-foreground" :class="showMarketPicker ? 'rotate-180' : ''" />
          </button>
          <Transition name="dropdown">
            <div
              v-if="showMarketPicker"
              class="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border/50 bg-background shadow-xl"
            >
              <button
                v-for="opt in MARKET_TYPES"
                :key="opt"
                class="flex w-full px-3 py-2 text-xs transition-colors hover:bg-accent/50"
                :class="marketType === opt ? 'bg-accent/30 font-semibold text-foreground' : 'text-muted-foreground'"
                @click.stop="marketType = opt; showMarketPicker = false"
              >{{ opt }}</button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Date range label -->
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-blue-400">{{ dateRangeLabel }}</span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-border/40">
        <table class="w-full min-w-[480px] text-[10px]">
          <thead>
            <tr class="border-b border-border/40 text-muted-foreground">
              <th class="px-2 py-1.5 text-left font-medium">BY</th>
              <th class="px-2 py-1.5 text-right font-medium text-emerald-400">B.val</th>
              <th class="px-2 py-1.5 text-right font-medium text-emerald-400">B.lot</th>
              <th class="px-2 py-1.5 text-right font-medium text-emerald-400">B.avg</th>
              <th class="px-2 py-1.5 text-left font-medium">SL</th>
              <th class="px-2 py-1.5 text-right font-medium text-red-400">S.val</th>
              <th class="px-2 py-1.5 text-right font-medium text-red-400">S.lot</th>
              <th class="px-2 py-1.5 text-right font-medium text-red-400">S.avg</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in brokerRows"
              :key="row.rank"
              class="border-b border-border/20 transition-colors hover:bg-accent/20"
            >
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.stock }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtBVal(row.bVal) }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtBLot(row.bLot) }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtBAvg(row.bAvg) }}</td>
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.sStock }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtBVal(row.sVal) }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtBLot(row.sLot) }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtBAvg(row.sAvg) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
