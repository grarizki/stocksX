<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { Stock } from '@/data/stocks'

defineProps<{ stock: Stock }>()

const expanded = ref(false)
</script>

<template>
  <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
    <h3 class="mb-2 text-sm font-semibold">{{ $t('stock.about') }} {{ stock.ticker.replace('.JK', '') }}</h3>
    <p
      class="text-sm leading-relaxed text-muted-foreground transition-all"
      :class="!expanded && 'line-clamp-3'"
    >
      {{ stock.about }}
    </p>
    <Button
      variant="ghost"
      size="sm"
      class="mt-2 h-7 px-2 text-xs text-blue-500"
      @click="expanded = !expanded"
    >
      {{ expanded ? $t('stock.showLess') : $t('stock.readMore') }}
      <ChevronDown
        class="ml-1 h-3 w-3 transition-transform"
        :class="expanded && 'rotate-180'"
      />
    </Button>
  </Card>
</template>
