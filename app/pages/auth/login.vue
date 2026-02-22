<script setup lang="ts">
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-vue-next'
import { roleVariant } from '~/composables/useRoleVariant'

definePageMeta({ layout: false })

const { t } = useI18n()
useHead({ title: computed(() => `${t('auth.signIn')} - StoxLyz`) })

const localePath = useLocalePath()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const DUMMY_USERS = [
  { email: 'super@stoxlyz.com', password: 'super123', name: 'Super Admin', role: 'superadmin' as const },
  { email: 'admin@stoxlyz.com', password: 'password123', name: 'Admin', role: 'admin' as const },
  { email: 'demo@stoxlyz.com', password: 'demo123', name: 'Demo User', role: 'user' as const },
]

async function handleLogin() {
  error.value = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 600))
  loading.value = false

  const match = DUMMY_USERS.find(
    u => u.email === email.value && u.password === password.value,
  )

  if (!match) {
    error.value = t('auth.invalidCredentials')
    return
  }

  await userStore.setProfile({ name: match.name, email: match.email, role: match.role })
  navigateTo(localePath('/home'))
}

async function quickLogin(user: typeof DUMMY_USERS[number]) {
  await userStore.setProfile({ name: user.name, email: user.email, role: user.role })
  navigateTo(localePath('/home'))
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- Back to landing nav -->
    <nav class="flex items-center justify-between border-b border-border/40 px-4 py-3">
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span class="text-xs font-bold text-primary-foreground">SL</span>
        </div>
        <span class="font-bold tracking-tight">Stox<span class="text-blue-500">Lyz</span></span>
      </NuxtLink>
      <NuxtLink :to="localePath('/')" class="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </NuxtLink>
    </nav>

    <div class="flex flex-1 items-center justify-center px-4">
      <div class="w-full max-w-sm py-8">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary" aria-hidden="true">
          <span class="text-lg font-bold text-primary-foreground">SX</span>
        </div>
        <h1 class="text-2xl font-bold">{{ $t('auth.welcomeBack') }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ $t('auth.signInSubtitle') }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div class="space-y-2">
          <label for="login-email" class="text-sm font-medium">{{ $t('auth.email') }}</label>
          <Input
            id="login-email"
            v-model="email"
            type="email"
            :placeholder="$t('auth.emailPlaceholder')"
            required
            autocomplete="email"
          />
        </div>

        <div class="space-y-2">
          <label for="login-password" class="text-sm font-medium">{{ $t('auth.password') }}</label>
          <div class="relative">
            <Input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('auth.passwordPlaceholder')"
              required
              autocomplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full w-10"
              :aria-label="showPassword ? $t('auth.hidePassword') : $t('auth.showPassword')"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" aria-hidden="true" />
              <Eye v-else class="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <p v-if="error" role="alert" aria-live="assertive" class="text-sm text-destructive">{{ error }}</p>

        <Button type="submit" class="w-full gap-2" :disabled="loading">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ loading ? $t('auth.signingIn') : $t('auth.signIn') }}
        </Button>
      </form>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        {{ $t('auth.noAccount') }}
        <NuxtLink :to="localePath('/auth/register')" class="font-medium text-blue-500 hover:text-blue-400">
          {{ $t('auth.register') }}
        </NuxtLink>
      </p>

      <!-- Demo accounts -->
      <div class="mt-8">
        <div class="relative mb-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border" />
          </div>
          <div class="relative flex justify-center">
            <span class="bg-background px-3 text-xs text-muted-foreground">{{ $t('auth.demoAccounts') }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <button
            v-for="user in DUMMY_USERS"
            :key="user.email"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
            @click="quickLogin(user)"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {{ user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }}
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium">{{ user.name }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ user.email }}</p>
            </div>
            <Badge :variant="roleVariant(user.role)" class="shrink-0 capitalize text-[10px]">
              {{ user.role }}
            </Badge>
            <LogIn class="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
