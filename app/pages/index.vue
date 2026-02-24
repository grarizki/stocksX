<script setup lang="ts">
import { TrendingUp, Sparkles, Newspaper, Bell, ArrowRight, ChevronRight, Star, Users, Zap, ArrowUp, Sun, Moon } from 'lucide-vue-next'

definePageMeta({ layout: false })

useHead({ title: 'StoxLyz — Indonesian Stock Market Intelligence' })

const { t } = useI18n()
const localePath = useLocalePath()
const userStore = useUserStore()
const colorMode = useColorMode()
function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const features = computed(() => [
  { icon: TrendingUp, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
  { icon: Sparkles,   title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
  { icon: Newspaper,  title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
  { icon: Bell,       title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
])

const stats = computed(() => [
  { value: '700+', label: t('landing.stat1Label') },
  { value: '12k+', label: t('landing.stat2Label') },
  { value: '24/7', label: t('landing.stat3Label') },
])

const marketCards = [
  { ticker: 'IHSG', price: '7,421.83', change: '+1.24%', gain: true },
  { ticker: 'LQ45', price: '912.45', change: '+0.87%', gain: true },
  { ticker: 'IDX30', price: '486.20', change: '-0.31%', gain: false },
]

const trendingStocks = [
  { ticker: 'BBCA', change: '+2.14%', gain: true, sparkline: '0,20 8,14 16,18 24,10 32,15 40,8 48,12 56,4' },
  { ticker: 'TLKM', change: '-0.95%', gain: false, sparkline: '0,4 8,8 16,5 24,12 32,9 40,16 48,14 56,20' },
  { ticker: 'ASII', change: '+1.60%', gain: true, sparkline: '0,18 8,16 16,12 24,14 32,8 40,10 48,6 56,4' },
  { ticker: 'BBRI', change: '+0.73%', gain: true, sparkline: '0,20 8,16 16,20 24,12 32,16 40,10 48,8 56,4' },
]

const newsItems = [75, 55, 85, 60]

const showScrollTop = ref(false)

function onScroll() {
  showScrollTop.value = window.scrollY > window.innerHeight * 0.8
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const activeRow = ref(0)

const animatedCount = ref(0)

onMounted(() => {
  const target = 12450
  const step = Math.ceil(target / 60)
  const countInterval = setInterval(() => {
    animatedCount.value = Math.min(animatedCount.value + step, target)
    if (animatedCount.value >= target) clearInterval(countInterval)
  }, 16)

  const rowInterval = setInterval(() => {
    activeRow.value = (activeRow.value + 1) % trendingStocks.length
  }, 1200)

  window.addEventListener('scroll', onScroll, { passive: true })

  onUnmounted(() => {
    clearInterval(countInterval)
    clearInterval(rowInterval)
    window.removeEventListener('scroll', onScroll)
  })
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Nav -->
    <header class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span class="text-sm font-bold text-primary-foreground">SL</span>
          </div>
          <span class="text-lg font-bold tracking-tight">
            Stox<span class="text-blue-500">Lyz</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleColorMode"
          >
            <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
          <NuxtLink :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')">
            <Button size="sm" class="gap-1.5 bg-white text-blue-700 hover:bg-blue-50">
              {{ userStore.isLoggedIn ? $t('nav.home') : $t('landing.getStarted') }}
            </Button>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden py-20 md:py-32">
      <!-- Background blobs -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div class="relative mx-auto max-w-4xl px-4 text-center">
        <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          {{ $t('landing.marketBadge') }}
        </div>

        <h1 class="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {{ $t('landing.heroTitle') }}<br />
          <span class="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{{ $t('landing.heroHighlight') }}</span>
        </h1>

        <p class="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          {{ $t('landing.heroDesc') }}
        </p>

        <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NuxtLink :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')">
            <Button size="lg" class="gap-2 px-8 bg-white text-blue-700 hover:bg-blue-50">
              {{ userStore.isLoggedIn ? $t('nav.home') : $t('landing.startFree') }}
              <ArrowRight class="h-4 w-4" />
            </Button>
          </NuxtLink>
          <NuxtLink v-if="!userStore.isLoggedIn" :to="localePath('/auth/login')">
            <Button variant="ghost" size="lg" class="gap-2 px-8">
              {{ $t('landing.viewDemo') }}
            </Button>
          </NuxtLink>
        </div>

        <!-- Stats row -->
        <div class="mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <p class="text-3xl font-bold tabular-nums text-blue-700">{{ stat.value }}</p>
            <p class="text-sm text-muted-foreground text-blue-700">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- App preview mockup -->
    <section class="relative py-10 pb-20">
      <div class="mx-auto max-w-5xl px-4">
        <div class="overflow-hidden rounded-2xl border border-border/50 bg-card/60 shadow-2xl backdrop-blur">
          <!-- Browser chrome -->
          <div class="flex h-10 items-center gap-2 border-b border-border/50 bg-muted/50 px-4">
            <div class="h-3 w-3 rounded-full bg-red-500/70" />
            <div class="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div class="h-3 w-3 rounded-full bg-green-500/70" />
            <div class="ml-4 flex-1 rounded bg-background/50 px-3 py-0.5 text-xs text-muted-foreground">
              app.stoxlyz.com/
            </div>
          </div>

          <!-- Dashboard layout -->
          <div class="flex gap-0">
            <!-- Sidebar -->
            <div class="hidden w-44 shrink-0 border-r border-border/40 bg-muted/20 p-3 md:block">
              <div class="mb-4 flex items-center gap-2 px-1">
                <div class="h-5 w-5 rounded bg-primary/80" />
                <div class="h-3 w-16 rounded bg-foreground/30" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2 rounded-lg bg-accent/60 px-2 py-1.5">
                  <div class="h-3 w-3 rounded bg-primary/50" />
                  <div class="h-2.5 w-10 rounded bg-foreground/40" />
                </div>
                <div class="flex items-center gap-2 px-2 py-1.5">
                  <div class="h-3 w-3 rounded bg-muted-foreground/30" />
                  <div class="h-2.5 w-8 rounded bg-muted-foreground/20" />
                </div>
                <div class="flex items-center gap-2 px-2 py-1.5">
                  <div class="h-3 w-3 rounded bg-muted-foreground/30" />
                  <div class="h-2.5 w-12 rounded bg-muted-foreground/20" />
                </div>
              </div>
            </div>

            <!-- Main content -->
            <div class="flex-1 space-y-3 p-4">
              <!-- Market index cards -->
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(card, i) in marketCards"
                  :key="card.ticker"
                  class="rounded-lg border border-border/40 bg-muted/20 p-2.5"
                >
                  <div class="mb-1 text-[10px] font-medium text-muted-foreground">{{ card.ticker }}</div>
                  <div class="text-sm font-bold tabular-nums">{{ card.price }}</div>
                  <div class="mt-0.5 text-[10px] font-semibold tabular-nums" :class="card.gain ? 'text-green-500' : 'text-red-500'">
                    {{ card.change }}
                  </div>
                </div>
              </div>

              <!-- Trending stocks list -->
              <div class="rounded-lg border border-border/40 bg-muted/20 p-3">
                <div class="mb-2.5 text-xs font-semibold text-muted-foreground">{{ $t('landing.mockTrending') }}</div>
                <div class="space-y-2">
                  <div
                    v-for="(stock, i) in trendingStocks"
                    :key="stock.ticker"
                    class="flex items-center gap-2.5 rounded px-1 py-0.5 transition-colors"
                    :class="i === activeRow ? 'bg-accent/50' : ''"
                  >
                    <div class="flex h-6 w-10 shrink-0 items-center justify-center rounded bg-muted/60 text-[9px] font-bold">
                      {{ stock.ticker }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="h-2 w-24 rounded bg-foreground/20" />
                    </div>
                    <div class="shrink-0 text-[10px] font-semibold tabular-nums" :class="stock.gain ? 'text-green-500' : 'text-red-500'">
                      {{ stock.change }}
                    </div>
                    <!-- Animated sparkline -->
                    <svg class="h-6 w-14 shrink-0" viewBox="0 0 56 24" preserveAspectRatio="none">
                      <polyline
                        :points="stock.sparkline"
                        fill="none"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :stroke="stock.gain ? '#22c55e' : '#ef4444'"
                        class="opacity-80"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- News pills -->
              <div class="rounded-lg border border-border/40 bg-muted/20 p-3">
                <div class="mb-2.5 text-xs font-semibold text-muted-foreground">{{ $t('landing.mockNews') }}</div>
                <div class="space-y-1.5">
                  <div v-for="n in newsItems" :key="n" class="flex items-center gap-2">
                    <div class="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <div class="h-2.5 rounded bg-foreground/15" :style="{ width: n + '%' }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20">
      <div class="mx-auto max-w-6xl px-4">
        <div class="mb-12 text-center">
          <h2 class="mb-3 text-3xl font-bold">{{ $t('landing.featuresTitle') }}</h2>
          <p class="text-muted-foreground">{{ $t('landing.featuresSubtitle') }}</p>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group rounded-xl border border-border/50 bg-card/50 p-6 transition-colors hover:border-blue-500/40 hover:bg-card"
          >
            <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
              <component :is="feature.icon" class="h-5 w-5 text-blue-400" />
            </div>
            <h3 class="mb-2 font-semibold">{{ feature.title }}</h3>
            <p class="text-sm text-muted-foreground">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Social proof / Community -->
    <section class="py-20">
      <div class="mx-auto max-w-6xl px-4">
        <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12">
          <div class="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div class="mb-2 flex items-center gap-2">
                <Users class="h-5 w-5 text-blue-200" />
                <span class="text-sm font-medium text-blue-200">{{ $t('landing.communityBadge') }}</span>
              </div>
              <h2 class="mb-3 text-3xl font-bold text-white">
                {{ $t('landing.communityTitle', { n: animatedCount.toLocaleString() }) }}
              </h2>
              <p class="max-w-md text-blue-100">
                {{ $t('landing.communityDesc') }}
              </p>
            </div>
            <div class="flex w-full shrink-0 flex-col gap-3 md:w-auto">
              <a
                href="https://t.me/stoxlyz"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full md:w-auto"
              >
                <Button size="lg" variant="secondary" class="w-full gap-2 bg-white text-blue-700 hover:bg-blue-50">
                  <Zap class="h-4 w-4" />
                  {{ $t('landing.joinTelegram') }}
                </Button>
              </a>
              <NuxtLink :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')" class="w-full md:w-auto">
                <Button size="lg" variant="outline" class="w-full gap-2 bg-white text-blue-700 hover:bg-blue-50">
                  <Star class="h-4 w-4" />
                  {{ userStore.isLoggedIn ? $t('nav.home') : $t('landing.signUpFree') }}
                </Button>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-24 text-center">
      <div class="mx-auto max-w-2xl px-4">
        <h2 class="mb-4 text-3xl font-bold">{{ $t('landing.ctaTitle') }}</h2>
        <p class="mb-8 text-muted-foreground">
          {{ $t('landing.ctaDesc') }}
        </p>
        <NuxtLink :to="userStore.isLoggedIn ? localePath('/home') : localePath('/auth/login')">
          <Button size="lg" class="bg-white text-blue-700 hover:bg-blue-50">
            {{ userStore.isLoggedIn ? $t('nav.home') : $t('landing.ctaButton') }}
            <ChevronRight class="h-4 w-4" />
          </Button>
        </NuxtLink>
      </div>
    </section>

    <!-- Scroll-to-top -->
    <Transition name="fade-up">
      <button
        v-if="showScrollTop"
        aria-label="Back to top"
        class="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        @click="scrollToTop"
      >
        <ArrowUp class="h-4 w-4" />
      </button>
    </Transition>

    <!-- Footer -->
    <footer class="border-t border-border/40 py-8">
      <div class="mx-auto max-w-6xl px-4">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div class="flex items-center gap-2">
            <div class="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span class="text-xs font-bold text-primary-foreground">SL</span>
            </div>
            <span class="font-semibold">Stox<span class="text-blue-500">Lyz</span></span>
          </div>
          <p class="text-center text-xs text-muted-foreground">
            {{ $t('landing.footerDisclaimer') }}
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
