<script setup lang="ts">
import { AlertTriangle } from "lucide-vue-next";
</script>

<template>
  <div class="rounded-lg border border-border/50 bg-muted/30 p-4">
    <div class="flex items-start gap-3">
      <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
      <div class="text-xs leading-relaxed text-muted-foreground">
        <p class="mb-1 font-semibold text-foreground/80">{{ $t('disclaimer.title') }}</p>
        <p>{{ $t('disclaimer.text') }}</p>
      </div>
    </div>
  </div>
</template>
