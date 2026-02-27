<script setup lang="ts">
const { t } = useI18n();
const modelValue = defineModel<string>({ default: "all" });

const categories = computed(() => [
	{ value: "all", label: t("news.catAll") },
	{ value: "market", label: t("news.catMarket") },
	{ value: "stocks", label: t("news.catStocks") },
	{ value: "economy", label: t("news.catEconomy") },
	{ value: "education", label: t("news.catEducation") },
]);
</script>

<template>
  <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
    <Button
      v-for="cat in categories"
      :key="cat.value"
      :variant="modelValue === cat.value ? 'default' : 'outline'"
      size="sm"
      class="shrink-0 text-xs"
      @click="modelValue = cat.value"
    >
      {{ cat.label }}
    </Button>
  </div>
</template>
