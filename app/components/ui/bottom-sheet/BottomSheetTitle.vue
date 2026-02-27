<script setup lang="ts">
import type { DialogTitleProps } from "reka-ui";
import { DialogTitle } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<
	DialogTitleProps & { class?: HTMLAttributes["class"] }
>();
</script>

<template>
  <DialogTitle :class="cn('text-base font-semibold leading-tight', props.class)" v-bind="props">
    <slot />
  </DialogTitle>
</template>
