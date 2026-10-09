import type { H3Event } from "h3";
import { verifyIdToken } from "../../utils/firebaseAdmin";

export interface SessionUser {
	name: string;
	email: string;
	role: "superadmin" | "admin" | "user";
}

export interface SessionResponse {
	authenticated: boolean;
	user: SessionUser | null;
}

export default defineEventHandler(async (event: H3Event): Promise<SessionResponse> => {
	const accessToken = getCookie(event, "stoxlyz_token");

	if (!accessToken) {
		return {
			authenticated: false,
			user: null,
		};
	}

	const decodedFirebaseToken = await verifyIdToken(accessToken);
	if (decodedFirebaseToken) {
		const rawRole = decodedFirebaseToken.role;
		const safeRole =
			rawRole === "superadmin" || rawRole === "admin" ? rawRole : "user";

		return {
			authenticated: true,
			user: {
				name: decodedFirebaseToken.name || decodedFirebaseToken.email || "User",
				email: decodedFirebaseToken.email || "",
				role: safeRole,
			},
		};
	}

	return {
		authenticated: false,
		user: null,
	};
});
