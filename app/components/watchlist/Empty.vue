<script setup lang="ts">
import { Star, Search, StarIcon } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <StarIcon class="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 class="mb-1 text-lg font-semibold">{{ $t('watchlist.emptyTitle') }}</h3>
    <p class="mb-6 max-w-xs text-sm text-muted-foreground">
      {{ $t('watchlist.emptyDesc') }}
    </p>
    <Button as-child>
      <NuxtLink to="/" class="gap-2">
        <Search class="h-4 w-4" />
        {{ $t('watchlist.browseStocks') }}
      </NuxtLink>
    </Button>
  </div>
</template>
