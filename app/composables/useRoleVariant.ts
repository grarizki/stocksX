export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export function roleVariant(role?: string): BadgeVariant {
	if (role === "superadmin") return "default";
	if (role === "admin") return "secondary";
	return "outline";
}
