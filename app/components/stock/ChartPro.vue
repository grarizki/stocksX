<script setup lang="ts">
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type BarData,
  type HistogramData,
  type LineData,
} from 'lightweight-charts'
import { marked } from 'marked'
import {
  BarChart2,
  CandlestickChart,
  Minus,
  TrendingUp,
  MousePointer2,
  Trash2,
  LogIn,
  FlaskConical,
  Play,
  X,
  Sparkles,
  Target,
} from 'lucide-vue-next'

const props = defineProps<{
  ticker: string
  changePercent: number
}>()

// ---- Types ----
type Range = '5H' | '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | '3Y' | '5Y'
type ChartType = 'candlestick' | 'area'
type DrawTool = 'pointer' | 'hline' | 'trendline'
type MAKey = 'ma20' | 'ma50' | 'ma200'
type StrategyId = 'ma_cross' | 'rsi' | 'breakout'

interface Drawing {
  id: string
  type: 'hline' | 'trendline'
  series: ISeriesApi<'Line'>
}

interface Trade {
  entryTime: UTCTimestamp
  exitTime: UTCTimestamp
  entryPrice: number
  exitPrice: number
  type: 'long'
  pnlPct: number
}

interface BacktestResult {
  trades: Trade[]
  totalReturn: number
  winRate: number
  maxDrawdown: number
  totalTrades: number
  avgPnl: number
  sharpe: number
}

const RANGES: Range[] = ['5H', '1D', '1W', '1M', '3M', 'YTD', '1Y', '3Y', '5Y']
const MA_DEFS: { key: MAKey; period: number; color: string }[] = [
  { key: 'ma20', period: 20, color: '#f59e0b' },
  { key: 'ma50', period: 50, color: '#60a5fa' },
  { key: 'ma200', period: 200, color: '#f472b6' },
]

const STRATEGIES: { id: StrategyId; label: string; desc: string }[] = [
  { id: 'ma_cross', label: 'MA Crossover', desc: 'Buy when fast MA crosses above slow MA, sell on cross below' },
  { id: 'rsi', label: 'RSI Mean Reversion', desc: 'Buy when RSI recovers above 30, sell when RSI falls back below 70' },
  { id: 'breakout', label: 'Breakout', desc: 'Buy on N-day high breakout, sell on N-day low breakdown' },
]

// ---- State ----
const activeRange = ref<Range>('1Y')
const chartType = ref<ChartType>('candlestick')
const activeTool = ref<DrawTool>('pointer')
const activeMA = ref<Set<MAKey>>(new Set())
const logScale = ref(false)
const drawings = ref<Drawing[]>([])

// Backtest state
const backtestOpen = ref(false)
const selectedStrategy = ref<StrategyId>('ma_cross')
const btParams = reactive({
  fastMA: 20,
  slowMA: 50,
  rsiPeriod: 14,
  breakoutPeriod: 20,
  capital: 10_000_000,
})
const btResult = ref<BacktestResult | null>(null)
const btRunning = ref(false)
const aiExplanation = ref('')
const aiLoading = ref(false)

type TradeRating = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
interface TradeSetup {
  entry: number
  target: number
  stopLoss: number
  rating: TradeRating
  summary: string
}

const RATING_CONFIG: Record<TradeRating, { label: string; bg: string; text: string; bar: string; fill: number }> = {
  strong_buy:  { label: 'Strong Buy',  bg: 'bg-emerald-500/15', text: 'text-emerald-300', bar: 'bg-emerald-400', fill: 100 },
  buy:         { label: 'Buy',         bg: 'bg-emerald-500/8',  text: 'text-emerald-400', bar: 'bg-emerald-500', fill: 75  },
  hold:        { label: 'Hold',        bg: 'bg-yellow-500/10',  text: 'text-yellow-300',  bar: 'bg-yellow-400',  fill: 50  },
  sell:        { label: 'Sell',        bg: 'bg-red-500/8',      text: 'text-red-400',     bar: 'bg-red-500',     fill: 25  },
  strong_sell: { label: 'Strong Sell', bg: 'bg-red-500/15',     text: 'text-red-300',     bar: 'bg-red-400',     fill: 5   },
}
const tradeSetup = ref<TradeSetup | null>(null)
const setupLoading = ref(false)
const aiRunning = ref(false)
const aiRationale = ref('')

// Signal series on chart
let buySignalSeries: ISeriesApi<'Line'> | null = null
let sellSignalSeries: ISeriesApi<'Line'> | null = null
let setupSeries: ISeriesApi<'Line'>[] = []

// DOM refs
const wrapperEl = ref<HTMLElement | null>(null)
const mainEl = ref<HTMLElement | null>(null)
const volumeEl = ref<HTMLElement | null>(null)

// Chart instances
let mainChart: IChartApi | null = null
let volumeChart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let areaSeries: ISeriesApi<'Area'> | null = null
let volumeSeries: ISeriesApi<'Histogram'> | null = null
const maSeries = new Map<MAKey, ISeriesApi<'Line'>>()

let drawingStart: { time: UTCTimestamp; price: number } | null = null

const upColor = '#26a69a'
const downColor = '#ef5350'
const lineColor = computed(() => props.changePercent >= 0 ? upColor : downColor)

const tooltip = reactive({
  visible: false, time: '', open: 0, high: 0, low: 0, close: 0, volume: 0, isUp: true,
})
const ctxMenu = reactive({ visible: false, x: 0, y: 0, drawingId: '' })

type OHLCVPoint = {
  time: string | number
  open: number; high: number; low: number; close: number; volume: number
}
const rawData = ref<OHLCVPoint[]>([])

