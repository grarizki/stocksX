<script setup lang="ts">
import { Settings, Shield, TrendingUp, Users } from "lucide-vue-next";
import { roleVariant } from "~/composables/useRoleVariant";

definePageMeta({ middleware: ["admin"] });

const { t } = useI18n();
useHead({ title: computed(() => `${t("admin.title")} - StoxLyz`) });

const userStore = useUserStore();

const DUMMY_USERS = [
	{
		name: "Super Admin",
		email: "super@stoxlyz.id",
		role: "superadmin",
		status: "active",
	},
	{
		name: "Budi Santoso",
		email: "budi@stoxlyz.id",
		role: "admin",
		status: "active",
	},
	{
		name: "Demo User",
		email: "demo@stoxlyz.id",
		role: "user",
		status: "active",
	},
];

const totalUsers = computed(() => DUMMY_USERS.length);
const adminRolesCount = computed(
	() => DUMMY_USERS.filter((u) => u.role !== "user").length,
);
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

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <Users class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p class="text-2xl font-bold">{{ totalUsers }}</p>
            <p class="text-xs text-muted-foreground">{{ $t('admin.totalUsers') }}</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <TrendingUp class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p class="text-2xl font-bold">1</p>
            <p class="text-xs text-muted-foreground">{{ $t('admin.activeSessions') }}</p>
          </div>
        </div>
      </Card>
      <Card class="col-span-2 p-4 lg:col-span-1">
        <div class="flex items-center gap-3">
          <Settings class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p class="text-2xl font-bold">{{ adminRolesCount }}</p>
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
        <Table :aria-label="$t('admin.userManagement')">
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('admin.colName') }}</TableHead>
              <TableHead>{{ $t('admin.colEmail') }}</TableHead>
              <TableHead>{{ $t('admin.colRole') }}</TableHead>
              <TableHead>{{ $t('admin.colStatus') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="user in DUMMY_USERS" :key="user.email">
              <TableCell class="font-medium">{{ user.name }}</TableCell>
              <TableCell class="text-muted-foreground">{{ user.email }}</TableCell>
              <TableCell>
                <Badge :variant="roleVariant(user.role)" class="capitalize">{{ user.role }}</Badge>
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
    </Card>
  </div>
</template>
