<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import type { AlertCondition } from "~/stores/priceAlert";
import { usePriceAlertStore } from "~/stores/priceAlert";

const props = defineProps<{ ticker: string; price: number }>();

const { t } = useI18n();
const store = usePriceAlertStore();

const activeAlerts = computed(() => store.alertsForTicker(props.ticker));
const alertLog = computed(() => store.logForTicker(props.ticker));

const condition = ref<AlertCondition>("above");
const targetPrice = ref<string>("");
const error = ref("");

function submit() {
	const val = Number(targetPrice.value);
	if (!val || val <= 0) {
		error.value = t("stock.priceAlert.invalidPrice");
		return;
	}
	error.value = "";
	store.addAlert(props.ticker, condition.value, val);
	targetPrice.value = "";
}

function formatDate(ts: number) {
	return new Date(ts).toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
</script>

<template>
  <div>
    <!-- Active alerts -->
    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ $t('stock.priceAlert.title') }}</p>

    <div v-if="activeAlerts.length" class="mb-3 space-y-2">
      <div
        v-for="alert in activeAlerts"
        :key="alert.id"
        class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
      >
        <div class="text-sm">
          <span class="font-medium">{{ alert.condition === 'above' ? '≥' : '≤' }}</span>
          <span class="ml-1 font-bold">{{ alert.targetPrice.toLocaleString('id-ID') }}</span>
          <span class="ml-1 text-xs text-muted-foreground">IDR</span>
        </div>
        <button
          class="rounded p-1 text-muted-foreground hover:text-destructive"
          @click="store.removeAlert(alert.id)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <div v-else class="mb-3 rounded-lg border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
      {{ $t('stock.priceAlert.noAlert') }}
    </div>

    <!-- Create form -->
    <div class="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p class="mb-2 text-xs font-semibold text-muted-foreground">{{ $t('stock.priceAlert.createNew') }}</p>
      <div class="flex gap-2">
        <select
          v-model="condition"
          class="rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="above">{{ $t('stock.priceAlert.above') }}</option>
          <option value="below">{{ $t('stock.priceAlert.below') }}</option>
        </select>
        <input
          v-model="targetPrice"
          type="number"
          inputmode="numeric"
          :placeholder="$t('stock.priceAlert.targetPrice')"
          class="min-w-0 flex-1 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          @keydown.enter="submit"
        />
        <button
          class="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 active:scale-95"
          @click="submit"
        >
          <Plus class="h-3.5 w-3.5" />
          {{ $t('stock.priceAlert.set') }}
        </button>
      </div>
      <p v-if="error" class="mt-1.5 text-xs text-destructive">{{ error }}</p>
      <p class="mt-1.5 text-xs text-muted-foreground">
        {{ $t('stock.priceAlert.currentPrice') }} <span class="font-medium text-foreground">{{ price.toLocaleString('id-ID') }} IDR</span>
      </p>
    </div>

    <!-- Alert log -->
    <div class="mt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ $t('stock.priceAlert.alertLog') }}</p>
      <div v-if="alertLog.length" class="space-y-1.5">
        <div
          v-for="entry in alertLog"
          :key="entry.id"
          class="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-xs"
        >
          <div>
            <span class="font-medium">{{ entry.condition === 'above' ? '≥' : '≤' }} {{ entry.targetPrice.toLocaleString('id-ID') }} IDR</span>
            <span class="ml-2 text-muted-foreground">{{ $t('stock.priceAlert.triggered') }}</span>
          </div>
          <span class="text-muted-foreground">{{ formatDate(entry.triggeredAt) }}</span>
        </div>
      </div>
      <div v-else class="rounded-lg border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground">
        {{ $t('stock.priceAlert.noLog') }}
      </div>
    </div>
  </div>
</template>
