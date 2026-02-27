<script setup lang="ts">
import { ExternalLink, Newspaper, TrendingUp } from "lucide-vue-next";
import { IDX_STOCKS } from "@/data/idxStocks";

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

const open = defineModel<boolean>("open", { default: false });

const searchQuery = ref("");
const debouncedQuery = ref("");

let debounceTimer: ReturnType<typeof setTimeout>;
watch(searchQuery, (val) => {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debouncedQuery.value = val.trim();
	}, 350);
});

const { data: newsData } = useApiFetch("/api/news", {
	query: computed(() => ({
		q: debouncedQuery.value || "stock market",
		limit: 8,
	})),
	watch: [debouncedQuery],
});

const filteredNews = computed(() => (newsData.value as any[]) ?? []);

const filteredStocks = computed(() => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return [];
	return IDX_STOCKS.filter(
		(s) =>
			s.ticker.replace(".JK", "").toLowerCase().includes(q) ||
			s.name.toLowerCase().includes(q),
	).slice(0, 10);
});

function openArticle(url: string) {
	open.value = false;
	searchQuery.value = "";
	window.open(url, "_blank", "noopener,noreferrer");
}

function goToStock(ticker: string) {
	open.value = false;
	searchQuery.value = "";
	router.push(localePath(`/stocks/${ticker.replace(".JK", "")}`));
}

onMounted(() => {
	const handler = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "k") {
			e.preventDefault();
			open.value = !open.value;
		}
	};
	document.addEventListener("keydown", handler);
	onUnmounted(() => document.removeEventListener("keydown", handler));
});
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput
      v-model="searchQuery"
      :placeholder="t('search.placeholder')"
    />
    <CommandList>
      <CommandEmpty>{{ $t('search.noResults') }}</CommandEmpty>

      <!-- Stocks results -->
      <CommandGroup v-if="filteredStocks.length" :heading="$t('search.headingStocks')">
        <CommandItem
          v-for="stock in filteredStocks"
          :key="stock.ticker"
          :value="stock.ticker"
          class="flex cursor-pointer items-center gap-3"
          @select="goToStock(stock.ticker)"
        >
          <TrendingUp class="h-4 w-4 shrink-0 text-muted-foreground" />
          <div class="flex-1 overflow-hidden">
            <span class="font-semibold">{{ stock.ticker.replace('.JK', '') }}</span>
            <span class="ml-2 truncate text-xs text-muted-foreground">{{ stock.name }}</span>
          </div>
        </CommandItem>
      </CommandGroup>

      <!-- News results -->
      <CommandGroup :heading="$t('search.heading')">
        <CommandItem
          v-for="article in filteredNews"
          :key="article.id"
          :value="article.id"
          class="flex cursor-pointer items-start gap-3"
          @select="openArticle(article.url)"
        >
          <Newspaper class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div class="flex-1 overflow-hidden">
            <p class="truncate text-sm font-medium">{{ article.title }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ article.source }}</p>
          </div>
          <ExternalLink class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
