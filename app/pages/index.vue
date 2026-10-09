<script setup lang="ts">
import {
	ArrowRight,
	ArrowUp,
	Bell,
	ChevronRight,
	Flame,
	Globe2,
	Moon,
	Newspaper,
	ShieldAlert,
	Sparkles,
	Sun,
	TrendingUp,
	Users,
	Zap,
} from "lucide-vue-next";

definePageMeta({ layout: "blank" });

useHead({ title: "StoxLyz — Quantum-Grade Indonesian Market Terminal" });

const { t } = useI18n();
const localePath = useLocalePath();
const userStore = useUserStore();
const colorMode = useColorMode();

const toggleColorMode = () => {
	colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const showScrollTop = ref(false);
const handleWindowScroll = () => {
	showScrollTop.value = window.scrollY > window.innerHeight * 0.7;
};

const scrollToTop = () => {
	window.scrollTo({ top: 0, behavior: "smooth" });
};

const activeTelemetry = ref(0);
const animatedMembers = ref(12480);
const activeTab = ref<"overview" | "liquidity" | "intelligence">("overview");

const telemetryItems = [
	{
		symbol: "BBCA.JK",
		name: "Bank Central Asia",
		price: "9,850",
		change: "+2.60%",
		delta: "+250",
		sentiment: "Institutional Buy",
		volumeRatio: "2.4x",
		flow: "+482B IDR",
		isBullish: true,
		sparkline: "0,24 10,18 20,20 30,12 40,15 50,6 60,8 70,2",
	},
	{
		symbol: "BBRI.JK",
		name: "Bank Rakyat Indonesia",
		price: "5,400",
		change: "+1.89%",
		delta: "+100",
		sentiment: "Accumulation",
		volumeRatio: "1.8x",
		flow: "+310B IDR",
		isBullish: true,
		sparkline: "0,22 10,19 20,16 30,14 40,11 50,12 60,6 70,3",
	},
	{
		symbol: "TLKM.JK",
		name: "Telkom Indonesia",
		price: "3,710",
		change: "-0.80%",
		delta: "-30",
		sentiment: "Rebalance Flow",
		volumeRatio: "0.9x",
		flow: "-74B IDR",
		isBullish: false,
		sparkline: "0,4 10,6 20,11 30,15 40,12 50,19 60,17 70,22",
	},
	{
		symbol: "ASII.JK",
		name: "Astra International",
		price: "5,175",
		change: "+3.09%",
		delta: "+155",
		sentiment: "Breakout Expansion",
		volumeRatio: "3.1x",
		flow: "+198B IDR",
		isBullish: true,
		sparkline: "0,24 10,21 20,18 30,19 40,9 50,7 60,5 70,1",
	},
	{
		symbol: "BREN.JK",
		name: "Barito Renewables",
		price: "6,925",
		change: "+4.14%",
		delta: "+275",
		sentiment: "Momentum Surge",
		volumeRatio: "4.2x",
		flow: "+512B IDR",
		isBullish: true,
		sparkline: "0,26 10,22 20,19 30,11 40,12 50,4 60,5 70,0",
	},
];

const pillars = [
	{
		code: "ARCH-01",
		title: "Order Flow Depth & Foreign Delta",
		subtitle: "Microsecond Broker Summary",
		desc: "Track institutional footprint across IDX with algorithmic buy/sell aggregation, net foreign flow anomalies, and dark pool distribution metrics.",
		tag: "Proprietary Feeds",
	},
	{
		code: "ARCH-02",
		title: "Autonomous Strategy Engine",
		subtitle: "Deterministic Backtesting",
		desc: "Stress-test multi-parameter volatility breakouts, exponential moving crossovers, and mean reversions across historical Indonesian equity tick-data.",
		tag: "Quant Execution",
	},
	{
		code: "ARCH-03",
		title: "Macro Synthesizer & Catalyst Radar",
		subtitle: "Real-time Sentiment Stream",
		desc: "Direct integration with central bank rate shifts, commodity correlation matrices, and contextualized financial press coverage curated for capital allocators.",
		tag: "Intelligence",
	},
];

onMounted(() => {
	window.addEventListener("scroll", handleWindowScroll, { passive: true });
	const telemetryTimer = setInterval(() => {
		activeTelemetry.value = (activeTelemetry.value + 1) % telemetryItems.length;
	}, 2800);

	onUnmounted(() => {
		window.removeEventListener("scroll", handleWindowScroll);
		clearInterval(telemetryTimer);
	});
});
</script>

<template>
  <div class="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#050507] text-[#f4f4f7] selection:bg-emerald-500/20 selection:text-emerald-300">
    <!-- Atmospheric Ambient Mesh Gradients (Hardware Accelerated, No Blur On Scroll Content) -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-[25%] left-1/2 h-[800px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,rgba(99,102,241,0.05)_45%,transparent_70%)]" />
      <div class="absolute top-[40%] -left-[10%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_65%)]" />
      <div class="absolute bottom-[5%] -right-[10%] h-[750px] w-[750px] rounded-full bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.06)_0%,transparent_65%)]" />
      <!-- Subtle scanline matrix -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)]" />
    </div>

    <!-- Floating Island Navigation (Double-Bezel Architecture) -->
    <header class="fixed top-6 inset-x-0 z-50 flex justify-center px-4">
      <div class="rounded-full bg-white/[0.03] p-1.5 ring-1 ring-white/10 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/20">
        <nav class="flex items-center gap-1 sm:gap-2 rounded-full bg-[#0a0a0f]/90 px-4 py-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <!-- Terminal Mark -->
          <NuxtLink :to="localePath('/')" class="group flex items-center gap-2.5 pr-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
              <span class="font-mono text-xs font-bold text-emerald-400">SX</span>
            </div>
            <span class="font-mono text-xs uppercase tracking-[0.25em] text-white/90">
              Stox<span class="text-emerald-400 font-semibold">X</span>
            </span>
          </NuxtLink>

          <!-- Status indicator -->
          <div class="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3 pr-2 font-mono text-[11px] text-white/50">
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span>IDX LIVE FEED</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              class="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              :aria-label="colorMode.value === 'dark' ? 'Toggle mode' : 'Toggle dark'"
              @click="toggleColorMode"
            >
              <Sun v-if="colorMode.value === 'dark'" class="h-3.5 w-3.5" />
              <Moon v-else class="h-3.5 w-3.5" />
            </button>

            <NuxtLink
              :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')"
              class="group relative inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-500/25 active:scale-[0.98]"
            >
              <span>{{ userStore.isLoggedIn ? 'Launch Terminal' : 'Access Feed' }}</span>
              <div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowRight class="h-2.5 w-2.5" />
              </div>
            </NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <!-- Main Viewport -->
    <main class="relative z-10 flex flex-col items-center">
      <!-- Section 1: Hero Telemetry Deck -->
      <section class="min-h-[100dvh] w-full max-w-7xl px-4 pt-36 pb-24 md:pt-44 md:pb-32 flex flex-col justify-between">
        <!-- Header Matrix -->
        <div class="space-y-6 text-center max-w-4xl mx-auto">
          <!-- Eyebrow Badge -->
          <div class="inline-flex items-center gap-2 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10">
            <span class="rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] font-medium text-emerald-300">
              Institutional Spec 2.4
            </span>
            <span class="pr-3 font-mono text-[11px] text-white/50">
              Jakarta Composite Intelligence
            </span>
          </div>

          <h1 class="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-white">
            Beyond Charts.<br />
            <span class="bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
              Order Flow Precision.
            </span>
          </h1>

          <p class="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-white/60 leading-relaxed font-light">
            Engineered for quantitative traders analyzing Indonesian equities. Zero-friction telemetry, algorithmic broker summary accumulation matrices, and automated trade setup engines.
          </p>

          <!-- Primary Interactive CTA with Button-in-Button Anatomy -->
          <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink
              :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')"
              class="group relative inline-flex items-center gap-4 rounded-full bg-white p-1.5 pl-6 text-sm font-semibold text-black shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#eaeaf0] active:scale-[0.98]"
            >
              <span>Initialize Workspace</span>
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowRight class="h-3.5 w-3.5" />
              </div>
            </NuxtLink>

            <NuxtLink
              :to="localePath('/stocks')"
              class="group inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] hover:text-white"
            >
              <span>Browse 900+ IDX Tickers</span>
              <ChevronRight class="h-3.5 w-3.5 text-white/40 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
          </div>
        </div>

        <!-- The Asymmetric Double-Bezel Bento Grid -->
        <div class="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          <!-- Col-span 8: Real-time Institutional Radar (Doppelrand Core) -->
          <div class="md:col-span-8 rounded-[2rem] bg-white/[0.02] p-2 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/20">
            <div class="h-full rounded-[calc(2rem-0.5rem)] bg-[#09090e]/95 p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-6 border-b border-white/5">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
                      <Flame class="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h2 class="text-sm font-semibold tracking-wide text-white">Live Institutional Radar</h2>
                      <p class="font-mono text-[10px] text-white/40">Real-time Foreign vs Domestic Delta Shift</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/70">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ACTIVE SYNC
                  </div>
                </div>

                <!-- Interactive Telemetry Feed -->
                <div class="pt-6 space-y-3">
                  <div
                    v-for="(item, idx) in telemetryItems"
                    :key="item.symbol"
                    class="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    :class="idx === activeTelemetry ? 'bg-white/[0.05] ring-1 ring-emerald-500/30' : 'bg-white/[0.015] hover:bg-white/[0.03] ring-1 ring-transparent'"
                  >
                    <div class="flex items-center gap-3.5">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-xs font-bold text-white/90 ring-1 ring-white/10">
                        {{ item.symbol.replace('.JK', '') }}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-white">{{ item.name }}</span>
                          <span class="rounded bg-emerald-500/15 px-1.5 py-0.2 font-mono text-[9px] font-medium text-emerald-300">
                            {{ item.sentiment }}
                          </span>
                        </div>
                        <div class="flex items-center gap-3 font-mono text-[11px] text-white/50 pt-0.5">
                          <span>Vol {{ item.volumeRatio }}</span>
                          <span :class="item.isBullish ? 'text-emerald-400' : 'text-rose-400'">{{ item.flow }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between sm:justify-end gap-5">
                      <!-- Sparkline vector -->
                      <svg class="h-7 w-20 shrink-0" viewBox="0 0 70 26" preserveAspectRatio="none">
                        <polyline
                          :points="item.sparkline"
                          fill="none"
                          stroke-width="1.75"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          :stroke="item.isBullish ? '#34d399' : '#f43f5e'"
                        />
                      </svg>
                      <div class="text-right">
                        <div class="font-mono text-xs font-bold text-white tabular-nums">IDR {{ item.price }}</div>
                        <div
                          class="font-mono text-[10px] font-semibold tabular-nums"
                          :class="item.isBullish ? 'text-emerald-400' : 'text-rose-400'"
                        >
                          {{ item.change }} ({{ item.delta }})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 font-mono text-[11px] text-white/40">
                <div class="flex items-center gap-2">
                  <Globe2 class="h-3.5 w-3.5 text-white/50" />
                  <span>Cross-linked with Indonesia Stock Exchange (IDX) Data Providers</span>
                </div>
                <NuxtLink :to="localePath('/stocks')" class="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  Full Market Heatmap <ChevronRight class="h-3 w-3" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Col-span 4: Algorithmic Quantitative Pulse (Doppelrand Core) -->
          <div class="md:col-span-4 rounded-[2rem] bg-white/[0.02] p-2 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/20">
            <div class="h-full rounded-[calc(2rem-0.5rem)] bg-[#09090e]/95 p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between">
              <div class="space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-white/5">
                  <div class="flex items-center gap-2.5">
                    <Sparkles class="h-4 w-4 text-indigo-400" />
                    <span class="font-mono text-xs uppercase tracking-wider text-white">Quant Copilot</span>
                  </div>
                  <span class="font-mono text-[10px] text-emerald-400">v4.3 ACTIVE</span>
                </div>

                <div class="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/10 space-y-3">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-white/60">Selected Strategy</span>
                    <span class="font-mono text-white font-semibold">MA Cross 20/50</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-white/60">Simulated Win Rate</span>
                    <span class="font-mono text-emerald-400 font-bold">68.4% (38 Trades)</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-white/60">Sharpe Ratio</span>
                    <span class="font-mono text-white font-bold">2.18 (High Efficacy)</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-white/60">Max Drawdown</span>
                    <span class="font-mono text-white/80 font-bold">-4.12%</span>
                  </div>
                </div>

                <!-- Micro Terminal Log -->
                <div class="space-y-2 font-mono text-[11px] text-white/50">
                  <div class="flex items-center gap-2 text-emerald-300">
                    <span class="h-1 w-1 rounded-full bg-emerald-400" />
                    <span>[SIGNAL] BREN.JK: Breakout confirmation</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="h-1 w-1 rounded-full bg-white/30" />
                    <span>[DATA] Volume spike +340% above 20DMA</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="h-1 w-1 rounded-full bg-indigo-400" />
                    <span>[AI REASON] Accumulation by Top 3 Foreign Brokers</span>
                  </div>
                </div>
              </div>

              <NuxtLink
                :to="localePath('/stocks/BBCA.JK')"
                class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 font-mono text-xs font-semibold text-white/90 ring-1 ring-white/10 transition-colors hover:bg-white/10"
              >
                <span>Launch Interactive ChartPro</span>
                <ArrowRight class="h-3 w-3" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Macro Architectural Pillars (Double-Bezel Triple Deck) -->
      <section class="w-full max-w-7xl px-4 py-24 md:py-36">
        <div class="mb-16 md:mb-24 space-y-4 max-w-2xl">
          <span class="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-medium">
            Architectural Philosophy
          </span>
          <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            High-Performance Data Fabric for Active Capital.
          </h2>
          <p class="text-white/60 text-sm sm:text-base font-light">
            Every layer of StoxX is built with ruthless precision: real-time streaming, edge-rendered micro-APIs, and mathematically validated market intelligence.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="pillar in pillars"
            :key="pillar.code"
            class="group rounded-[2rem] bg-white/[0.02] p-2 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-emerald-500/30 hover:bg-white/[0.04]"
          >
            <div class="h-full rounded-[calc(2rem-0.5rem)] bg-[#09090e]/95 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between space-y-8">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] text-white/40 tracking-wider">{{ pillar.code }}</span>
                  <span class="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300 ring-1 ring-white/10">
                    {{ pillar.tag }}
                  </span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white tracking-tight">{{ pillar.title }}</h3>
                  <p class="font-mono text-xs text-emerald-400/80 pt-1">{{ pillar.subtitle }}</p>
                </div>
                <p class="text-xs sm:text-sm text-white/50 leading-relaxed font-light">
                  {{ pillar.desc }}
                </p>
              </div>

              <div class="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 group-hover:text-white transition-colors">
                <span>Explore Technical Specs</span>
                <ArrowRight class="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Community Telemetry Node (Awwwards-Tier Banner) -->
      <section class="w-full max-w-7xl px-4 py-20 md:py-28">
        <div class="relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] p-2 ring-1 ring-white/10">
          <div class="relative rounded-[calc(2.5rem-0.5rem)] bg-gradient-to-br from-[#0c0d16] via-[#090a10] to-[#0d141f] p-8 sm:p-14 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <!-- Background Aura -->
            <div class="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div class="space-y-4 max-w-xl">
                <div class="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-500/20">
                  <Users class="h-3 w-3" />
                  <span>Network Constellation</span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Join 12,400+ Indonesian Market Operators.
                </h2>
                <p class="text-sm text-white/60 font-light leading-relaxed">
                  Connect directly with quants, algorithmic retail investors, and seasoned broker analysts sharing daily order-book insights and technical edge.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href="https://t.me/stoxlyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-xs tracking-wider uppercase text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#eaeaf0] active:scale-[0.98]"
                >
                  <Zap class="h-3.5 w-3.5" />
                  <span>Join Operator Telegram</span>
                </a>

                <NuxtLink
                  :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-6 py-4 font-mono text-xs uppercase tracking-wider text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                  <span>Register Free</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Minimalist Kinetic Footer -->
      <footer class="w-full border-t border-white/5 py-12 px-4 mt-20">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-[11px] text-white/40">
          <div class="flex items-center gap-3">
            <span class="font-bold tracking-wider text-white">Stox<span class="text-emerald-400">X</span></span>
            <span>&copy; {{ new Date().getFullYear() }} Quantum Intelligence Platform</span>
          </div>

          <div class="flex items-center gap-6">
            <NuxtLink :to="localePath('/stocks')" class="hover:text-white transition-colors">Market</NuxtLink>
            <NuxtLink :to="localePath('/news')" class="hover:text-white transition-colors">Newsflow</NuxtLink>
            <NuxtLink :to="localePath('/indicators')" class="hover:text-white transition-colors">Macro</NuxtLink>
            <NuxtLink :to="localePath('/settings')" class="hover:text-white transition-colors">Settings</NuxtLink>
          </div>
        </div>
      </footer>
    </main>

    <!-- Floating Scroll-To-Top Node -->
    <Transition name="fade-up">
      <button
        v-if="showScrollTop"
        aria-label="Back to top"
        class="fixed bottom-8 right-8 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#12131c] text-white ring-1 ring-white/20 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-95"
        @click="scrollToTop"
      >
        <ArrowUp class="h-4 w-4 text-emerald-400" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1), transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}
</style>
