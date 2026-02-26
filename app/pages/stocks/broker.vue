<script setup lang="ts">
import { ChevronDown, LineChart } from 'lucide-vue-next'
import { getBrokerTable, BROKER_NAMES } from '@/data/brokerActivity'
import type { BrokerTableRow } from '@/data/brokerActivity'

useHead({ title: 'Broker Activity - StoxLyz' })

type Range = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y'
const RANGES: Range[] = ['1D', '1W', '1M', '3M', 'YTD', '1Y']
const activeRange = ref<Range>('1D')
const showNet = ref(false)

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

const rows = computed<BrokerTableRow[]>(() =>
  getBrokerTable(selectedBroker.value, activeRange.value)
)

function fmtVal(v: number) {
  if (v === 0) return '-'
  if (Math.abs(v) >= 1) return `${v.toFixed(1)}B`
  return `${(v * 1000).toFixed(0)}M`
}
function fmtLot(v: number) {
  if (v === 0) return '0'
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}
function fmtAvg(v: number) {
  return v.toLocaleString('id-ID')
}

// Compute date range label based on active range
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
  <!-- Escape the max-w container to use full viewport width -->
  <div
    class="-mx-4 -mt-4 px-4 pt-4 lg:-mx-6 lg:-mt-4 lg:px-6"
    @click="showBrokerPicker = false; showInvestorPicker = false; showMarketPicker = false"
  >
    <div class="space-y-3" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-base font-bold">Broker Activity</h1>
        <button class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
          <LineChart class="h-4 w-4" />
        </button>
      </div>

      <!-- Broker selector -->
      <div class="relative z-20">
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
      <div class="flex gap-2">
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

      <!-- Date range label + Net toggle -->
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-blue-400">{{ dateRangeLabel }}</span>
        <label class="flex shrink-0 cursor-pointer items-center gap-1.5">
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

      <!-- Range tabs -->
      <div class="flex gap-1 overflow-x-auto scrollbar-none">
        <button
          v-for="r in RANGES"
          :key="r"
          class="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          :class="activeRange === r ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
          @click="activeRange = r"
        >{{ r }}</button>
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
              v-for="row in rows"
              :key="row.rank"
              class="border-b border-border/20 transition-colors hover:bg-accent/20"
            >
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.stock }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtVal(row.bVal) }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtLot(row.bLot) }}</td>
              <td class="px-2 py-1.5 text-right text-emerald-400">{{ fmtAvg(row.bAvg) }}</td>
              <td class="px-2 py-1.5 font-bold text-foreground">{{ row.sStock }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtVal(row.sVal) }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtLot(row.sLot) }}</td>
              <td class="px-2 py-1.5 text-right text-red-400">{{ fmtAvg(row.sAvg) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
