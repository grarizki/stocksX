<script setup lang="ts">
import { Settings, Shield, TrendingUp, Users } from "lucide-vue-next";
import { roleVariant } from "~/composables/useRoleVariant";
import type { AdminAccountsResponse } from "../../../shared/types/account";

definePageMeta({ middleware: ["admin"] });

const { t } = useI18n();
useHead({ title: computed(() => `${t("admin.title")} - StoxLyz`) });

const userStore = useUserStore();
const page = ref(1);
const pageSize = 25;

const { data, status, refresh } = useApiFetch<AdminAccountsResponse>(
	() => `/api/admin/accounts?page=${page.value}&pageSize=${pageSize}`,
);

const accounts = computed(() => data.value?.accounts ?? []);
const totalAccounts = computed(() => data.value?.totalAccounts ?? 0);
const adminAccounts = computed(() => data.value?.adminAccounts ?? 0);
const activeSessions = computed(() => data.value?.activeSessions ?? 0);
const totalPages = computed(() =>
	Math.max(1, Math.ceil(totalAccounts.value / pageSize)),
);
const loadFailed = computed(() => status.value === "error");
</script>

<template>
  <div class="space-y-6 p-4 lg:p-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
        <Shield class="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h1 class="text-2xl font-bold">{{ $t('admin.title') }}</h1>
        <p v-if="userStore.profile" class="text-sm text-muted-foreground">
          {{ $t('admin.loggedInAs') }}
          <Badge :variant="roleVariant(userStore.profile.role)" class="ml-1 capitalize">
            {{ userStore.profile.role }}
          </Badge>
        </p>
      </div>
    </div>

    <div
      v-if="loadFailed"
      role="alert"
      class="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3"
    >
      <p class="text-sm text-destructive">{{ $t('auth.SERVICE_UNAVAILABLE') }}</p>
      <Button variant="outline" size="sm" @click="refresh()">{{ $t('admin.retry') }}</Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <Users class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p class="text-2xl font-bold">{{ totalAccounts }}</p>
            <p class="text-xs text-muted-foreground">{{ $t('admin.totalUsers') }}</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <TrendingUp class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p class="text-2xl font-bold">{{ activeSessions }}</p>
            <p class="text-xs text-muted-foreground">{{ $t('admin.activeSessions') }}</p>
          </div>
        </div>
      </Card>
      <Card class="col-span-2 p-4 lg:col-span-1">
        <div class="flex items-center gap-3">
          <Settings class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p class="text-2xl font-bold">{{ adminAccounts }}</p>
            <p class="text-xs text-muted-foreground">{{ $t('admin.adminRoles') }}</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Users Table -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('admin.userManagement') }}</CardTitle>
        <CardDescription>{{ $t('admin.userManagementDesc') }}</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="status === 'pending'" class="space-y-2 p-4">
          <Skeleton v-for="i in 5" :key="i" class="h-9 w-full" />
        </div>

        <p
          v-else-if="accounts.length === 0"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          {{ $t('admin.noUsers') }}
        </p>

        <Table v-else :aria-label="$t('admin.userManagement')">
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('admin.colName') }}</TableHead>
              <TableHead>{{ $t('admin.colEmail') }}</TableHead>
              <TableHead>{{ $t('admin.colRole') }}</TableHead>
              <TableHead>{{ $t('admin.colStatus') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="account in accounts" :key="account.id">
              <TableCell class="font-medium">{{ account.name }}</TableCell>
              <TableCell class="text-muted-foreground">{{ account.email }}</TableCell>
              <TableCell>
                <Badge :variant="roleVariant(account.role)" class="capitalize">{{ account.role }}</Badge>
              </TableCell>
              <TableCell>
                <span class="flex items-center gap-1.5 text-sm text-green-500">
                  <span class="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                  {{ $t('admin.statusActive') }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter v-if="totalPages > 1" class="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page -= 1">
          {{ $t('admin.previous') }}
        </Button>
        <span class="text-xs text-muted-foreground">
          {{ $t('admin.pageOf', { page, total: totalPages }) }}
        </span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="page += 1">
          {{ $t('admin.next') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>