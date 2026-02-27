<script setup lang="ts">
import { LogOut, Mail, Settings } from "lucide-vue-next";
import { roleVariant } from "~/composables/useRoleVariant";

definePageMeta({});

const { t } = useI18n();
useHead({ title: computed(() => `${t("nav.profile")} - StoxLyz`) });

const localePath = useLocalePath();
const userStore = useUserStore();

function handleLogout() {
	userStore.logout();
	navigateTo(localePath("/auth/login"));
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6 p-4 lg:p-6">
    <h1 class="text-2xl font-bold">{{ $t('profile.title') }}</h1>

    <template v-if="userStore.profile">
      <!-- Profile Card -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col items-center gap-4 text-center">
            <Avatar class="h-20 w-20">
              <AvatarImage v-if="userStore.profile.avatarUrl" :src="userStore.profile.avatarUrl" :alt="userStore.profile.name" />
              <AvatarFallback class="text-2xl">{{ userStore.initials }}</AvatarFallback>
            </Avatar>

            <div class="space-y-1">
              <h2 class="text-xl font-semibold">{{ userStore.profile.name }}</h2>
              <div class="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Mail class="h-3.5 w-3.5" aria-hidden="true" />
                <span>{{ userStore.profile.email }}</span>
              </div>
              <div class="pt-1">
                <Badge :variant="roleVariant(userStore.profile.role)" class="capitalize">
                  {{ userStore.profile.role }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Account Info -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ $t('profile.accountDetails') }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center justify-between py-1">
            <span class="text-sm text-muted-foreground">{{ $t('profile.name') }}</span>
            <span class="text-sm font-medium">{{ userStore.profile.name }}</span>
          </div>
          <Separator />
          <div class="flex items-center justify-between py-1">
            <span class="text-sm text-muted-foreground">{{ $t('profile.email') }}</span>
            <span class="text-sm font-medium">{{ userStore.profile.email }}</span>
          </div>
          <Separator />
          <div class="flex items-center justify-between py-1">
            <span class="text-sm text-muted-foreground">{{ $t('profile.language') }}</span>
            <span class="text-sm font-medium">{{ userStore.language === 'id' ? 'Bahasa Indonesia' : 'English' }}</span>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="space-y-2">
        <Button variant="outline" class="w-full justify-start gap-2" as-child>
          <NuxtLink :to="localePath('/settings')">
            <Settings class="h-4 w-4" aria-hidden="true" />
            {{ $t('profile.settings') }}
          </NuxtLink>
        </Button>
        <Button variant="destructive" class="w-full justify-start gap-2" @click="handleLogout">
          <LogOut class="h-4 w-4" aria-hidden="true" />
          {{ $t('profile.logout') }}
        </Button>
      </div>
    </template>
  </div>
</template>
