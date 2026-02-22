<script setup lang="ts">
import { Sun, Moon, Monitor, Globe, Bell, BellOff, Shield } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
useHead({ title: computed(() => `${t('nav.settings')} - StoxLyz`) })

const colorMode = useColorMode()
const switchLocalePath = useSwitchLocalePath()
const userStore = useUserStore()
const { notifications, language } = storeToRefs(userStore)

const themes = computed(() => [
  { value: 'light', label: t('settings.light'), icon: Sun },
  { value: 'dark', label: t('settings.dark'), icon: Moon },
  { value: 'system', label: t('settings.system'), icon: Monitor },
])

function selectTheme(value: string) {
  colorMode.preference = value
  userStore.setTheme(value as 'dark' | 'light' | 'system')
}

async function selectLanguage(lang: 'id' | 'en') {
  userStore.setLanguage(lang)
  await navigateTo(switchLocalePath(lang))
}

async function toggleNotifications() {
  if (!notifications.value) {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      userStore.toggleNotifications()
    }
  }
  else {
    userStore.toggleNotifications()
  }
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold">{{ $t('settings.title') }}</h1>
    <p class="mb-6 text-sm text-muted-foreground">{{ $t('settings.subtitle') }}</p>

    <div class="space-y-6">
      <!-- Theme -->
      <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
        <h2 class="mb-3 text-sm font-semibold">{{ $t('settings.appearance') }}</h2>
        <div class="flex gap-2">
          <Button
            v-for="theme in themes"
            :key="theme.value"
            :variant="colorMode.preference === theme.value ? 'default' : 'outline'"
            size="sm"
            class="flex-1 gap-2 text-xs"
            :aria-pressed="colorMode.preference === theme.value"
            @click="selectTheme(theme.value)"
          >
            <component :is="theme.icon" class="h-3.5 w-3.5" aria-hidden="true" />
            {{ theme.label }}
          </Button>
        </div>
      </Card>

      <!-- Language -->
      <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
        <h2 class="mb-3 text-sm font-semibold">{{ $t('settings.language') }}</h2>
        <div class="flex gap-2">
          <Button
            :variant="language === 'id' ? 'default' : 'outline'"
            size="sm"
            class="flex-1 gap-2 text-xs"
            :aria-pressed="language === 'id'"
            @click="selectLanguage('id')"
          >
            <Globe class="h-3.5 w-3.5" aria-hidden="true" />
            Bahasa Indonesia
          </Button>
          <Button
            :variant="language === 'en' ? 'default' : 'outline'"
            size="sm"
            class="flex-1 gap-2 text-xs"
            :aria-pressed="language === 'en'"
            @click="selectLanguage('en')"
          >
            <Globe class="h-3.5 w-3.5" aria-hidden="true" />
            English
          </Button>
        </div>
      </Card>

      <!-- Notifications -->
      <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold">{{ $t('settings.notifications') }}</h2>
            <p class="text-xs text-muted-foreground">{{ $t('settings.notifDesc') }}</p>
          </div>
          <Button
            :variant="notifications ? 'default' : 'outline'"
            size="sm"
            class="gap-2 text-xs"
            :aria-pressed="notifications"
            @click="toggleNotifications"
          >
            <Bell v-if="notifications" class="h-3.5 w-3.5" aria-hidden="true" />
            <BellOff v-else class="h-3.5 w-3.5" aria-hidden="true" />
            {{ notifications ? $t('settings.on') : $t('settings.off') }}
          </Button>
        </div>
      </Card>

      <!-- Legal -->
      <Card class="backdrop-blur-xl bg-card/80 border border-border/50 p-4">
        <h2 class="mb-3 text-sm font-semibold">{{ $t('settings.legal') }}</h2>
        <div class="space-y-2">
          <div class="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <Shield class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span class="text-xs text-muted-foreground">{{ $t('settings.ojk') }}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t('settings.legalDesc') }}
          </p>
        </div>
      </Card>

      <SharedRiskDisclaimer />

      <!-- App info -->
      <div class="py-4 text-center text-xs text-muted-foreground">
        <p>StoxLyz v1.0.0</p>
        <p class="mt-1">{{ $t('settings.madeWith') }}</p>
      </div>
    </div>
  </div>
</template>
