<script setup lang="ts">
import type { NewsArticle } from '@/composables/useNews'
import { timeAgo } from '@/lib/utils'

defineProps<{ article: NewsArticle }>()

const loaded = ref(false)
</script>

<template>
  <a
    :href="article.url"
    target="_blank"
    rel="noopener noreferrer"
    class="block overflow-hidden rounded-xl border border-border/50 bg-card/50 transition-transform hover:scale-[1.01]"
  >
    <div class="relative aspect-video w-full overflow-hidden">
      <div
        v-if="!loaded"
        class="absolute inset-0 animate-pulse bg-muted"
      />
      <img
        :src="article.imageUrl"
        :alt="article.title"
        class="h-full w-full object-cover transition-opacity duration-300"
        :class="loaded ? 'opacity-100' : 'opacity-0'"
        loading="lazy"
        @load="loaded = true"
      >
    </div>
    <div class="p-4">
      <div class="mb-2 flex items-center gap-2">
        <Badge variant="secondary" class="text-[10px]">{{ article.category }}</Badge>
        <span class="text-[10px] text-muted-foreground">{{ article.source }}</span>
        <span class="text-[10px] text-muted-foreground">{{ timeAgo(article.date) }}</span>
      </div>
      <h2 class="mb-1 text-lg font-bold leading-tight">{{ article.title }}</h2>
      <p class="line-clamp-2 text-sm text-muted-foreground">{{ article.summary }}</p>
      <div v-if="article.relatedTickers.length" class="mt-3 flex flex-wrap gap-1">
        <Badge
          v-for="ticker in article.relatedTickers"
          :key="ticker"
          variant="outline"
          class="text-[10px]"
        >
          {{ ticker }}
        </Badge>
      </div>
    </div>
  </a>
</template>
