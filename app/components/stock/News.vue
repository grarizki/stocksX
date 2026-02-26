<script setup lang="ts">
import { timeAgo } from '@/lib/utils'

defineProps<{ ticker: string }>()

const { articles, pending, fetchAll } = useNews()

onMounted(fetchAll)

// Show up to 5 most recent articles (no per-ticker filtering — general economic news)
const displayed = computed(() => articles.value.slice(0, 5))
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <h3 class="mb-3 text-sm font-semibold">{{ $t('stock.relatedNews') }}</h3>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-lg bg-muted/50" />
    </div>

    <div v-else-if="displayed.length" class="space-y-3">
      <a
        v-for="article in displayed"
        :key="article.link"
        :href="article.link"
        target="_blank"
        rel="noopener noreferrer"
        class="block rounded-lg p-2 transition-colors hover:bg-accent/30"
      >
        <p class="line-clamp-2 text-sm font-medium leading-snug">{{ article.title }}</p>
        <div class="mt-1 flex items-center gap-2">
          <span class="text-[10px] text-muted-foreground">{{ article.source }}</span>
          <span class="text-[10px] text-muted-foreground">{{ timeAgo(article.isoDate) }}</span>
        </div>
      </a>
    </div>

    <p v-else class="text-xs text-muted-foreground">No news available.</p>
  </Card>
</template>
