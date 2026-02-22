<script setup lang="ts">
const { t } = useI18n()
useHead({ title: computed(() => `${t('home.ihsgComposite')} - StoxLyz`) })
</script>

<template>
  <div class="space-y-6">
    <HomeCommunityBanner />
    <HomeMarketOverview />
    <HomeTrendingStocks />
    <HomeTopMovers />
    <HomeSectorHeatmap />
    <HomeQuickNews />
  </div>
</template>
