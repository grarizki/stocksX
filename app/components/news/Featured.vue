<script setup lang="ts">
import type { NewsArticle } from '@/composables/useNews'
import { timeAgo } from '@/lib/utils'

defineProps<{ article: NewsArticle; index?: number }>()

const localePath = useLocalePath()
const loaded = ref(false)
</script>

<template>
  <NuxtLink
    :to="localePath(`/news/${index ?? 0}`)"
    class="block overflow-hidden rounded-xl border border-border/50 bg-card/50 transition-transform hover:scale-[1.01]"
  >
    <div v-if="article.image?.large" class="relative aspect-video w-full overflow-hidden">
      <div
        v-if="!loaded"
        class="absolute inset-0 animate-pulse bg-muted"
      />
      <img
        :src="article.image.large"
        :alt="article.title"
        class="h-full w-full object-cover transition-opacity duration-300"
        :class="loaded ? 'opacity-100' : 'opacity-0'"
        loading="lazy"
        @load="loaded = true"
      >
    </div>
    <div class="p-4">
      <div class="mb-2 flex items-center gap-2">
        <span class="text-[10px] text-muted-foreground">{{ article.source }}</span>
        <span class="text-[10px] text-muted-foreground">{{ timeAgo(article.isoDate) }}</span>
      </div>
      <h2 class="mb-1 text-lg font-bold leading-tight">{{ article.title }}</h2>
      <p class="line-clamp-2 text-sm text-muted-foreground">{{ article.contentSnippet }}</p>
    </div>
  </NuxtLink>
</template>
