<script setup lang="ts">
import {
	BarChart2,
	Building2,
	Home,
	LogIn,
	Newspaper,
	TrendingUp,
} from "lucide-vue-next";

const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const userStore = useUserStore();

const navItems = computed(() => [
	{ label: t("nav.home"), icon: Home, to: "/home" },
	{ label: t("nav.stocks"), icon: TrendingUp, to: "/stocks" },
	{ label: t("nav.news"), icon: Newspaper, to: "/news" },
	{ label: t("nav.indicators"), icon: BarChart2, to: "/indicators" },
]);

const isActive = (to: string) => {
	const path = route.path.replace(/^\/(id|en)/, "") || "/";
	if (to === "/home") return path === "/home";
	return path.startsWith(to);
};

const isProfileActive = computed(() => {
	const path = route.path.replace(/^\/(id|en)/, "") || "/";
	return path.startsWith("/settings") || path.startsWith("/auth");
});

const initials = computed(() => {
	if (!userStore.profile?.name) return "?";
	return userStore.profile.name
		.split(" ")
		.slice(0, 2)
		.map((w: string) => w[0])
		.join("")
		.toUpperCase();
});
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 backdrop-blur-xl bg-card/80 pb-safe">
    <div class="flex items-center justify-around px-2 pt-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="localePath(item.to)"
        :title="item.label"
        class="flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors"
        :class="isActive(item.to) ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'"
      >
        <component
          :is="item.icon"
          class="h-5 w-5 transition-transform"
          :class="isActive(item.to) && 'scale-110'"
        />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
        <div v-if="isActive(item.to)" class="mt-0.5 h-0.5 w-4 rounded-full bg-blue-500" />
      </NuxtLink>

      <!-- Profile (logged in) -->
      <NuxtLink
        v-if="userStore.isLoggedIn"
        :to="localePath('/settings')"
        :title="userStore.profile!.name"
        class="flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors"
        :class="isProfileActive ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'"
      >
        <div
          class="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-transform"
          :class="[
            isProfileActive ? 'bg-blue-500 text-white scale-110' : 'bg-muted text-foreground'
          ]"
        >
          {{ initials }}
        </div>
        <span class="text-[10px] font-medium">{{ userStore.profile!.name.split(' ')[0] }}</span>
        <div v-if="isProfileActive" class="mt-0.5 h-0.5 w-4 rounded-full bg-blue-500" />
      </NuxtLink>

      <!-- Login (logged out) -->
      <NuxtLink
        v-else
        :to="localePath('/auth/login')"
        :title="t('nav.login')"
        class="flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors"
        :class="isProfileActive ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground'"
      >
        <LogIn class="h-5 w-5 transition-transform" :class="isProfileActive && 'scale-110'" />
        <span class="text-[10px] font-medium">{{ t('nav.login') }}</span>
        <div v-if="isProfileActive" class="mt-0.5 h-0.5 w-4 rounded-full bg-blue-500" />
      </NuxtLink>
    </div>
  </nav>
</template>
