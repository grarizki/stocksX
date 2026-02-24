<script setup lang="ts">
import { DUMMY_NEWS } from '@/data/newsData'

const { t } = useI18n()
useHead({ title: computed(() => `${t('news.title')} - StoxLyz`) })

const featured = DUMMY_NEWS[0]
const rest = DUMMY_NEWS.slice(1)
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold">{{ $t('news.title') }}</h1>
    <p class="mb-4 text-sm text-muted-foreground">{{ $t('news.subtitle') }}</p>

    <div class="space-y-4">
      <NewsFeatured v-if="featured" :article="featured" />

      <div class="space-y-2">
        <NewsCard
          v-for="article in rest"
          :key="article.id"
          :article="article"
          class="animate-slide-up"
        />
      </div>
    </div>
  </div>
</template>