const { data: historyData, pending } = useApiFetch<OHLCVPoint[]>(
  () => `/api/stocks/${props.ticker}/history?range=${activeRange.value}`,
  { watch: [activeRange] },
)

// ============================================================
// BACKTEST ENGINE
// ============================================================

function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    return closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  })
}

function calcRSI(closes: number[], period: number): (number | null)[] {
  const rsi: (number | null)[] = new Array(closes.length).fill(null)
  if (closes.length < period + 1) return rsi
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!
    if (diff > 0) avgGain += diff; else avgLoss += -diff
  }
  avgGain /= period; avgLoss /= period
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return rsi
}

function runBacktest(): BacktestResult {
  const data = rawData.value
  if (!data.length) return emptyResult()
  const closes = data.map(d => d.close)
  const times = data.map(d => d.time as UTCTimestamp)

  type Signal = { idx: number; type: 'buy' | 'sell' }
  const signals: Signal[] = []

  if (selectedStrategy.value === 'ma_cross') {
    const fast = calcSMA(closes, btParams.fastMA)
    const slow = calcSMA(closes, btParams.slowMA)
    for (let i = 1; i < data.length; i++) {
      const pf = fast[i - 1], ps = slow[i - 1]
      const cf = fast[i], cs = slow[i]
      if (pf == null || ps == null || cf == null || cs == null) continue
      if (pf <= ps && cf > cs) signals.push({ idx: i, type: 'buy' })
      else if (pf >= ps && cf < cs) signals.push({ idx: i, type: 'sell' })
    }
  } else if (selectedStrategy.value === 'rsi') {
    const rsi = calcRSI(closes, btParams.rsiPeriod)
    for (let i = 1; i < data.length; i++) {
      const prev = rsi[i - 1], curr = rsi[i]
      if (prev == null || curr == null) continue
      if (prev < 30 && curr >= 30) signals.push({ idx: i, type: 'buy' })
      else if (prev > 70 && curr <= 70) signals.push({ idx: i, type: 'sell' })
    }
  } else if (selectedStrategy.value === 'breakout') {
    const n = btParams.breakoutPeriod
    for (let i = n; i < data.length; i++) {
      const window = data.slice(i - n, i)
      const highest = Math.max(...window.map(d => d.high))
      const lowest = Math.min(...window.map(d => d.low))
      if (data[i]!.close > highest) signals.push({ idx: i, type: 'buy' })
      else if (data[i]!.close < lowest) signals.push({ idx: i, type: 'sell' })
    }
  }

  // Simulate trades: enter on buy, exit on next sell
  const trades: Trade[] = []
  let inTrade = false
  let entryIdx = 0

  for (const sig of signals) {
    if (sig.type === 'buy' && !inTrade) {
      inTrade = true
      entryIdx = sig.idx
    } else if (sig.type === 'sell' && inTrade) {
      inTrade = false
      const entry = closes[entryIdx]!
      const exit = closes[sig.idx]!
      const pnlPct = ((exit - entry) / entry) * 100
      trades.push({
        entryTime: times[entryIdx]!,
        exitTime: times[sig.idx]!,
        entryPrice: entry,
        exitPrice: exit,
        type: 'long',
        pnlPct,
      })
    }
  }

  if (!trades.length) return emptyResult()

  const wins = trades.filter(t => t.pnlPct > 0)
  const winRate = (wins.length / trades.length) * 100
  const totalReturn = trades.reduce((acc, t) => acc * (1 + t.pnlPct / 100), 1) - 1

  // Max drawdown
  let peak = 1, equity = 1, maxDD = 0
  for (const t of trades) {
    equity *= (1 + t.pnlPct / 100)
    if (equity > peak) peak = equity
    const dd = (peak - equity) / peak
    if (dd > maxDD) maxDD = dd
  }

  const avgPnl = trades.reduce((s, t) => s + t.pnlPct, 0) / trades.length
  const variance = trades.reduce((s, t) => s + (t.pnlPct - avgPnl) ** 2, 0) / trades.length
  const sharpe = variance > 0 ? avgPnl / Math.sqrt(variance) : 0

  return {
    trades,
    totalReturn: totalReturn * 100,
    winRate,
    maxDrawdown: maxDD * 100,
    totalTrades: trades.length,
    avgPnl,
    sharpe,
  }
}

function emptyResult(): BacktestResult {
  return { trades: [], totalReturn: 0, winRate: 0, maxDrawdown: 0, totalTrades: 0, avgPnl: 0, sharpe: 0 }
}

function runBT() {
  btRunning.value = true
  clearSignalSeries()
  setTimeout(() => {
    btResult.value = runBacktest()
    plotSignals(btResult.value.trades)
    btRunning.value = false
  }, 50)
}

function clearSignalSeries() {
  if (buySignalSeries) { mainChart?.removeSeries(buySignalSeries); buySignalSeries = null }
  if (sellSignalSeries) { mainChart?.removeSeries(sellSignalSeries); sellSignalSeries = null }
}

