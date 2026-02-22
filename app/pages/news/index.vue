<script setup lang="ts">
import type { NewsArticle } from '~/composables/useNews'

const { t } = useI18n()
useHead({ title: computed(() => `${t('news.title')} - StoxLyz`) })

const { data: articles, status } = useApiFetch<NewsArticle[]>('/api/news', { query: { limit: 30 } })

const featured = computed(() => articles.value?.[0] ?? null)
const rest = computed(() => articles.value?.slice(1) ?? [])
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold">{{ $t('news.title') }}</h1>
    <p class="mb-4 text-sm text-muted-foreground">{{ $t('news.subtitle') }}</p>

    <!-- Skeleton -->
    <div v-if="status === 'pending'" class="space-y-4">
      <div class="aspect-video w-full animate-pulse rounded-xl bg-muted/20" />
      <div v-for="i in 5" :key="i" class="h-24 animate-pulse rounded-lg border border-border/30 bg-muted/20" />
    </div>

    <div v-else class="space-y-4">
      <NewsFeatured v-if="featured" :article="featured" />

      <div class="space-y-2">
        <NewsCard
          v-for="article in rest"
          :key="article.id"
          :article="article"
          class="animate-slide-up"
        />
      </div>

      <p v-if="!articles?.length" class="py-12 text-center text-sm text-muted-foreground">
        {{ $t('news.noArticles') }}
      </p>
    </div>
  </div>
</template>
