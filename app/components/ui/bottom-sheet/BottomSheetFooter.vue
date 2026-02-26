<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <div :class="cn('flex flex-col gap-2 px-4 py-3 border-t border-border/50 shrink-0', props.class)">
    <slot />
  </div>
</template>
