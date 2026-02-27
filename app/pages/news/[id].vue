<script setup lang="ts">
import { ChevronLeft, ExternalLink } from "lucide-vue-next";
import { timeAgo } from "@/lib/utils";

const route = useRoute();
const localePath = useLocalePath();
const { articles, pending, fetchAll } = useNews();

onMounted(fetchAll);

const article = computed(() => {
	const idx = Number(route.params.id);
	return articles.value[idx] ?? null;
});

watch([pending, article], ([isPending, art]) => {
	if (!isPending && art === null && articles.value.length > 0) {
		navigateTo(localePath("/news"), { replace: true });
	}
});

const imgLoaded = ref(false);
watch(article, () => {
	imgLoaded.value = false;
});

useHead({
	title: computed(() =>
		article.value ? `${article.value.title} - StoxLyz` : "Berita - StoxLyz",
	),
});

useSeoMeta({
	ogTitle: computed(() => article.value?.title ?? "Berita - StoxLyz"),
	ogDescription: computed(() => article.value?.contentSnippet ?? ""),
	ogImage: computed(() => article.value?.image?.large ?? "/og-image.png"),
	ogType: "article",
	twitterCard: "summary_large_image",
	twitterTitle: computed(() => article.value?.title ?? "Berita - StoxLyz"),
	twitterDescription: computed(() => article.value?.contentSnippet ?? ""),
	twitterImage: computed(() => article.value?.image?.large ?? "/og-image.png"),
});
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="pending || (!article && !pending && articles.length === 0)" class="space-y-4">
      <div class="aspect-video w-full animate-pulse rounded-xl bg-muted/50" />
      <div class="space-y-3 px-1">
        <div class="h-3 w-24 animate-pulse rounded bg-muted/50" />
        <div class="h-6 w-full animate-pulse rounded bg-muted/50" />
        <div class="h-6 w-4/5 animate-pulse rounded bg-muted/50" />
        <div class="h-4 w-full animate-pulse rounded bg-muted/50" />
        <div class="h-4 w-full animate-pulse rounded bg-muted/50" />
        <div class="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
      </div>
    </div>

    <!-- Article detail -->
    <div v-else-if="article" class="pb-8">
      <!-- Image -->
      <div v-if="article.image?.large" class="relative mb-4 aspect-video w-full overflow-hidden rounded-xl">
        <div v-if="!imgLoaded" class="absolute inset-0 animate-pulse bg-muted" />
        <img
          :src="article.image.large"
          :alt="article.title"
          class="h-full w-full object-cover transition-opacity duration-300"
          :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
          @load="imgLoaded = true"
        >
      </div>

      <!-- Meta -->
      <div class="mb-3 flex items-center gap-2">
        <Badge variant="secondary" class="text-[10px]">{{ article.source }}</Badge>
        <span class="text-[10px] text-muted-foreground">{{ timeAgo(article.isoDate) }}</span>
      </div>

      <!-- Title -->
      <h1 class="mb-3 text-xl font-bold leading-snug">{{ article.title }}</h1>

      <!-- Snippet -->
      <p class="mb-6 text-sm leading-relaxed text-muted-foreground">{{ article.contentSnippet }}</p>

      <!-- Read more -->
      <a
        :href="article.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 active:scale-[0.98]"
      >
        <ExternalLink class="h-4 w-4" />
        Baca Selengkapnya
      </a>

      <!-- Back -->
      <NuxtLink
        :to="localePath('/news')"
        class="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/20"
      >
        <ChevronLeft class="h-4 w-4" />
        Kembali ke Berita
      </NuxtLink>
    </div>
  </div>
</template>
