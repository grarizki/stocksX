<script setup lang="ts">
import type { NewsArticle } from "@/composables/useNews";
import { timeAgo } from "@/lib/utils";

defineProps<{ article: NewsArticle; index: number }>();

const localePath = useLocalePath();
const loaded = ref(false);
</script>

<template>
  <NuxtLink
    :to="localePath(`/news/${index}`)"
    class="flex w-full gap-3 rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-colors hover:bg-accent/20 active:scale-[0.99]"
  >
    <div v-if="article.image?.small" class="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
      <div v-if="!loaded" class="absolute inset-0 animate-pulse bg-muted" />
      <img
        :src="article.image.small"
        :alt="article.title"
        class="h-full w-full object-cover transition-opacity duration-300"
        :class="loaded ? 'opacity-100' : 'opacity-0'"
        loading="lazy"
        @load="loaded = true"
      >
    </div>
    <div class="flex-1 overflow-hidden">
      <p class="line-clamp-2 text-sm font-medium leading-snug">{{ article.title }}</p>
      <p class="mt-1 line-clamp-1 text-xs text-muted-foreground">{{ article.contentSnippet }}</p>
      <div class="mt-2 flex items-center gap-2">
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0">{{ article.source }}</Badge>
        <span class="text-[10px] text-muted-foreground">{{ timeAgo(article.isoDate) }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
