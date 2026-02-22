<script setup lang="ts">
import { Search, Newspaper, ExternalLink } from 'lucide-vue-next'

const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })

const searchQuery = ref('')
const debouncedQuery = ref('stock market')

let debounceTimer: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val || 'stock market'
  }, 350)
})

const { data: newsData } = useApiFetch('/api/news', {
  query: computed(() => ({ q: debouncedQuery.value, limit: 8 })),
  watch: [debouncedQuery],
})

const filteredNews = computed(() => (newsData.value as any[]) ?? [])

function openArticle(url: string) {
  open.value = false
  searchQuery.value = ''
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      open.value = !open.value
    }
  }
  document.addEventListener('keydown', handler)
  onUnmounted(() => document.removeEventListener('keydown', handler))
})
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput
      v-model="searchQuery"
      :placeholder="t('search.placeholder')"
    />
    <CommandList>
      <CommandEmpty>{{ $t('search.noResults') }}</CommandEmpty>
      <CommandGroup :heading="$t('search.heading')">
        <CommandItem
          v-for="article in filteredNews"
          :key="article.id"
          :value="article.id"
          class="flex cursor-pointer items-start gap-3"
          @select="openArticle(article.url)"
        >
          <Newspaper class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div class="flex-1 overflow-hidden">
            <p class="truncate text-sm font-medium">{{ article.title }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ article.source }}</p>
          </div>
          <ExternalLink class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
