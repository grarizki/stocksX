<script setup lang="ts">
import { timeAgo } from '@/lib/utils'

const props = defineProps<{ ticker: string }>()

const { data: articles, status } = useApiFetch('/api/news', {
  query: { q: props.ticker, limit: 3 },
})
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <h3 class="mb-3 text-sm font-semibold">{{ $t('stock.relatedNews') }}</h3>

    <div v-if="status === 'pending'" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-lg bg-muted/30" />
    </div>

    <div v-else class="space-y-3">
      <a
        v-for="article in (articles as any[])"
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
  </Card>
</template>
