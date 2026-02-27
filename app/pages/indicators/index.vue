<script setup lang="ts">
import { LayoutGrid, Table2 } from "lucide-vue-next";
import { useIndicators } from "~/composables/useIndicators";

const { t } = useI18n();
useHead({ title: computed(() => `${t("indicators.title")} - StoxLyz`) });

const { getIndicators } = useIndicators();
const allIndicators = getIndicators();

const viewMode = ref<"grid" | "table">("grid");
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ $t('indicators.title') }}</h1>
        <p class="text-sm text-muted-foreground">{{ $t('indicators.subtitle') }}</p>
      </div>

      <div class="flex rounded-lg border border-border/50 p-0.5" role="group" :aria-label="$t('indicators.title')">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          :class="viewMode === 'grid' && 'bg-accent'"
          :aria-label="$t('indicators.gridView')"
          :aria-pressed="viewMode === 'grid'"
          @click="viewMode = 'grid'"
        >
          <LayoutGrid class="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          :class="viewMode === 'table' && 'bg-accent'"
          :aria-label="$t('indicators.tableView')"
          :aria-pressed="viewMode === 'table'"
          @click="viewMode = 'table'"
        >
          <Table2 class="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <IndicatorsCard
        v-for="indicator in allIndicators"
        :key="indicator.id"
        :indicator="indicator"
        class="animate-slide-up"
      />
    </div>

    <!-- Table View -->
    <IndicatorsTable v-else :indicators="allIndicators" />
  </div>
</template>
