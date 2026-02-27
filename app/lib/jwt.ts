import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "~/stores/user";

// Demo secret — embedded in client bundle (not secure for production).
// In a real app, signing happens server-side with a private key.
const SECRET = new TextEncoder().encode(
	"stoxlyz-demo-secret-key-do-not-use-in-prod",
);

const ALG = "HS256";
const EXPIRY = "7d";
const VALID_ROLES: UserRole[] = ["superadmin", "admin", "user"];

export interface JwtPayload {
	sub: string; // email
	name: string;
	role: UserRole;
}

export async function signToken(payload: JwtPayload): Promise<string> {
	return new SignJWT({ name: payload.name, role: payload.role })
		.setProtectedHeader({ alg: ALG })
		.setSubject(payload.sub)
		.setIssuedAt()
		.setExpirationTime(EXPIRY)
		.sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
	try {
		const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALG] });

		if (typeof payload.sub !== "string" || typeof payload.name !== "string") {
			console.warn("[jwt] Token payload missing required string fields");
			return null;
		}
		if (!VALID_ROLES.includes(payload.role as UserRole)) {
			console.warn("[jwt] Token payload has invalid role:", payload.role);
			return null;
		}

		return {
			sub: payload.sub,
			name: payload.name,
			role: payload.role as UserRole,
		};
	} catch (err) {
		console.warn(
			"[jwt] Token verification failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}
