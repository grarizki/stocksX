<script setup lang="ts">
import { Home, Newspaper, BarChart2, TrendingUp, Settings, LogIn, LogOut, Building2 } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const userStore = useUserStore()

const navItems = computed(() => [
  { label: t('nav.home'), icon: Home, to: '/home' },
  { label: t('nav.stocks'), icon: TrendingUp, to: '/stocks' },
  { label: t('nav.news'), icon: Newspaper, to: '/news' },
  { label: t('nav.indicators'), icon: BarChart2, to: '/indicators' },
])

const isActive = (to: string) => {
  const path = route.path.replace(/^\/(id|en)/, '') || '/'
  if (to === '/home') return path === '/home'
  return path.startsWith(to)
}

async function handleLogout() {
  userStore.logout()
  await navigateTo(localePath('/auth/login'))
}

const initials = computed(() => {
  if (!userStore.profile?.name) return '?'
  return userStore.profile.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
})
</script>

<template>
  <aside class="sticky top-14 flex h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-border/50 px-3 py-4">
    <nav class="flex flex-1 flex-col gap-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="localePath(item.to)"
        :title="item.label"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="isActive(item.to)
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'"
      >
        <component :is="item.icon" class="h-4 w-4" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <Separator class="my-2" />

    <nav class="flex flex-col gap-1">
      <NuxtLink
        :to="localePath('/settings')"
        :title="t('nav.settings')"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <Settings class="h-4 w-4" />
        {{ t('nav.settings') }}
      </NuxtLink>

      <!-- Logged out: show Login link -->
      <NuxtLink
        v-if="!userStore.isLoggedIn"
        :to="localePath('/auth/login')"
        :title="t('nav.login')"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <LogIn class="h-4 w-4" />
        {{ t('nav.login') }}
      </NuxtLink>
    </nav>

    <!-- Logged in: profile card -->
    <template v-if="userStore.isLoggedIn">
      <Separator class="my-2" />
      <div class="flex items-center gap-3 rounded-lg px-3 py-2">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {{ initials }}
        </div>
        <div class="flex-1 overflow-hidden">
          <p class="truncate text-sm font-medium">{{ userStore.profile!.name }}</p>
          <p class="truncate text-xs text-muted-foreground">{{ userStore.profile!.email }}</p>
        </div>
        <button
          class="text-muted-foreground transition-colors hover:text-foreground"
          :title="t('nav.logout')"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
        </button>
      </div>
    </template>
  </aside>
</template>
