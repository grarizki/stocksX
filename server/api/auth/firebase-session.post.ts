import type { H3Event } from "h3";
import { verifyIdToken } from "../../utils/firebaseAdmin";

export interface FirebaseSessionBody {
	idToken: string;
}

export interface FirebaseSessionResponse {
	success: boolean;
	user: {
		name: string;
		email: string;
		role: "superadmin" | "admin" | "user";
	} | null;
}

export default defineEventHandler(async (event: H3Event): Promise<FirebaseSessionResponse> => {
	const body = await readBody<FirebaseSessionBody>(event).catch(() => null);
	const candidateToken = body?.idToken;

	if (!candidateToken || typeof candidateToken !== "string") {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing or invalid idToken in request body",
		});
	}

	const decoded = await verifyIdToken(candidateToken);
	if (!decoded) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid Firebase ID token",
		});
	}

	setCookie(event, "stoxlyz_token", candidateToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7,
		path: "/",
	});

	const rawRole = decoded.role;
	const safeRole =
		rawRole === "superadmin" || rawRole === "admin" ? rawRole : "user";

	return {
		success: true,
		user: {
			name: decoded.name || decoded.email || "User",
			email: decoded.email || "",
			role: safeRole,
		},
	};
});
