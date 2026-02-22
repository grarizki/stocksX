<script setup lang="ts">
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { t } = useI18n()
useHead({ title: computed(() => `${t('auth.createAccount')} - StoxLyz`) })

const localePath = useLocalePath()
const userStore = useUserStore()
const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  loading.value = true
  await new Promise(r => setTimeout(r, 600))
  loading.value = false

  try {
    await userStore.setProfile({ name: name.value, email: email.value, role: 'user' })
    navigateTo(localePath('/home'))
  }
  catch {
    error.value = t('auth.registerError')
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm py-8">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary" aria-hidden="true">
          <span class="text-lg font-bold text-primary-foreground">SX</span>
        </div>
        <h1 class="text-2xl font-bold">{{ $t('auth.createAccount') }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ $t('auth.createAccountSubtitle') }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div class="space-y-2">
          <label for="register-name" class="text-sm font-medium">{{ $t('auth.name') }}</label>
          <Input
            id="register-name"
            v-model="name"
            type="text"
            :placeholder="$t('auth.namePlaceholder')"
            required
            autocomplete="name"
          />
        </div>

        <div class="space-y-2">
          <label for="register-email" class="text-sm font-medium">{{ $t('auth.email') }}</label>
          <Input
            id="register-email"
            v-model="email"
            type="email"
            :placeholder="$t('auth.emailPlaceholder')"
            required
            autocomplete="email"
          />
        </div>

        <div class="space-y-2">
          <label for="register-password" class="text-sm font-medium">{{ $t('auth.password') }}</label>
          <div class="relative">
            <Input
              id="register-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('auth.createPasswordPlaceholder')"
              required
              autocomplete="new-password"
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
          {{ loading ? $t('auth.creatingAccount') : $t('auth.createAccount') }}
        </Button>
      </form>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        {{ $t('auth.haveAccount') }}
        <NuxtLink :to="localePath('/auth/login')" class="font-medium text-blue-500 hover:text-blue-400">
          {{ $t('auth.signInLink') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
