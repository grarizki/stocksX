<script setup lang="ts">
import { timeAgo } from '@/lib/utils'
import { DUMMY_NEWS } from '@/data/newsData'

const props = defineProps<{ ticker: string }>()

// Filter news relevant to this ticker (by relatedTickers or title mention)
const tickerCode = computed(() => props.ticker.replace('.JK', ''))

const articles = computed(() =>
  DUMMY_NEWS.filter(
    (a) =>
      a.relatedTickers.includes(props.ticker) ||
      a.title.includes(tickerCode.value) ||
      a.summary.includes(tickerCode.value),
  ).slice(0, 3),
)
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <h3 class="mb-3 text-sm font-semibold">{{ $t('stock.relatedNews') }}</h3>

    <div v-if="articles.length" class="space-y-3">
      <a
        v-for="article in articles"
        :key="article.id"
        :href="article.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block rounded-lg p-2 transition-colors hover:bg-accent/30"
      >
        <p class="line-clamp-2 text-sm font-medium leading-snug">{{ article.title }}</p>
        <div class="mt-1 flex items-center gap-2">
          <span class="text-[10px] text-muted-foreground">{{ article.source }}</span>
          <span class="text-[10px] text-muted-foreground">{{ timeAgo(article.date) }}</span>
        </div>
      </a>
    </div>

    <p v-else class="text-xs text-muted-foreground">No related news found.</p>
  </Card>
</template>
