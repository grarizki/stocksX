import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { signToken, verifyToken } from '~/lib/jwt'

export type UserRole = 'superadmin' | 'admin' | 'user'

export interface UserProfile {
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}

const TOKEN_KEY = 'StoxLyz-auth-token'
const PREFS_KEY = 'StoxLyz-user-prefs'

const VALID_THEMES = ['dark', 'light', 'system'] as const
const VALID_LANGUAGES = ['id', 'en'] as const

export const useUserStore = defineStore('user', () => {
  const theme = ref<'dark' | 'light' | 'system'>('system')
  const language = ref<'id' | 'en'>('id')
  const notifications = ref<boolean>(true)
  const profile = ref<UserProfile | null>(null)
  const authReady = ref(false)

  const isLoggedIn = computed(() => profile.value !== null)
  const isSuperAdmin = computed(() => profile.value?.role === 'superadmin')
  const isAdmin = computed(() => isSuperAdmin.value || profile.value?.role === 'admin')

  const initials = computed(() => {
    return (profile.value?.name ?? '')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  })

  // Load preferences (theme, language, notifications) from localStorage
  const loadPrefs = () => {
    if (!import.meta.client) return
    const stored = localStorage.getItem(PREFS_KEY)
    if (!stored) return
    try {
      const prefs = JSON.parse(stored)
      theme.value = VALID_THEMES.includes(prefs.theme) ? prefs.theme : 'system'
      language.value = VALID_LANGUAGES.includes(prefs.language) ? prefs.language : 'id'
      notifications.value = typeof prefs.notifications === 'boolean' ? prefs.notifications : true
    }
    catch (err) {
      console.warn('[user store] Failed to parse preferences from storage:', err)
    }
  }

  // Verify JWT from localStorage and restore profile — exported for auth plugin
  const loadToken = async () => {
    if (!import.meta.client) return
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        profile.value = { name: payload.name, email: payload.sub, role: payload.role }
      }
      else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
    authReady.value = true
  }

  loadPrefs()

  // Persist preferences whenever they change
  const persistPrefs = () => {
    if (!import.meta.client) return
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      theme: theme.value,
      language: language.value,
      notifications: notifications.value,
    }))
  }

  if (import.meta.client) {
    watch([theme, language, notifications], persistPrefs, { deep: true })
  }

  const setTheme = (value: 'dark' | 'light' | 'system') => {
    theme.value = value
  }

  const setLanguage = (value: 'id' | 'en') => {
    language.value = value
  }

  const toggleNotifications = () => {
    notifications.value = !notifications.value
  }

  // Sign a JWT and store it; populate profile from claims
  const setProfile = async (value: UserProfile) => {
    if (!import.meta.client) return
    const token = await signToken({ sub: value.email, name: value.name, role: value.role })
    localStorage.setItem(TOKEN_KEY, token)
    profile.value = value
  }

  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
    }
    profile.value = null
  }

  return {
    theme,
    language,
    notifications,
    profile,
    authReady,
    isLoggedIn,
    isSuperAdmin,
    isAdmin,
    initials,
    loadToken,
    setTheme,
    setLanguage,
    toggleNotifications,
    setProfile,
    logout,
  }
})
