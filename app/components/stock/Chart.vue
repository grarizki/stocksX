<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { getStockHistory, filterByRange, type TimeRange } from '@/data/stockHistory'
import { formatCompact } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{
  ticker: string
  changePercent: number
}>()

const RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '3Y', '5Y']
const range = ref<TimeRange>('1D')

const history = computed(() => getStockHistory(props.ticker))

const filtered = computed(() => filterByRange(history.value, range.value))

const isPositive = computed(() => {
  const pts = filtered.value
  if (pts.length < 2) return props.changePercent >= 0
  return pts[pts.length - 1].close >= pts[0].close
})

const color = computed(() => isPositive.value ? '#22c55e' : '#ef4444')

// For 1D show just the single close as a flat line with open/close annotation
const chartData = computed<ChartData<'line'>>(() => {
  const pts = filtered.value
  const labels = pts.map((p) => range.value === '1D' ? p.date : p.date.slice(0, 7) === pts[0].date.slice(0, 7) ? p.date : p.date)

  return {
    labels,
    datasets: [{
      data: pts.map((p) => p.close),
      borderColor: color.value,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: range.value === '1D' ? 0.1 : 0.3,
      fill: true,
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        if (!chart.chartArea) return 'transparent'
        const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom)
        gradient.addColorStop(0, isPositive.value ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)')
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        return gradient
      },
    }],
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(9,9,11,0.92)',
      titleColor: '#a1a1aa',
      bodyColor: '#fff',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        title: (items) => items[0]?.label ?? '',
        label: (item) => {
          const idx = item.dataIndex
          const pt = filtered.value[idx]
          if (!pt) return ''
          return [
            `Close: ${pt.close.toLocaleString()}`,
            `High: ${pt.high.toLocaleString()}`,
            `Low: ${pt.low.toLocaleString()}`,
            `Vol: ${formatCompact(pt.volume)}`,
          ]
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#71717a',
        font: { size: 10 },
        maxTicksLimit: 6,
        maxRotation: 0,
      },
      border: { display: false },
    },
    y: {
      position: 'right',
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: {
        color: '#71717a',
        font: { size: 10 },
        maxTicksLimit: 5,
      },
      border: { display: false },
    },
  },
}))

// Period stats
const periodStats = computed(() => {
  const pts = filtered.value
  if (!pts.length) return null
  const first = pts[0].open
  const last = pts[pts.length - 1].close
  const high = Math.max(...pts.map((p) => p.high))
  const low = Math.min(...pts.map((p) => p.low))
  const pct = ((last - first) / first) * 100
  const vol = pts.reduce((s, p) => s + p.volume, 0)
  return { first, last, high, low, pct, vol }
})
</script>

<template>
  <div class="rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-xl">
    <!-- Period stats bar -->
    <div v-if="periodStats" class="mb-3 flex items-center gap-3 text-xs">
      <span class="text-muted-foreground">H: <span class="font-semibold text-foreground">{{ periodStats.high.toLocaleString() }}</span></span>
      <span class="text-muted-foreground">L: <span class="font-semibold text-foreground">{{ periodStats.low.toLocaleString() }}</span></span>
      <span
        class="ml-auto font-semibold"
        :class="periodStats.pct >= 0 ? 'text-gain' : 'text-loss'"
      >
        {{ periodStats.pct >= 0 ? '+' : '' }}{{ periodStats.pct.toFixed(2) }}%
      </span>
    </div>

    <!-- Chart -->
    <div class="h-52">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Range tabs -->
    <div class="mt-3 flex items-center justify-between">
      <button
        v-for="r in RANGES"
        :key="r"
        class="flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors"
        :class="range === r
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground'"
        @click="range = r"
      >
        {{ r }}
      </button>
    </div>
  </div>
</template>
