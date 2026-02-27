<script setup lang="ts">
import { TrendingDown, TrendingUp } from "lucide-vue-next";

const { data: indices } = useApiFetch("/api/market/indices");

type IndexItem = {
	ticker: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
};

const primaryIndex = computed<IndexItem | null>(
	() => (indices.value as IndexItem[])?.[0] ?? null,
);

// Animated counter for primary index
const counter = ref(0);
const visible = ref(false);

watch(
	primaryIndex,
	(idx) => {
		if (!idx) return;
		const target = idx.price;
		const duration = 1200;
		const start = performance.now();
		function tick(now: number) {
			const progress = Math.min((now - start) / duration, 1);
			const eased = 1 - (1 - progress) ** 3;
			counter.value = target * eased;
			if (progress < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	},
	{ immediate: true },
);

onMounted(() => {
	visible.value = true;
});

function formatPrice(val: number) {
	return val.toLocaleString("id-ID", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}
</script>

<template>
  <section>
    <!-- Hero card -->
    <div class="relative mb-3 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-blue-500/10 via-card to-purple-500/10 p-4 sm:p-5">
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
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <p class="text-xs text-muted-foreground">
                IHSG
              </p>
              <p class="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
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
  </section>
</template>
