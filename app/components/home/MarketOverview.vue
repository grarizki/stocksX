<script setup lang="ts">
import { TrendingUp, TrendingDown, Activity } from 'lucide-vue-next'

const { data: indices, status } = useApiFetch('/api/market/indices')

type IndexItem = { ticker: string; name: string; price: number; change: number; changePercent: number }

const INDEX_META: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  '^GSPC': { label: 'S&P 500', icon: Activity, color: 'from-blue-500/20 to-cyan-500/20' },
  '^IXIC': { label: 'NASDAQ', icon: TrendingUp, color: 'from-emerald-500/20 to-green-500/20' },
  '^DJI':  { label: 'Dow Jones', icon: TrendingUp, color: 'from-violet-500/20 to-purple-500/20' },
}

const primaryIndex = computed<IndexItem | null>(() => (indices.value as IndexItem[])?.[0] ?? null)
const secondaryIndices = computed<IndexItem[]>(() => (indices.value as IndexItem[])?.slice(1) ?? [])

// Animated counter for primary index
const counter = ref(0)
const visible = ref(false)

watch(primaryIndex, (idx) => {
  if (!idx) return
  const target = idx.price
  const duration = 1200
  const start = performance.now()
  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    counter.value = target * eased
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}, { immediate: true })

onMounted(() => { visible.value = true })

function formatPrice(val: number) {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <section>
    <!-- Hero card -->
    <div class="relative mb-4 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-blue-500/10 via-card to-purple-500/10 p-5">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_60%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.06),transparent_60%)]" />

      <div class="relative">
        <div class="mb-1 flex items-center gap-2">
          <div class="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
            <div class="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          </div>
          <span class="text-xs font-medium text-green-500">{{ $t('home.marketOpen') }}</span>
        </div>

        <template v-if="primaryIndex">
          <div class="flex items-end gap-3">
            <div>
              <p class="text-xs text-muted-foreground">S&amp;P 500</p>
              <p class="text-4xl font-extrabold tracking-tight tabular-nums">
                {{ formatPrice(counter) }}
              </p>
            </div>
            <div
              class="mb-1 flex items-center gap-1 rounded-full px-2.5 py-1"
              :class="primaryIndex.changePercent >= 0 ? 'bg-gain/10' : 'bg-loss/10'"
            >
              <TrendingUp v-if="primaryIndex.changePercent >= 0" class="h-3.5 w-3.5 text-gain" />
              <TrendingDown v-else class="h-3.5 w-3.5 text-loss" />
              <span class="text-sm font-bold" :class="primaryIndex.changePercent >= 0 ? 'text-gain' : 'text-loss'">
                {{ primaryIndex.changePercent >= 0 ? '+' : '' }}{{ primaryIndex.changePercent.toFixed(2) }}%
              </span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="h-10 w-48 animate-pulse rounded-lg bg-muted/40" />
        </template>

        <svg class="mt-3 h-8 w-full opacity-40" viewBox="0 0 200 30" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="hsl(var(--gain))"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="0,25 15,22 30,18 45,20 60,15 75,17 90,12 105,14 120,8 135,10 150,6 165,9 180,4 200,7"
          />
        </svg>
      </div>
    </div>

    <!-- Secondary index cards -->
    <div class="grid grid-cols-2 gap-2">
      <template v-if="status === 'pending'">
        <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-xl bg-muted/30" />
      </template>
      <template v-else>
        <div
          v-for="(item, i) in secondaryIndices"
          :key="item.ticker"
          class="group cursor-default rounded-xl border border-border/30 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-lg hover:shadow-black/5"
          :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          :style="{ transitionDelay: `${(i + 1) * 80}ms` }"
        >
          <div class="mb-1.5 flex items-center gap-1.5">
            <div
              class="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br"
              :class="INDEX_META[item.ticker]?.color ?? 'from-zinc-500/20 to-zinc-400/20'"
            >
              <component :is="INDEX_META[item.ticker]?.icon ?? Activity" class="h-3 w-3 text-foreground/70" />
            </div>
            <span class="text-[10px] font-medium text-muted-foreground">{{ INDEX_META[item.ticker]?.label ?? item.ticker }}</span>
          </div>
          <p class="text-lg font-bold tabular-nums leading-none">{{ formatPrice(item.price) }}</p>
          <p class="mt-1 text-xs font-semibold" :class="item.changePercent >= 0 ? 'text-gain' : 'text-loss'">
            {{ item.changePercent >= 0 ? '+' : '' }}{{ item.changePercent.toFixed(2) }}%
          </p>
        </div>
      </template>
    </div>
  </section>
</template>
