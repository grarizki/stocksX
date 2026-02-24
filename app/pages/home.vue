<script setup lang="ts">
const { t } = useI18n()
useHead({ title: computed(() => `${t('home.ihsgComposite')} - StoxLyz`) })
</script>

<template>
  <div class="space-y-5">
    <HomeCommunityBanner />
    <HomeMarketOverview />
    <HomeTrendingStocks />
    <HomeTopMovers />
    <HomeSectorHeatmap />
    <HomeQuickNews />
  </div>
</template>
