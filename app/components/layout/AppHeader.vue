<script setup lang="ts">
import { Search, LogIn, LogOut, User, Shield, Sun, Moon } from 'lucide-vue-next'
import { useEventListener } from '@vueuse/core'
import { roleVariant } from '~/composables/useRoleVariant'

const { locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const userStore = useUserStore()

const showSearch = ref(false)
const colorMode = useColorMode()
function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// ⌘K / Ctrl+K opens search
useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showSearch.value = true
  }
})

async function handleLogout() {
  userStore.logout()
  await navigateTo(localePath('/auth/login'))
}

async function handleLanguageSwitch() {
  const next = locale.value === 'id' ? 'en' : 'id'
  userStore.setLanguage(next)
  await navigateTo(switchLocalePath(next))
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-card/80">
    <div class="flex h-14 items-center gap-4 px-4">
      <!-- Logo -->
      <NuxtLink :to="localePath('/home')" :aria-label="$t('nav.home')" class="flex shrink-0 items-center gap-2 lg:w-56 lg:px-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500" aria-hidden="true">
          <span class="text-sm font-bold text-primary-foreground">SL</span>
        </div>
        <span class="text-lg font-bold tracking-tight">
          Stox<span class="text-blue-500">Lyz</span>
        </span>
      </NuxtLink>

      <!-- Search Bar (center, desktop only) -->
      <div class="hidden flex-1 lg:block">
        <button
          class="flex w-full max-w-md items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          :aria-label="$t('nav.openSearch')"
          @click="showSearch = true"
        >
          <Search class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span class="flex-1 text-left">{{ $t('search.placeholder') }}</span>
          <kbd class="hidden rounded border border-border px-1.5 text-xs lg:inline-flex" aria-hidden="true">⌘K</kbd>
        </button>
      </div>

      <!-- Right side actions -->
      <div class="ml-auto flex items-center gap-1 lg:ml-0">
        <!-- Mobile search icon (hidden on desktop where inline bar exists) -->
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0 lg:hidden"
          :aria-label="$t('nav.openSearch')"
          @click="showSearch = true"
        >
          <Search class="h-4 w-4" aria-hidden="true" />
        </Button>

        <!-- Dark/Light Toggle -->
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0"
          :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleColorMode"
        >
          <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" aria-hidden="true" />
          <Moon v-else class="h-4 w-4" aria-hidden="true" />
        </Button>

        <!-- i18n Toggle -->
        <Button
          variant="ghost"
          size="sm"
          class="shrink-0 font-semibold"
          :aria-label="locale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'"
          @click="handleLanguageSwitch"
        >
          {{ locale === 'id' ? 'EN' : 'ID' }}
        </Button>

        <!-- User Dropdown (logged in) -->
        <DropdownMenu v-if="userStore.isLoggedIn">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0 rounded-full"
              :aria-label="$t('nav.userMenu')"
            >
              <Avatar class="h-8 w-8">
                <AvatarImage v-if="userStore.profile?.avatarUrl" :src="userStore.profile.avatarUrl" :alt="userStore.profile?.name" />
                <AvatarFallback class="text-xs">{{ userStore.initials }}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-52">
            <div class="px-2 py-1.5">
              <p class="text-sm font-medium">{{ userStore.profile?.name }}</p>
              <p class="text-xs text-muted-foreground">{{ userStore.profile?.email }}</p>
              <Badge
                :variant="roleVariant(userStore.profile?.role)"
                class="mt-1 capitalize"
              >
                {{ userStore.profile?.role }}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <NuxtLink :to="localePath('/profile')" class="flex cursor-pointer items-center gap-2">
                <User class="h-4 w-4" aria-hidden="true" />
                {{ $t('nav.profile') }}
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem v-if="userStore.isAdmin" as-child>
              <NuxtLink :to="localePath('/admin')" class="flex cursor-pointer items-center gap-2">
                <Shield class="h-4 w-4" aria-hidden="true" />
                {{ $t('nav.adminPanel') }}
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive" @click="handleLogout">
              <LogOut class="h-4 w-4" aria-hidden="true" />
              {{ $t('nav.logout') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Login Button (logged out) -->
        <Button v-else variant="ghost" size="sm" class="shrink-0 gap-1.5" as-child>
          <NuxtLink :to="localePath('/auth/login')">
            <LogIn class="h-4 w-4" aria-hidden="true" />
            {{ $t('nav.login') }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Search Command -->
    <SharedSearchCommand v-model:open="showSearch" />
  </header>
</template>
