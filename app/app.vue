<script setup lang="ts">
const userStore = useUserStore()
</script>

<template>
  <div v-if="!userStore.authReady" class="fixed inset-0 z-[9999] bg-background" />
  <NuxtLayout>
    <NuxtErrorBoundary>
      <NuxtPage v-if="userStore.authReady" />
    </NuxtErrorBoundary>
  </NuxtLayout>
</template>
