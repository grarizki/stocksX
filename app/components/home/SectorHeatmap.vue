<script setup lang="ts">
type SectorData = {
  id: string
  name: string
  etfTicker: string
  change: number
  price: number
  marketCap: number
}

const { data: sectors, status } = useApiFetch<SectorData[]>('/api/sectors/performance')

const visible = ref(false)
const activeSector = ref<string | null>(null)

onMounted(() => { visible.value = true })

function getBarWidth(change: number) {
  return `${Math.min(Math.abs(change) * 20, 100)}%`
}
</script>

<template>
  <section>
    <h2 class="mb-3 text-lg font-bold">{{ $t('home.sectorPerformance') }}</h2>

    <!-- Skeleton -->
    <div v-if="status === 'pending'" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="i in 11" :key="i" class="h-24 animate-pulse rounded-xl border border-border/20 bg-muted/20" />
    </div>

    <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <button
        v-for="(sector, i) in sectors"
        :key="sector.id"
        class="relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
        :class="[
          sector.change >= 0
            ? 'border-emerald-500/20 hover:border-emerald-500/40'
            : 'border-rose-500/20 hover:border-rose-500/40',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          activeSector === sector.id && 'ring-1 ring-blue-500/50',
        ]"
        :style="{ transitionDelay: `${i * 40}ms` }"
        @click="activeSector = activeSector === sector.id ? null : sector.id"
      >
        <div
          class="absolute inset-0 opacity-[0.07]"
          :class="sector.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'"
        />

        <p class="relative text-xs font-medium text-foreground/80 line-clamp-1">{{ sector.name }}</p>
        <p
          class="relative mt-1 text-lg font-bold"
          :class="sector.change >= 0 ? 'text-gain' : 'text-loss'"
        >
          {{ sector.change >= 0 ? '+' : '' }}{{ sector.change.toFixed(2) }}%
        </p>

        <div class="relative mt-2 h-1 overflow-hidden rounded-full bg-muted/30">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="sector.change >= 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60'"
            :style="{ width: visible ? getBarWidth(sector.change) : '0%' }"
          />
        </div>

        <p class="relative mt-1.5 text-[10px] text-muted-foreground">
          {{ sector.etfTicker.replace('.JK', '') }}
        </p>
      </button>
    </div>
  </section>
</template>
