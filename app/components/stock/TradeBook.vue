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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{
  ticker: string
  price: number
}>()

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const tickerSeed = props.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

function tickSize(p: number): number {
  if (p < 200)  return 1
  if (p < 500)  return 2
  if (p < 2000) return 5
  if (p < 5000) return 10
  return 25
}

type View = 'chart' | 'time' | 'price'
const activeView = ref<View>('chart')

// ── Price view ────────────────────────────────────────────────────────────────
type TradeRow = {
  price: number
  tLot: number
  tFreq: number
  bLot: number
  sLot: number
  bFreq: number
  sFreq: number
}

const tradeByPrice = computed<TradeRow[]>(() => {
  const rand = seededRand(tickerSeed + 99)
  const tick = tickSize(props.price)
  return Array.from({ length: 16 }, (_, i) => {
    const offset = (8 - i) * tick
    const p = props.price + offset
    const tLot  = Math.round((rand() * 10000 + 100) / (Math.abs(offset / tick) + 1))
    const bLot  = Math.round(tLot * (0.3 + rand() * 0.5))
    const sLot  = tLot - bLot
    const tFreq = Math.round(tLot * (0.005 + rand() * 0.02))
    const bFreq = Math.round(tFreq * (0.3 + rand() * 0.5))
    const sFreq = Math.max(1, tFreq - bFreq)
    return { price: p, tLot, tFreq, bLot, sLot, bFreq, sFreq }
  })
})

// ── Time view ─────────────────────────────────────────────────────────────────
type TimeRow = { time: string; price: number; lot: number; type: 'B' | 'S' }

const tradeByTime = computed<TimeRow[]>(() => {
  const rand = seededRand(tickerSeed + 77)
  const tick = tickSize(props.price)
  const base = new Date('2026-02-26T09:00:00')
  return Array.from({ length: 20 }, (_) => {
    base.setMinutes(base.getMinutes() + Math.round(rand() * 15 + 1))
    const offset = Math.round((rand() - 0.5) * 6) * tick
    return {
      time: base.toTimeString().slice(0, 5),
      price: props.price + offset,
      lot: Math.round(rand() * 500 + 1),
      type: (rand() > 0.5 ? 'B' : 'S') as 'B' | 'S',
    }
  }).reverse()
})

// ── Chart view ────────────────────────────────────────────────────────────────
const tradeChartData = computed<ChartData<'line'>>(() => {
  const rows = [...tradeByTime.value].reverse()
  let cumBuy = 0
  let cumSell = 0
  const buyPoints: number[] = []
  const sellPoints: number[] = []
  for (const row of rows) {
    if (row.type === 'B') cumBuy += row.lot
    else cumSell += row.lot
    buyPoints.push(cumBuy)
    sellPoints.push(cumSell)
  }
  return {
    labels: rows.map(r => r.time),
    datasets: [
      {
        label: 'Buy',
        data: buyPoints,
        borderColor: 'rgb(52,211,153)',
        backgroundColor: 'rgba(52,211,153,0.06)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Sell',
        data: sellPoints,
        borderColor: 'rgb(251,113,133)',
        backgroundColor: 'rgba(251,113,133,0.06)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ],
  }
})

const tradeChartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(9,9,11,0.92)',
      titleColor: '#a1a1aa',
      bodyColor: '#fff',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      padding: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#71717a', font: { size: 9 }, maxTicksLimit: 6, maxRotation: 0 },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: {
        color: '#71717a',
        font: { size: 9 },
        callback: (v) => {
          const n = Number(v)
          return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
        },
      },
      border: { display: false },
    },
  },
}))
</script>

<template>
  <div class="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
    <!-- Header with toggle pills -->
    <div class="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
      <span class="text-sm font-semibold">Trade Book</span>
      <div class="flex gap-1">
        <button
          v-for="v in ([{ value: 'chart', label: 'Chart' }, { value: 'time', label: 'By Time' }, { value: 'price', label: 'By Price' }] as { value: View; label: string }[])"
          :key="v.value"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          :class="activeView === v.value
            ? 'bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/40'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeView = v.value"
        >
          {{ v.label }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <template v-if="activeView === 'chart'">
      <div class="p-3">
        <div class="h-64">
          <Line :data="tradeChartData" :options="tradeChartOptions" />
        </div>
        <div class="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-0.5 w-4 rounded-full bg-emerald-400" />Buy
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-0.5 w-4 rounded-full bg-rose-400" />Sell
          </span>
        </div>
      </div>
    </template>

    <!-- By Time -->
    <template v-else-if="activeView === 'time'">
      <div class="overflow-x-auto">
        <table class="w-full text-[11px]">
          <thead>
            <tr class="border-b border-border/40 text-muted-foreground">
              <th class="px-3 py-2 text-left font-medium">Time</th>
              <th class="px-3 py-2 text-right font-medium">Price</th>
              <th class="px-3 py-2 text-right font-medium">Lot</th>
              <th class="px-3 py-2 text-center font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in tradeByTime"
              :key="i"
              class="border-b border-border/10 hover:bg-accent/20"
            >
              <td class="px-3 py-1.5 text-left text-muted-foreground">{{ row.time }}</td>
              <td class="px-3 py-1.5 text-right font-semibold" :class="row.type === 'B' ? 'text-gain' : 'text-loss'">
                {{ row.price.toLocaleString() }}
              </td>
              <td class="px-3 py-1.5 text-right text-foreground">{{ row.lot.toLocaleString() }}</td>
              <td class="px-3 py-1.5 text-center">
                <span
                  class="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  :class="row.type === 'B' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'"
                >{{ row.type }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- By Price -->
    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-[11px]">
          <thead>
            <tr class="border-b border-border/40 text-muted-foreground">
              <th class="px-3 py-2 text-right font-medium">Price</th>
              <th class="px-3 py-2 text-right font-medium">T.Lot</th>
              <th class="px-3 py-2 text-right font-medium">T.Freq</th>
              <th class="px-3 py-2 text-right font-medium text-gain">B.Lot</th>
              <th class="px-3 py-2 text-right font-medium text-loss">S.Lot</th>
              <th class="px-3 py-2 text-right font-medium text-gain">B.Freq</th>
              <th class="px-3 py-2 text-right font-medium text-loss">S.Freq</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in tradeByPrice"
              :key="row.price"
              class="border-b border-border/10 hover:bg-accent/20"
              :class="row.price === price ? 'bg-blue-500/5' : ''"
            >
              <td
                class="px-3 py-1.5 text-right font-semibold"
                :class="row.price > price ? 'text-gain' : row.price < price ? 'text-loss' : 'text-yellow-500'"
              >
                {{ row.price.toLocaleString() }}
              </td>
              <td class="px-3 py-1.5 text-right text-foreground">{{ row.tLot.toLocaleString() }}</td>
              <td class="px-3 py-1.5 text-right text-foreground">{{ row.tFreq.toLocaleString() }}</td>
              <td class="px-3 py-1.5 text-right text-gain">{{ row.bLot.toLocaleString() }}</td>
              <td class="px-3 py-1.5 text-right text-loss">{{ row.sLot > 0 ? row.sLot.toLocaleString() : '-' }}</td>
              <td class="px-3 py-1.5 text-right text-gain">{{ row.bFreq.toLocaleString() }}</td>
              <td class="px-3 py-1.5 text-right text-loss">{{ row.sFreq > 0 ? row.sFreq.toLocaleString() : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
