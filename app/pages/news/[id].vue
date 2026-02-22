<script setup lang="ts">
// Articles now link directly to Yahoo Finance — this route is no longer used.
// Redirect anyone landing here back to the news index.
const localePath = useLocalePath()
navigateTo(localePath('/news'), { replace: true })
</script>

<template>
  <div />
</template>
