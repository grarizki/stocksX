<script setup lang="ts">
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-vue-next'
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
import { indicators } from '@/data/indicators'
import { INDICATOR_HISTORY } from '@/data/indicatorHistory'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const route = useRoute()
const localePath = useLocalePath()
const id = computed(() => route.params.id as string)

const indicator = computed(() => indicators.find((i) => i.id === id.value) ?? null)

useHead({
  title: computed(() => indicator.value ? `${indicator.value.name} - StoxLyz` : 'Indicator'),
})

const fullHistory = computed(() => INDICATOR_HISTORY[id.value] ?? [])

// Range selector
type Range = '1Y' | '3Y' | '5Y'
const range = ref<Range>('5Y')
const rangeMonths: Record<Range, number> = { '1Y': 12, '3Y': 36, '5Y': 60 }

const filteredHistory = computed(() => {
  const months = rangeMonths[range.value]
  return fullHistory.value.slice(-months)
})

const isPositive = computed(() => (indicator.value?.change ?? 0) >= 0)

const chartData = computed<ChartData<'line'>>(() => {
  const h = filteredHistory.value
  const color = isPositive.value ? '#22c55e' : '#ef4444'
  return {
    labels: h.map((p) => p.date),
    datasets: [
      {
        data: h.map((p) => p.value),
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true,
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height)
          gradient.addColorStop(0, isPositive.value ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)')
          gradient.addColorStop(1, 'rgba(0,0,0,0)')
          return gradient
        },
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(9,9,11,0.9)',
      titleColor: '#a1a1aa',
      bodyColor: '#fff',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        title: (items) => items[0]?.label ?? '',
        label: (item) => {
          const val = item.parsed.y
          const unit = indicator.value?.unit ?? ''
          return `${val.toLocaleString()} ${unit}`
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
        maxTicksLimit: 8,
        maxRotation: 0,
      },
      border: { display: false },
    },
    y: {
      position: 'right',
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: {
        color: '#71717a',
        font: { size: 10 },
        maxTicksLimit: 6,
      },
      border: { display: false },
    },
  },
}))

const stats = computed(() => {
  const vals = filteredHistory.value.map((h) => h.value)
  if (!vals.length) return null
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const first = vals[0]
  const last = vals[vals.length - 1]
  const pct = ((last - first) / Math.abs(first)) * 100
  return { min, max, pct }
})

function goBack() {
  if (window.history.length > 1) window.history.back()
  else navigateTo(localePath('/indicators'))
}
</script>

<template>
  <div>
    <Button variant="ghost" size="sm" class="mb-4 h-8 gap-1 px-2" @click="goBack">
      <ArrowLeft class="h-4 w-4" />
      {{ $t('stock.back') }}
    </Button>

    <div v-if="!indicator" class="py-12 text-center text-sm text-muted-foreground">
      {{ $t('indicators.title') }}
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-start justify-between">
          <div>
            <p class="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {{ indicator.category }}
            </p>
            <h1 class="text-2xl font-bold">{{ indicator.name }}</h1>
          </div>
          <component
            :is="isPositive ? TrendingUp : TrendingDown"
            class="mt-1 h-6 w-6"
            :class="isPositive ? 'text-gain' : 'text-loss'"
          />
        </div>

        <div class="mt-3 flex items-end gap-3">
          <span class="text-4xl font-extrabold tracking-tight">{{ indicator.value }}</span>
          <span
            class="mb-1 text-base font-semibold"
            :class="isPositive ? 'text-gain' : 'text-loss'"
          >
            {{ isPositive ? '+' : '' }}{{ indicator.changePercent.toFixed(2) }}%
          </span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">{{ $t('indicators.prev') }}: {{ indicator.previousValue }}</p>
      </div>

      <!-- Range picker -->
      <div class="mb-3 flex gap-1">
        <Button
          v-for="r in (['1Y', '3Y', '5Y'] as const)"
          :key="r"
          variant="ghost"
          size="sm"
          class="h-7 px-3 text-xs font-semibold"
          :class="range === r ? 'bg-accent text-foreground' : 'text-muted-foreground'"
          @click="range = r"
        >
          {{ r }}
        </Button>
      </div>

      <!-- Chart -->
      <Card class="bg-card/80 border border-border/50 p-4">
        <div v-if="!filteredHistory.length" class="flex h-52 items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
        <div v-else class="h-52">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </Card>

      <!-- Period stats -->
      <div v-if="stats" class="mt-4 grid grid-cols-3 gap-3">
        <div class="rounded-xl border border-border/30 bg-card/60 p-3 text-center">
          <p class="text-[10px] text-muted-foreground">Period Low</p>
          <p class="mt-0.5 text-sm font-bold">{{ stats.min.toLocaleString() }}</p>
        </div>
        <div class="rounded-xl border border-border/30 bg-card/60 p-3 text-center">
          <p class="text-[10px] text-muted-foreground">Period High</p>
          <p class="mt-0.5 text-sm font-bold">{{ stats.max.toLocaleString() }}</p>
        </div>
        <div class="rounded-xl border border-border/30 bg-card/60 p-3 text-center">
          <p class="text-[10px] text-muted-foreground">Period Change</p>
          <p
            class="mt-0.5 text-sm font-bold"
            :class="stats.pct >= 0 ? 'text-gain' : 'text-loss'"
          >
            {{ stats.pct >= 0 ? '+' : '' }}{{ stats.pct.toFixed(2) }}%
          </p>
        </div>
      </div>

      <!-- Data table -->
      <Card class="mt-4 bg-card/80 border border-border/50 p-4">
        <h3 class="mb-3 text-sm font-semibold">Historical Data</h3>
        <div class="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader class="sticky top-0 bg-card">
              <TableRow>
                <TableHead class="text-xs">Month</TableHead>
                <TableHead class="text-right text-xs">Value</TableHead>
                <TableHead class="text-right text-xs">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(point, i) in [...filteredHistory].reverse()"
                :key="point.date"
              >
                <TableCell class="text-xs font-medium">{{ point.date }}</TableCell>
                <TableCell class="text-right text-xs">
                  {{ point.value.toLocaleString() }}
                </TableCell>
                <TableCell class="text-right text-xs">
                  <template v-if="i < filteredHistory.length - 1">
                    <span
                      :class="point.value >= ([...filteredHistory].reverse()[i + 1]?.value ?? point.value) ? 'text-gain' : 'text-loss'"
                    >
                      {{ point.value >= ([...filteredHistory].reverse()[i + 1]?.value ?? point.value) ? '+' : '' }}{{
                        (point.value - ([...filteredHistory].reverse()[i + 1]?.value ?? point.value)).toFixed(2)
                      }}
                    </span>
                  </template>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </template>
  </div>
</template>
