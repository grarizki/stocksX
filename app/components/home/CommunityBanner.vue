<script setup lang="ts">
import { ArrowRight, MessageCircle, Sparkles, Users } from "lucide-vue-next";

const { t } = useI18n();

const memberCount = ref(0);
const targetMembers = 12_450;

onMounted(() => {
	const duration = 1500;
	const start = performance.now();
	function tick(now: number) {
		const progress = Math.min((now - start) / duration, 1);
		const eased = 1 - (1 - progress) ** 3;
		memberCount.value = Math.round(targetMembers * eased);
		if (progress < 1) requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
});
</script>

<template>
  <section class="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-indigo-500/10 p-5">
    <!-- Animated background dots -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
      <div class="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
    </div>

    <div class="relative flex items-start justify-between gap-4">
      <div class="flex-1">
        <div class="mb-2 flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <MessageCircle class="h-4 w-4 text-blue-400" />
          </div>
          <div class="flex items-center gap-1.5">
            <Sparkles class="h-3 w-3 text-yellow-400" />
            <span class="text-xs font-semibold text-blue-400">{{ $t('home.community') }}</span>
          </div>
        </div>

        <h3 class="mb-1 text-lg font-bold">{{ $t('home.joinCommunity') }}</h3>
        <p class="mb-3 text-xs leading-relaxed text-muted-foreground">
          {{ $t('home.communityDesc') }}
        </p>

        <!-- Live member count -->
        <div class="mb-4 flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <Users class="h-3.5 w-3.5 text-muted-foreground" />
            <span class="text-sm font-bold tabular-nums">{{ memberCount.toLocaleString('en-US') }}</span>
            <span class="text-xs text-muted-foreground">{{ $t('home.members') }}</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span class="text-xs text-green-500">{{ $t('home.online', { n: '1,247' }) }}</span>
          </div>
        </div>

        <a
          href="https://t.me/***"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-400 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0 active:scale-[0.98]"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          {{ $t('home.joinTelegram') }}
          <ArrowRight class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  </section>
</template>