function plotSignals(trades: Trade[]) {
  if (!mainChart || !trades.length) return

  // Build sparse series: only at signal points, null elsewhere
  const allTimes = rawData.value.map(d => d.time as UTCTimestamp)
  const buyPts = new Map<UTCTimestamp, number>()
  const sellPts = new Map<UTCTimestamp, number>()

  for (const t of trades) {
    // Place buy marker slightly below candle low
    const entryBar = rawData.value.find(d => d.time === t.entryTime)
    const exitBar = rawData.value.find(d => d.time === t.exitTime)
    if (entryBar) buyPts.set(t.entryTime, entryBar.low * 0.99)
    if (exitBar) sellPts.set(t.exitTime, exitBar.high * 1.01)
  }

  if (buyPts.size) {
    buySignalSeries = mainChart.addSeries(LineSeries, {
      color: 'transparent',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#26a69a',
      crosshairMarkerBackgroundColor: '#26a69a',
    })
    buySignalSeries.setData(
      allTimes
        .filter(t => buyPts.has(t))
        .map(t => ({ time: t, value: buyPts.get(t)! }))
    )
  }

  if (sellPts.size) {
    sellSignalSeries = mainChart.addSeries(LineSeries, {
      color: 'transparent',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#ef5350',
      crosshairMarkerBackgroundColor: '#ef5350',
    })
    sellSignalSeries.setData(
      allTimes
        .filter(t => sellPts.has(t))
        .map(t => ({ time: t, value: sellPts.get(t)! }))
    )
  }
}

function clearSetupSeries() {
  for (const s of setupSeries) mainChart?.removeSeries(s)
  setupSeries = []
  tradeSetup.value = null
}

function clearBacktest() {
  clearSignalSeries()
  clearSetupSeries()
  btResult.value = null
  aiExplanation.value = ''
  aiRationale.value = ''
}

async function aiRunBacktest() {
  if (!rawData.value.length) return
  aiRunning.value = true
  clearBacktest()
  try {
    const sample = rawData.value.slice(-60).map(d => ({
      time: d.time, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume,
    }))
    const res = await $fetch<{ strategy: StrategyId; params: Record<string, number>; rationale: string }>('/api/ai/auto-backtest', {
      method: 'POST',
      body: { ticker: props.ticker, range: activeRange.value, ohlcvSample: sample },
    })
    selectedStrategy.value = res.strategy
    if (res.strategy === 'ma_cross') {
      if (res.params.fastMA) btParams.fastMA = res.params.fastMA
      if (res.params.slowMA) btParams.slowMA = res.params.slowMA
    } else if (res.strategy === 'rsi') {
      if (res.params.rsiPeriod) btParams.rsiPeriod = res.params.rsiPeriod
    } else if (res.strategy === 'breakout') {
      if (res.params.breakoutPeriod) btParams.breakoutPeriod = res.params.breakoutPeriod
    }
    aiRationale.value = res.rationale
    await nextTick()
    runBT()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    aiRationale.value = `Error: ${msg}`
  } finally {
    aiRunning.value = false
  }
}

async function drawTradeSetup() {
  if (!btResult.value || !mainChart || !rawData.value.length) return
  setupLoading.value = true
  clearSetupSeries()
  try {
    const strategyLabel = STRATEGIES.find(s => s.id === selectedStrategy.value)?.label ?? selectedStrategy.value
    const params: Record<string, number> = {}
    if (selectedStrategy.value === 'ma_cross') { params.fastMA = btParams.fastMA; params.slowMA = btParams.slowMA }
    else if (selectedStrategy.value === 'rsi') { params.rsiPeriod = btParams.rsiPeriod }
    else if (selectedStrategy.value === 'breakout') { params.breakoutPeriod = btParams.breakoutPeriod }

    const setup = await $fetch<TradeSetup>('/api/ai/trade-setup', {
      method: 'POST',
      body: { ticker: props.ticker, strategy: strategyLabel, params, range: activeRange.value, result: btResult.value },
    })

    tradeSetup.value = setup

    const first = rawData.value[0]!
    const last = rawData.value[rawData.value.length - 1]!
    const times = [{ time: first.time as UTCTimestamp }, { time: last.time as UTCTimestamp }]

    const entryS = mainChart.addSeries(LineSeries, { color: '#26a69a', lineWidth: 2, lineStyle: 0, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false })
    entryS.setData(times.map(t => ({ ...t, value: setup.entry })))

    const targetS = mainChart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false })
    targetS.setData(times.map(t => ({ ...t, value: setup.target })))

    const stopS = mainChart.addSeries(LineSeries, { color: '#ef5350', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false })
    stopS.setData(times.map(t => ({ ...t, value: setup.stopLoss })))

    setupSeries = [entryS, targetS, stopS]
  } catch {
    tradeSetup.value = null
  } finally {
    setupLoading.value = false
  }
}

async function explainWithAI() {
  if (!btResult.value) return
  aiLoading.value = true
  aiExplanation.value = ''
  try {
    const strategyLabel = STRATEGIES.find(s => s.id === selectedStrategy.value)?.label ?? selectedStrategy.value
    const params: Record<string, number> = {}
    if (selectedStrategy.value === 'ma_cross') { params.fastMA = btParams.fastMA; params.slowMA = btParams.slowMA }
    else if (selectedStrategy.value === 'rsi') { params.rsiPeriod = btParams.rsiPeriod }
    else if (selectedStrategy.value === 'breakout') { params.breakoutPeriod = btParams.breakoutPeriod }

    const res = await $fetch<{ explanation: string }>('/api/ai/explain-backtest', {
      method: 'POST',
      body: {
        ticker: props.ticker,
        strategy: strategyLabel,
        params,
        range: activeRange.value,
        result: btResult.value,
      },
    })
    aiExplanation.value = res.explanation
  } catch {
    aiExplanation.value = 'Failed to get explanation. Make sure ANTHROPIC_API_KEY is set in .env'
  } finally {
    aiLoading.value = false
  }
}

// ============================================================
// MA
// ============================================================
function calcMA(data: OHLCVPoint[], period: number): LineData[] {
  const out: LineData[] = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((s, d) => s + d.close, 0)
    out.push({ time: data[i]!.time as UTCTimestamp, value: sum / period })
  }
  return out
}

