<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { t } = useI18n()
useHead({ title: computed(() => `${t('news.title')} - StoxLyz`) })

const { articles, pending, fetchAll } = useNews()
onMounted(fetchAll)

const PAGE_SIZE = 10
const page = ref(1)

watch(articles, () => { page.value = 1 })

const featuredIndex = computed(() => articles.value.findIndex(a => !!a.image?.large))
const featured = computed(() => featuredIndex.value >= 0 ? articles.value[featuredIndex.value] : null)
const rest = computed(() => articles.value.filter((a, i) => i !== featuredIndex.value && !!a.image?.small))

const pageCount = computed(() => Math.ceil(rest.value.length / PAGE_SIZE))
const paged = computed(() => {
  const offset = (page.value - 1) * PAGE_SIZE
  return rest.value.slice(offset, offset + PAGE_SIZE).map((article) => ({
    article,
    index: articles.value.indexOf(article),
  }))
})

function prevPage() {
  page.value--
  nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
}

function nextPage() {
  page.value++
  nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold">{{ $t('news.title') }}</h1>
    <p class="mb-4 text-sm text-muted-foreground">{{ $t('news.subtitle') }}</p>

    <div v-if="pending" class="space-y-4">
      <div class="aspect-video w-full animate-pulse rounded-xl bg-muted/50" />
      <div class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-muted/50" />
      </div>
    </div>

    <div v-else class="space-y-4">
      <NewsFeatured v-if="featured" :article="featured" :index="featuredIndex" />

      <div class="space-y-2">
        <NewsCard
          v-for="{ article, index } in paged"
          :key="article.link"
          :article="article"
          :index="index"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pageCount > 1" class="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          :disabled="page === 1"
          @click="prevPage"
        >
          <ChevronLeft class="h-4 w-4" />
          Prev
        </Button>
        <span class="text-xs text-muted-foreground">{{ page }} / {{ pageCount }}</span>
        <Button
          variant="outline"
          size="sm"
          :disabled="page === pageCount"
          @click="nextPage"
        >
          Next
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
