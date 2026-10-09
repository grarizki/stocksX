interface AccountRoleValues {
	user: "user";
	admin: "admin";
	superadmin: "superadmin";
}

interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: AccountRoleValues[keyof AccountRoleValues];
}

interface AccountResponse {
	user: UserProfile;
}

interface AuthenticationResult {
	success: boolean;
	code?: string;
}

interface AccountListRow extends UserProfile {
	createdAt: number;
}

interface AdminAccountsResponse {
	accounts: AccountListRow[];
	page: number;
	pageSize: number;
	totalAccounts: number;
	adminAccounts: number;
	activeSessions: number;
}

interface OwnershipRow {
	share_code: string;
	investor_code: string;
	percentage: number;
	confidence: number;
	notes: string | null;
}
