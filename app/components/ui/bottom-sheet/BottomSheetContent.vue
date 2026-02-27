<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { DialogContentEmits, DialogContentProps } from "reka-ui";
import {
	DialogClose,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	useForwardPropsEmits,
} from "reka-ui";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props extends DialogContentProps {
	class?: HTMLAttributes["class"];
	/** Show the drag handle indicator at the top */
	handle?: boolean;
	/** Show the X close button */
	showClose?: boolean;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
	handle: true,
	showClose: false,
});

const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, "class", "handle", "showClose");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      :class="cn(
        'fixed inset-x-0 bottom-0 z-50 flex flex-col',
        'rounded-t-2xl border-t border-border/50 bg-background shadow-xl',
        'max-h-[85dvh]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        'data-[state=open]:duration-300 data-[state=closed]:duration-200',
        'focus:outline-none',
        props.class,
      )"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <!-- Drag handle -->
      <div v-if="handle" class="flex justify-center pt-3 pb-1 shrink-0">
        <div class="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      <!-- Close button -->
      <DialogClose
        v-if="showClose"
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
        <span class="sr-only">Close</span>
      </DialogClose>

      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto overscroll-contain pb-safe">
        <slot />
      </div>
    </DialogContent>
  </DialogPortal>
</template>