// ============================================================
// CHART INIT
// ============================================================
function initMainChart() {
  if (!mainEl.value) return
  mainChart = createChart(mainEl.value, {
    width: mainEl.value.clientWidth,
    height: mainEl.value.clientHeight,
    layout: {
      background: { color: '#131722' },
      textColor: '#d1d4dc',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    grid: { vertLines: { color: '#1e2330' }, horzLines: { color: '#1e2330' } },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2a2e39' },
      horzLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2a2e39' },
    },
    rightPriceScale: { borderColor: '#2a2e39', scaleMargins: { top: 0.08, bottom: 0.02 } },
    timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false },
    handleScroll: true,
    handleScale: true,
  })

  mainChart.subscribeCrosshairMove((param) => {
    if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
      tooltip.visible = false; return
    }
    const active = chartType.value === 'candlestick' ? candleSeries : areaSeries
    if (!active) return
    const d = param.seriesData.get(active)
    if (!d) { tooltip.visible = false; return }
    const isBar = 'open' in d
    tooltip.visible = true
    tooltip.time = formatTime(param.time as UTCTimestamp)
    tooltip.open = isBar ? (d as BarData).open : (d as LineData).value
    tooltip.high = isBar ? (d as BarData).high : (d as LineData).value
    tooltip.low = isBar ? (d as BarData).low : (d as LineData).value
    tooltip.close = isBar ? (d as BarData).close : (d as LineData).value
    tooltip.isUp = tooltip.close >= tooltip.open
    if (volumeSeries) {
      const vd = param.seriesData.get(volumeSeries) as HistogramData | undefined
      tooltip.volume = vd?.value ?? 0
    }
  })
}

function initVolumeChart() {
  if (!volumeEl.value) return
  volumeChart = createChart(volumeEl.value, {
    width: volumeEl.value.clientWidth,
    height: volumeEl.value.clientHeight,
    layout: { background: { color: '#131722' }, textColor: '#d1d4dc' },
    grid: { vertLines: { color: '#1e2330' }, horzLines: { color: 'transparent' } },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2a2e39' },
      horzLine: { visible: false, labelVisible: false },
    },
    rightPriceScale: { borderColor: '#2a2e39', scaleMargins: { top: 0.1, bottom: 0 }, ticksVisible: false },
    timeScale: { borderColor: '#2a2e39', visible: false },
    handleScroll: false,
    handleScale: false,
  })
  volumeSeries = volumeChart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'right' })
  mainChart?.timeScale().subscribeVisibleLogicalRangeChange(r => { if (r) volumeChart?.timeScale().setVisibleLogicalRange(r) })
  volumeChart.timeScale().subscribeVisibleLogicalRangeChange(r => { if (r) mainChart?.timeScale().setVisibleLogicalRange(r) })
}

function mountCandleSeries() {
  if (!mainChart) return
  candleSeries = mainChart.addSeries(CandlestickSeries, {
    upColor, downColor, borderUpColor: upColor, borderDownColor: downColor, wickUpColor: upColor, wickDownColor: downColor,
  })
}

function mountAreaSeries() {
  if (!mainChart) return
  areaSeries = mainChart.addSeries(AreaSeries, {
    lineColor: lineColor.value, topColor: lineColor.value + '40', bottomColor: lineColor.value + '00',
    lineWidth: 2, priceLineVisible: false,
  })
}

function switchType(type: ChartType) {
  chartType.value = type
  if (candleSeries) { mainChart?.removeSeries(candleSeries); candleSeries = null }
  if (areaSeries) { mainChart?.removeSeries(areaSeries); areaSeries = null }
  type === 'candlestick' ? mountCandleSeries() : mountAreaSeries()
  pushData()
}

function toggleMA(key: MAKey) {
  if (activeMA.value.has(key)) {
    activeMA.value.delete(key)
    const s = maSeries.get(key)
    if (s) { mainChart?.removeSeries(s); maSeries.delete(key) }
  } else {
    activeMA.value.add(key)
    if (rawData.value.length) {
      const def = MA_DEFS.find(d => d.key === key)!
      const s = mainChart!.addSeries(LineSeries, {
        color: def.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      })
      s.setData(calcMA(rawData.value, def.period))
      maSeries.set(key, s)
    }
  }
}

function refreshMAs() {
  for (const key of activeMA.value) {
    const s = maSeries.get(key)
    const def = MA_DEFS.find(d => d.key === key)!
    s?.setData(calcMA(rawData.value, def.period))
  }
}

function toggleLogScale() {
  logScale.value = !logScale.value
  mainChart?.priceScale('right').applyOptions({
    mode: logScale.value ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
  })
}

// ---- Drawings ----
function onChartClick(e: MouseEvent) {
  if (activeTool.value === 'pointer' || !mainChart) return
  const rect = mainEl.value!.getBoundingClientRect()
  const activeSeries = chartType.value === 'candlestick' ? candleSeries : areaSeries
  const price = activeSeries?.coordinateToPrice(e.clientY - rect.top) ?? null
  const time = mainChart.timeScale().coordinateToTime(e.clientX - rect.left) as UTCTimestamp | null
  if (price == null || time == null) return
  if (activeTool.value === 'hline') { addHLine(price); return }
  if (activeTool.value === 'trendline') {
    if (!drawingStart) { drawingStart = { time, price } }
    else { addTrendLine(drawingStart, { time, price }); drawingStart = null }
  }
}

function addHLine(price: number) {
  if (!mainChart || !rawData.value.length) return
  const first = rawData.value[0]; const last = rawData.value[rawData.value.length - 1]
  if (!first || !last) return
  const s = mainChart.addSeries(LineSeries, { color: '#facc15', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
  s.setData([{ time: first.time as UTCTimestamp, value: price }, { time: last.time as UTCTimestamp, value: price }])
  drawings.value.push({ id: crypto.randomUUID(), type: 'hline', series: s })
}

function addTrendLine(a: { time: UTCTimestamp; price: number }, b: { time: UTCTimestamp; price: number }) {
  if (!mainChart) return
  const s = mainChart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
  const [p1, p2] = a.time < b.time ? [a, b] : [b, a]
  s.setData([{ time: p1.time, value: p1.price }, { time: p2.time, value: p2.price }])
  drawings.value.push({ id: crypto.randomUUID(), type: 'trendline', series: s })
}

function openContextMenu(e: MouseEvent) {
  if (!drawings.value.length) return
  e.preventDefault()
  ctxMenu.x = e.clientX; ctxMenu.y = e.clientY
  ctxMenu.drawingId = drawings.value[drawings.value.length - 1]!.id
  ctxMenu.visible = true
}

function removeDrawing(id: string) {
  const idx = drawings.value.findIndex(d => d.id === id)
  if (idx === -1) return
  mainChart?.removeSeries(drawings.value[idx]!.series)
  drawings.value.splice(idx, 1)
  ctxMenu.visible = false
}

function clearAllDrawings() {
  for (const d of drawings.value) mainChart?.removeSeries(d.series)
  drawings.value = []
  ctxMenu.visible = false
}

// ---- Data ----
function pushData() {
  if (!historyData.value?.length) return
  rawData.value = historyData.value
  const raw = rawData.value
  if (chartType.value === 'candlestick' && candleSeries)
    candleSeries.setData(raw.map(d => ({ time: d.time as UTCTimestamp, open: d.open, high: d.high, low: d.low, close: d.close })))
  else if (chartType.value === 'area' && areaSeries)
    areaSeries.setData(raw.map(d => ({ time: d.time as UTCTimestamp, value: d.close })))
  if (volumeSeries) {
    volumeSeries.setData(raw.map(d => ({ time: d.time as UTCTimestamp, value: d.volume, color: d.close >= d.open ? upColor + '99' : downColor + '99' })))
    const first = raw[0]; const last = raw[raw.length - 1]
    if (first && last) volumeChart?.timeScale().setVisibleRange({ from: first.time as UTCTimestamp, to: last.time as UTCTimestamp })
  }
  mainChart?.timeScale().fitContent()
  refreshMAs()
  if (btResult.value) clearBacktest()
}

function syncSize() {
  if (mainChart && mainEl.value) mainChart.applyOptions({ width: mainEl.value.clientWidth, height: mainEl.value.clientHeight })
  if (volumeChart && volumeEl.value) volumeChart.applyOptions({ width: volumeEl.value.clientWidth, height: volumeEl.value.clientHeight })
}

function formatTime(t: UTCTimestamp) {
  return new Date(t * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}
function fmtVol(v: number) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toString()
}
function fmtPct(v: number) { return (v >= 0 ? '+' : '') + v.toFixed(2) + '%' }
function fmtMoney(_v: number) {
  const final = btParams.capital * (1 + (btResult.value?.totalReturn ?? 0) / 100)
  return final.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}
function closeCtx() { ctxMenu.visible = false }

onMounted(async () => {
  await nextTick()
  initMainChart()
  initVolumeChart()
  mountCandleSeries()
  pushData()
  const ro = new ResizeObserver(syncSize)
  if (wrapperEl.value) ro.observe(wrapperEl.value)
})

watch(historyData, pushData)
watch(() => props.ticker, async () => {
  await nextTick()
  candleSeries?.setData([]); areaSeries?.setData([]); volumeSeries?.setData([])
  for (const s of maSeries.values()) s.setData([])
  clearBacktest()
})
watch(lineColor, c => areaSeries?.applyOptions({ lineColor: c, topColor: c + '40', bottomColor: c + '00' }))

onUnmounted(() => { mainChart?.remove(); volumeChart?.remove() })
</script>

<template>
  <div ref="wrapperEl" class="relative flex h-full overflow-hidden bg-[#131722]" @click="closeCtx">

    <!-- Left toolbar -->
    <div class="flex shrink-0 flex-col items-center gap-1 border-r border-white/5 px-1.5 py-2">
      <button
        v-for="tool in ([
          { id: 'pointer',   icon: MousePointer2, label: 'Select' },
          { id: 'hline',     icon: Minus,         label: 'H-Line' },
          { id: 'trendline', icon: TrendingUp,     label: 'Trend Line' },
        ] as const)"
        :key="tool.id"
        class="flex h-8 w-8 items-center justify-center rounded transition-colors"
        :class="activeTool === tool.id ? 'bg-blue-500/20 text-blue-400' : 'text-white/30 hover:bg-white/5 hover:text-white/70'"
        :title="tool.label"
        @click.stop="activeTool = tool.id as DrawTool; drawingStart = null"
      >
        <component :is="tool.icon" class="h-4 w-4" />
      </button>

      <div class="my-1 h-px w-6 bg-white/10" />

      <button
        v-if="drawings.length"
        class="flex h-8 w-8 items-center justify-center rounded text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
        title="Clear drawings"
        @click.stop="clearAllDrawings"
      >
        <Trash2 class="h-3.5 w-3.5" />
      </button>

      <div class="mt-auto flex flex-col items-center gap-1 pb-1">
        <div class="h-px w-6 bg-white/10" />
        <button
          class="flex h-8 w-8 items-center justify-center rounded transition-colors"
          :class="backtestOpen ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:bg-white/5 hover:text-white/70'"
          title="Backtest"
          @click.stop="backtestOpen = !backtestOpen"
        >
          <FlaskConical class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Main column (chart + toolbar) -->
    <div class="flex min-w-0 flex-1 flex-col">

      <!-- Top toolbar -->
      <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/5 px-3 py-1.5">
        <div class="flex items-center gap-0.5 rounded bg-white/5 p-0.5">
          <button
            class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
            :class="chartType === 'candlestick' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'"
            @click="switchType('candlestick')"
          >
            <CandlestickChart class="h-3 w-3" /> Candle
          </button>
          <button
            class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
            :class="chartType === 'area' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'"
            @click="switchType('area')"
          >
            <BarChart2 class="h-3 w-3" /> Area
          </button>
        </div>

        <div class="h-4 w-px bg-white/10" />

        <div class="flex items-center gap-0.5">
          <button
            v-for="r in RANGES" :key="r"
            class="rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
            :class="activeRange === r ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'"
            @click="activeRange = r"
          >{{ r }}</button>
        </div>

        <div class="h-4 w-px bg-white/10" />

        <div class="flex items-center gap-1">
          <span class="text-[10px] text-white/25 uppercase tracking-wider">MA</span>
          <button
            v-for="ma in MA_DEFS" :key="ma.key"
            class="rounded px-2 py-0.5 text-[11px] font-semibold transition-colors"
            :style="activeMA.has(ma.key)
              ? { background: ma.color + '22', color: ma.color, outline: `1px solid ${ma.color}55` }
              : { color: '#ffffff30' }"
            @click="toggleMA(ma.key)"
          >{{ ma.period }}</button>
        </div>

        <div class="h-4 w-px bg-white/10" />

        <button
          class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
          :class="logScale ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'"
          @click="toggleLogScale"
        >
          <LogIn class="h-3 w-3" /> Log
        </button>
      </div>

      <!-- OHLCV tooltip -->
      <Transition name="fade">
        <div
          v-if="tooltip.visible"
          class="pointer-events-none absolute left-12 top-11 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border border-white/10 bg-[#1c2030]/90 px-3 py-1.5 text-[11px] backdrop-blur-sm"
        >
          <span class="text-white/40">{{ tooltip.time }}</span>
          <span class="text-white/50">O <span class="font-semibold" :class="tooltip.isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'">{{ tooltip.open.toLocaleString() }}</span></span>
          <span class="text-white/50">H <span class="font-semibold text-white">{{ tooltip.high.toLocaleString() }}</span></span>
          <span class="text-white/50">L <span class="font-semibold text-white">{{ tooltip.low.toLocaleString() }}</span></span>
          <span class="text-white/50">C <span class="font-semibold" :class="tooltip.isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'">{{ tooltip.close.toLocaleString() }}</span></span>
          <span class="text-white/50">Vol <span class="font-semibold text-white">{{ fmtVol(tooltip.volume) }}</span></span>
        </div>
      </Transition>

      <!-- Drawing hint -->
      <div
        v-if="activeTool !== 'pointer'"
        class="pointer-events-none absolute left-12 bottom-24 z-10 rounded-md border border-white/10 bg-[#1c2030]/90 px-3 py-1.5 text-[11px] text-white/50 backdrop-blur-sm"
      >
        <template v-if="activeTool === 'hline'">Click to place horizontal line</template>
        <template v-else-if="activeTool === 'trendline'">{{ drawingStart ? 'Click second point' : 'Click first point' }}</template>
      </div>

      <!-- Price chart -->
      <div
        class="relative min-h-0 flex-1"
        :style="{ cursor: activeTool !== 'pointer' ? 'crosshair' : 'default' }"
        @click.stop="onChartClick"
        @contextmenu.prevent="openContextMenu"
      >
        <div ref="mainEl" class="h-full w-full" />
        <div v-if="pending" class="absolute inset-0 flex items-center justify-center">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      </div>

      <!-- Volume panel -->
      <div class="shrink-0 border-t border-white/5" style="height: 80px">
        <div class="flex h-5 items-center px-3">
          <span class="text-[10px] font-medium uppercase tracking-widest text-white/20">Volume</span>
          <span v-if="tooltip.visible && tooltip.volume" class="ml-2 text-[10px] text-white/40">{{ fmtVol(tooltip.volume) }}</span>
        </div>
        <div ref="volumeEl" class="w-full" style="height: 60px" />
      </div>
    </div>

    <!-- ===== BACKTEST DRAWER (right side, overlays chart) ===== -->
    <Transition name="drawer">
      <div
        v-if="backtestOpen"
        class="absolute inset-y-0 right-0 z-20 flex w-80 flex-col border-l border-violet-500/20 bg-[#0f0d1a] shadow-2xl"
        @click.stop
      >
        <!-- Drawer header -->
        <div class="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
          <div class="flex items-center gap-2">
            <FlaskConical class="h-4 w-4 text-violet-400" />
            <span class="text-sm font-semibold text-white">Backtest</span>
          </div>
          <button class="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white/70" @click="backtestOpen = false">
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">

          <!-- AI Pick Strategy -->
          <div>
            <button
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 py-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
              :disabled="aiRunning || !rawData.length"
              @click="aiRunBacktest"
            >
              <Sparkles class="h-3.5 w-3.5" />
              {{ aiRunning ? 'Picking strategy…' : 'AI Pick & Run' }}
            </button>
            <Transition name="fade">
              <p v-if="aiRationale" class="mt-2 text-[10px] leading-relaxed text-amber-300/60">{{ aiRationale }}</p>
            </Transition>
          </div>

          <div class="h-px bg-white/5" />

          <!-- Strategy selector -->
          <div>
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Strategy</p>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="s in STRATEGIES" :key="s.id"
                class="flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors"
                :class="selectedStrategy === s.id
                  ? 'border-violet-500/60 bg-violet-500/10 text-white'
                  : 'border-white/5 text-white/40 hover:border-white/10 hover:text-white/70'"
                @click="selectedStrategy = s.id; clearBacktest()"
              >
                <span class="text-xs font-semibold">{{ s.label }}</span>
                <span class="mt-0.5 text-[10px] leading-relaxed text-white/30">{{ s.desc }}</span>
              </button>
            </div>
          </div>

          <!-- Params -->
          <div>
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Parameters</p>
            <div class="space-y-2">
              <template v-if="selectedStrategy === 'ma_cross'">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="mb-1 block text-[10px] text-white/40">Fast MA</label>
                    <input v-model.number="btParams.fastMA" type="number" min="2" max="200"
                      class="w-full rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-500/50" />
                  </div>
                  <div>
                    <label class="mb-1 block text-[10px] text-white/40">Slow MA</label>
                    <input v-model.number="btParams.slowMA" type="number" min="2" max="500"
                      class="w-full rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-500/50" />
                  </div>
                </div>
              </template>
              <template v-else-if="selectedStrategy === 'rsi'">
                <div>
                  <label class="mb-1 block text-[10px] text-white/40">RSI Period</label>
                  <input v-model.number="btParams.rsiPeriod" type="number" min="2" max="50"
                    class="w-full rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-500/50" />
                </div>
              </template>
              <template v-else-if="selectedStrategy === 'breakout'">
                <div>
                  <label class="mb-1 block text-[10px] text-white/40">Lookback (bars)</label>
                  <input v-model.number="btParams.breakoutPeriod" type="number" min="2" max="200"
                    class="w-full rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-500/50" />
                </div>
              </template>
              <div>
                <label class="mb-1 block text-[10px] text-white/40">Initial Capital (IDR)</label>
                <input v-model.number="btParams.capital" type="number" step="1000000"
                  class="w-full rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-500/50" />
              </div>
            </div>
          </div>

          <!-- Run button -->
          <button
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95 disabled:opacity-40"
            :disabled="btRunning || !rawData.length"
            @click="runBT"
          >
            <Play class="h-3.5 w-3.5" />
            {{ btRunning ? 'Running…' : 'Run Backtest' }}
          </button>

          <!-- Results -->
          <template v-if="btResult">
            <div v-if="btResult.totalTrades === 0" class="rounded-lg border border-white/5 p-4 text-center text-xs text-white/30">
              No trades generated.<br>Try a wider range or different parameters.
            </div>

            <template v-else>
              <!-- Stats grid -->
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-white/30">Results</p>
                  <button class="rounded p-0.5 text-white/20 hover:text-white/50" @click="clearBacktest">
                    <X class="h-3 w-3" />
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div class="rounded-lg bg-white/5 px-3 py-2.5">
                    <p class="text-[10px] text-white/30">Total Return</p>
                    <p class="mt-0.5 text-base font-bold leading-none" :class="btResult.totalReturn >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'">
                      {{ fmtPct(btResult.totalReturn) }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-white/5 px-3 py-2.5">
                    <p class="text-[10px] text-white/30">Final Capital</p>
                    <p class="mt-0.5 text-xs font-semibold text-white">{{ fmtMoney(btResult.totalReturn) }}</p>
                  </div>
                  <div class="rounded-lg bg-white/5 px-3 py-2.5">
                    <p class="text-[10px] text-white/30">Win Rate</p>
                    <p class="mt-0.5 text-base font-bold leading-none text-white">{{ btResult.winRate.toFixed(1) }}%</p>
                  </div>
                  <div class="rounded-lg bg-white/5 px-3 py-2.5">
                    <p class="text-[10px] text-white/30">Max Drawdown</p>
                    <p class="mt-0.5 text-base font-bold leading-none text-[#ef5350]">−{{ btResult.maxDrawdown.toFixed(2) }}%</p>
                  </div>
                  <div class="rounded-lg bg-white/5 px-3 py-2.5">
                    <p class="text-[10px] text-white/30">Trades</p>
                    <p class="mt-0.5 text-base font-bold leading-none text-white">{{ btResult.totalTrades }}</p>
                  </div>
                  <div class="rounded-lg bg-white/5 px-3 py-2.5">
                    <p class="text-[10px] text-white/30">Sharpe</p>
                    <p class="mt-0.5 text-base font-bold leading-none"
                      :class="btResult.sharpe >= 1 ? 'text-[#26a69a]' : btResult.sharpe >= 0 ? 'text-white' : 'text-[#ef5350]'">
                      {{ btResult.sharpe.toFixed(2) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Trade log -->
              <div>
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Trade Log</p>
                <div class="overflow-hidden rounded-lg border border-white/5">
                  <table class="w-full text-[11px]">
                    <thead>
                      <tr class="border-b border-white/5 bg-white/3">
                        <th class="px-3 py-1.5 text-left font-medium text-white/25">#</th>
                        <th class="px-3 py-1.5 text-left font-medium text-white/25">Entry</th>
                        <th class="px-3 py-1.5 text-left font-medium text-white/25">Exit</th>
                        <th class="px-3 py-1.5 text-right font-medium text-white/25">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(t, i) in btResult.trades" :key="i" class="border-b border-white/5 last:border-0 hover:bg-white/3">
                        <td class="px-3 py-1.5 text-white/30">{{ i + 1 }}</td>
                        <td class="px-3 py-1.5 text-white/60">{{ t.entryPrice.toLocaleString() }}</td>
                        <td class="px-3 py-1.5 text-white/60">{{ t.exitPrice.toLocaleString() }}</td>
                        <td class="px-3 py-1.5 text-right font-semibold" :class="t.pnlPct >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'">
                          {{ fmtPct(t.pnlPct) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- AI Trade Setup -->
              <div>
                <button
                  class="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:opacity-40"
                  :disabled="setupLoading"
                  @click="drawTradeSetup"
                >
                  <Target class="h-3.5 w-3.5" />
                  {{ setupLoading ? 'Analyzing…' : 'AI Trade Setup' }}
                </button>

                <Transition name="fade">
                  <div v-if="tradeSetup" class="mt-3 space-y-2">
                    <!-- Rating badge -->
                    <div :class="['rounded-lg px-3 py-2.5 flex items-center justify-between', RATING_CONFIG[tradeSetup.rating].bg]">
                      <span :class="['text-xs font-bold tracking-wide', RATING_CONFIG[tradeSetup.rating].text]">
                        {{ RATING_CONFIG[tradeSetup.rating].label }}
                      </span>
                      <div class="flex items-center gap-1">
                        <div
                          v-for="n in 5" :key="n"
                          class="h-1.5 w-4 rounded-full transition-colors"
                          :class="n <= Math.round(RATING_CONFIG[tradeSetup.rating].fill / 20) ? RATING_CONFIG[tradeSetup.rating].bar : 'bg-white/10'"
                        />
                      </div>
                    </div>
                    <!-- Price levels -->
                    <div class="rounded-lg border border-white/5 bg-white/3 overflow-hidden">
                      <div class="divide-y divide-white/5">
                        <div class="flex items-center justify-between px-3 py-2">
                          <div class="flex items-center gap-2">
                            <span class="h-2 w-2 rounded-full bg-[#26a69a]" />
                            <span class="text-[11px] text-white/50">Entry</span>
                          </div>
                          <span class="text-[11px] font-semibold text-white">{{ tradeSetup.entry.toLocaleString() }}</span>
                        </div>
                        <div class="flex items-center justify-between px-3 py-2">
                          <div class="flex items-center gap-2">
                            <span class="h-2 w-2 rounded-full bg-[#60a5fa]" />
                            <span class="text-[11px] text-white/50">Target</span>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <span class="text-[10px] text-[#26a69a]">+{{ (((tradeSetup.target - tradeSetup.entry) / tradeSetup.entry) * 100).toFixed(1) }}%</span>
                            <span class="text-[11px] font-semibold text-white">{{ tradeSetup.target.toLocaleString() }}</span>
                          </div>
                        </div>
                        <div class="flex items-center justify-between px-3 py-2">
                          <div class="flex items-center gap-2">
                            <span class="h-2 w-2 rounded-full bg-[#ef5350]" />
                            <span class="text-[11px] text-white/50">Stop</span>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <span class="text-[10px] text-[#ef5350]">{{ (((tradeSetup.stopLoss - tradeSetup.entry) / tradeSetup.entry) * 100).toFixed(1) }}%</span>
                            <span class="text-[11px] font-semibold text-white">{{ tradeSetup.stopLoss.toLocaleString() }}</span>
                          </div>
                        </div>
                      </div>
                      <p class="border-t border-white/5 px-3 py-2 text-[10px] leading-relaxed text-white/40">{{ tradeSetup.summary }}</p>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- AI Explain -->
              <div>
                <button
                  class="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/5 py-2.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/15 disabled:opacity-40"
                  :disabled="aiLoading"
                  @click="explainWithAI"
                >
                  <Sparkles class="h-3.5 w-3.5" />
                  {{ aiLoading ? 'Analyzing…' : 'Explain with AI' }}
                </button>

                <Transition name="fade">
                  <div
                    v-if="aiExplanation"
                    class="prose prose-invert prose-xs mt-3 max-w-none rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-xs leading-relaxed text-white/70 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-white/90 [&_h1,h2,h3]:font-semibold [&_h1,h2,h3]:text-white/80 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1"
                    v-html="marked(aiExplanation)"
                  />
                </Transition>
              </div>
            </template>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Right-click context menu -->
    <Transition name="fade">
      <div
        v-if="ctxMenu.visible"
        class="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-[#1e2330] py-1 shadow-xl text-xs"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @click.stop
      >
        <button class="flex w-full items-center gap-2 px-3 py-2 text-left text-white/70 hover:bg-white/5 hover:text-white" @click="removeDrawing(ctxMenu.drawingId)">
          <Trash2 class="h-3.5 w-3.5 text-red-400" /> Remove last drawing
        </button>
        <button class="flex w-full items-center gap-2 px-3 py-2 text-left text-white/70 hover:bg-white/5 hover:text-white" @click="clearAllDrawings">
          <Trash2 class="h-3.5 w-3.5 text-red-500" /> Clear all drawings
        </button>
        <div class="my-1 h-px bg-white/5" />
        <button class="flex w-full items-center gap-2 px-3 py-2 text-left text-white/40 hover:bg-white/5" @click="closeCtx">Cancel</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.1s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.drawer-enter-active, .drawer-leave-active { transition: transform 0.22s ease, opacity 0.2s; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }
</style>
