import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const WORKER_ENTRY = resolve(".output/server/index.mjs");
const TRUSTED_ORIGIN = "https://stocksx.nightdelaluna.workers.dev";
const PASSWORD = "correct-horse-battery-staple";

let miniflare: Miniflare;

interface FetchOptions {
	origin?: string | null;
	ip?: string;
	cookie?: string;
	method?: string;
	body?: unknown;
	rawBody?: string;
}

let ipCounter = 0;

function nextClientIp(): string {
	ipCounter += 1;
	return `198.18.${Math.floor(ipCounter / 200)}.${(ipCounter % 200) + 1}`;
}

async function request(
	path: string,
	options: FetchOptions = {},
): Promise<Response> {
	const headers: Record<string, string> = {
		"content-type": "application/json",
		"cf-connecting-ip": options.ip ?? nextClientIp(),
	};
	if (options.origin !== null)
		headers.origin = options.origin ?? TRUSTED_ORIGIN;
	if (options.cookie) headers.cookie = options.cookie;
	const body =
		options.rawBody ??
		(options.body === undefined ? undefined : JSON.stringify(options.body));
	return miniflare.dispatchFetch(`${TRUSTED_ORIGIN}${path}`, {
		method: options.method ?? (body === undefined ? "GET" : "POST"),
		headers,
		body,
	});
}

async function readJson<T>(response: Response): Promise<T> {
	return (await response.json()) as T;
}

function sessionCookie(response: Response): string {
	const setCookie = response.headers.get("set-cookie") ?? "";
	const match = setCookie.match(/__Host-stocksx_session=[^;]+/);
	if (!match) throw new Error(`no session cookie in: ${setCookie}`);
	return match[0];
}

async function registerUser(
	email: string,
	ip = nextClientIp(),
): Promise<Response> {
	return request("/api/auth/register", {
		ip,
		body: { name: "Test Investor", email, password: PASSWORD },
	});
}

async function loginUser(
	email: string,
	ip = nextClientIp(),
	cookie?: string,
): Promise<Response> {
	return request("/api/auth/login", {
		ip,
		cookie,
		body: { email, password: PASSWORD },
	});
}

beforeAll(async () => {
	expect(
		readFileSync(WORKER_ENTRY, "utf8").length,
		"run `npm run build` before the integration suite",
	).toBeGreaterThan(0);

	const bundled = await build({
		entryPoints: [WORKER_ENTRY],
		absWorkingDir: process.cwd(),
		bundle: true,
		format: "esm",
		target: "es2022",
		platform: "browser",
		conditions: ["workerd", "worker", "browser", "import"],
		external: ["cloudflare:*", "node:*"],
		write: false,
		logLevel: "silent",
	});

	miniflare = new Miniflare(
		convertV4MiniflareOptions({
			workers: [
				{
					name: "stocksx",
					modules: true,
					script: bundled.outputFiles[0].text,
					compatibilityDate: "2025-07-15",
					compatibilityFlags: ["nodejs_compat"],
					bindings: { TRUSTED_ORIGIN },
					d1Databases: { DB: "stocksx-integration" },
					ratelimits: {
						REGISTER_LIMITER: {
							namespace_id: "stocksx-register-test",
							simple: { limit: 5, period: 60 },
						},
						LOGIN_LIMITER: {
							namespace_id: "stocksx-login-test",
							simple: { limit: 10, period: 60 },
						},
					},
				},
			],
		}),
	);

	const db = await miniflare.getD1Database("DB");
	const schema = readFileSync(
		resolve("migrations/0001_initial_schema.sql"),
		"utf8",
	);
	for (const statement of schema.split(";")) {
		const singleLine = statement.replace(/\s+/g, " ").trim();
		if (singleLine.length > 0) await db.exec(singleLine);
	}
	await db
		.prepare(
			`INSERT INTO ownership_records (share_code, investor_code, percentage, confidence, notes) VALUES (?, ?, ?, ?, ?)`,
		)
		.bind("BBCA", "INV-001", 12.5, 0.9, "fixture")
		.run();
});

afterAll(async () => {
	await miniflare?.dispose();
});

describe("registration", () => {
	it("creates an account, returns 201, and sets no session cookie", async () => {
		const response = await registerUser("New.User@Example.com ");
		expect(response.status).toBe(201);
		expect(response.headers.get("set-cookie")).toBeNull();
		expect(response.headers.get("cache-control")).toBe("no-store");
		const payload = await readJson<{
			success: boolean;
			account: { id: string };
		}>(response);
		expect(payload.success).toBe(true);
		expect(payload.account.id).toBeTruthy();
	});

	it("stores the canonical email and rejects duplicates with 409", async () => {
		await registerUser("duplicate@example.com");
		const duplicate = await registerUser("  DUPLICATE@Example.COM ");
		expect(duplicate.status).toBe(409);
		expect(
			(await readJson<{ data: { code: string } }>(duplicate)).data.code,
		).toBe("EMAIL_EXISTS");
	});

	it("treats plus-addresses as distinct accounts", async () => {
		const first = await registerUser("plus+one@example.com");
		const second = await registerUser("plus+two@example.com");
		expect(first.status).toBe(201);
		expect(second.status).toBe(201);
	});

	it("rejects short passwords, privileged roles, and unknown fields", async () => {
		const shortPassword = await request("/api/auth/register", {
			body: {
				name: "A",
				email: "short@example.com",
				password: "short-password",
			},
		});
		expect(shortPassword.status).toBe(400);

		const privileged = await request("/api/auth/register", {
			body: {
				name: "A",
				email: "privileged@example.com",
				password: PASSWORD,
				role: "admin",
			},
		});
		expect(privileged.status).toBe(400);
	});

	it("rejects cross-origin and origin-less requests with 403", async () => {
		const crossOrigin = await request("/api/auth/register", {
			origin: "https://evil.example",
			body: { name: "A", email: "cross@example.com", password: PASSWORD },
		});
		expect(crossOrigin.status).toBe(403);

		const noOrigin = await request("/api/auth/register", {
			origin: null,
			body: { name: "A", email: "noorigin@example.com", password: PASSWORD },
		});
		expect(noOrigin.status).toBe(403);
	});

	it("rejects bodies larger than 8 KiB", async () => {
		const oversized = await request("/api/auth/register", {
			rawBody: JSON.stringify({
				name: "A",
				email: "big@example.com",
				password: `${"x".repeat(9000)}`,
			}),
		});
		expect(oversized.status).toBe(413);
	});

	it("rejects oversized streamed bodies that declare no length", async () => {
		const chunk = new TextEncoder().encode(
			JSON.stringify({
				name: "A",
				email: "streamed@example.com",
				password: "y".repeat(9000),
			}),
		);
		const streamed = await miniflare.dispatchFetch(
			`${TRUSTED_ORIGIN}/api/auth/register`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					"cf-connecting-ip": nextClientIp(),
					origin: TRUSTED_ORIGIN,
				},
				body: new ReadableStream({
					start(controller) {
						controller.enqueue(chunk);
						controller.close();
					},
				}),
				duplex: "half",
			},
		);
		expect(streamed.headers.get("content-length")).toBeNull();
		expect(streamed.status).toBe(413);
	});
});

describe("login and sessions", () => {
	it("logs in with a canonicalized email and sets hardened cookie attributes", async () => {
		await registerUser("session@example.com");
		const response = await loginUser("  SESSION@Example.com ");
		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");

		const setCookie = response.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain("__Host-stocksx_session=");
		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toContain("Secure");
		expect(setCookie).toContain("SameSite=Lax");
		expect(setCookie).toContain("Path=/");
		expect(setCookie).not.toContain("Domain=");

		const payload = await readJson<{ user: UserProfile }>(response);
		expect(payload.user).toEqual({
			id: expect.any(String),
			name: "Test Investor",
			email: "session@example.com",
			role: "user",
		});
		expect(JSON.stringify(payload)).not.toContain(PASSWORD);
	});

	it("returns the same error for unknown emails and wrong passwords", async () => {
		await registerUser("known@example.com");
		const unknown = await loginUser("unknown@example.com");
		const wrongPassword = await request("/api/auth/login", {
			body: { email: "known@example.com", password: "wrong-password-value" },
		});

		expect(unknown.status).toBe(401);
		expect(wrongPassword.status).toBe(401);
		expect(
			(await readJson<{ data: { code: string } }>(unknown)).data.code,
		).toBe("INVALID_CREDENTIALS");
		expect(
			(await readJson<{ data: { code: string } }>(wrongPassword)).data.code,
		).toBe("INVALID_CREDENTIALS");
	});

	it("rejects non-string credentials with 400", async () => {
		const response = await request("/api/auth/login", {
			body: { email: 42, password: null },
		});
		expect(response.status).toBe(400);
	});

	it("restores the session, then refuses it after logout", async () => {
		await registerUser("restore@example.com");
		const cookie = sessionCookie(await loginUser("restore@example.com"));

		const restored = await request("/api/auth/session", { cookie });
		expect(restored.status).toBe(200);
		expect((await readJson<{ user: UserProfile }>(restored)).user.email).toBe(
			"restore@example.com",
		);
		expect(restored.headers.get("content-type")).toContain("application/json");

		const logout = await request("/api/auth/logout", { cookie, body: {} });
		expect(logout.status).toBe(200);
		const clearedCookie = logout.headers.get("set-cookie") ?? "";
		expect(clearedCookie).toContain("Max-Age=0");
		expect(clearedCookie).toContain("Secure");
		expect(clearedCookie).toContain("Path=/");

		const replayed = await request("/api/auth/session", { cookie });
		expect(replayed.status).toBe(401);
	});

	it("is idempotent on logout without a session and revokes the presented session on re-login", async () => {
		const anonymous = await request("/api/auth/logout", { body: {} });
		expect(anonymous.status).toBe(200);

		await registerUser("rotate@example.com");
		const firstCookie = sessionCookie(await loginUser("rotate@example.com"));
		const secondCookie = sessionCookie(
			await loginUser("rotate@example.com", nextClientIp(), firstCookie),
		);

		expect(secondCookie).not.toBe(firstCookie);
		expect(
			(await request("/api/auth/session", { cookie: firstCookie })).status,
		).toBe(401);
		expect(
			(await request("/api/auth/session", { cookie: secondCookie })).status,
		).toBe(200);
	});

	it("refuses forged, expired, and legacy sessions", async () => {
		const forged = await request("/api/auth/session", {
			cookie: "__Host-stocksx_session=forged-token-value",
		});
		expect(forged.status).toBe(401);

		const legacy = await request("/api/auth/session", {
			cookie: "stoxlyz_token=legacy-demo-token",
		});
		expect(legacy.status).toBe(401);

		await registerUser("expired@example.com");
		const cookie = sessionCookie(await loginUser("expired@example.com"));
		const db = await miniflare.getD1Database("DB");
		await db.prepare("UPDATE sessions SET expires_at = 1").run();
		expect((await request("/api/auth/session", { cookie })).status).toBe(401);
	});

	it("refuses registration from an already authenticated browser with 409", async () => {
		await registerUser("authenticated@example.com");
		const cookie = sessionCookie(await loginUser("authenticated@example.com"));
		const response = await request("/api/auth/register", {
			cookie,
			body: { name: "Second", email: "second@example.com", password: PASSWORD },
		});
		expect(response.status).toBe(409);
		expect(
			(await readJson<{ data: { code: string } }>(response)).data.code,
		).toBe("ALREADY_AUTHENTICATED");
	});
});

describe("protected endpoints", () => {
	it("requires a session for ownership and returns the record array", async () => {
		const anonymous = await request("/api/stocks/BBCA.JK/ownership");
		expect(anonymous.status).toBe(401);

		await registerUser("ownership@example.com");
		const cookie = sessionCookie(await loginUser("ownership@example.com"));
		const response = await request("/api/stocks/BBCA.JK/ownership", { cookie });
		expect(response.status).toBe(200);
		const records = await readJson<Array<{ share_code: string }>>(response);
		expect(Array.isArray(records)).toBe(true);
		expect(records[0]?.share_code).toBe("BBCA");
	});

	it("denies ordinary accounts the admin endpoint and serves admin totals to admins", async () => {
		await registerUser("ordinary@example.com");
		const cookie = sessionCookie(await loginUser("ordinary@example.com"));
		const forbidden = await request("/api/admin/accounts", { cookie });
		expect(forbidden.status).toBe(403);

		const db = await miniflare.getD1Database("DB");
		await db
			.prepare("UPDATE accounts SET role = 'admin' WHERE email = ?")
			.bind("ordinary@example.com")
			.run();

		const allowed = await request("/api/admin/accounts?page=1&pageSize=2", {
			cookie,
		});
		expect(allowed.status).toBe(200);
		const payload = await readJson<{
			accounts: Array<{ email: string; role: string }>;
			page: number;
			pageSize: number;
			totalAccounts: number;
			adminAccounts: number;
			activeSessions: number;
		}>(allowed);

		expect(payload.page).toBe(1);
		expect(payload.pageSize).toBe(2);
		expect(payload.accounts.length).toBe(2);
		expect(payload.totalAccounts).toBeGreaterThan(2);
		expect(payload.adminAccounts).toBe(1);
		expect(payload.activeSessions).toBeGreaterThan(0);
		expect(payload.accounts[0]).not.toHaveProperty("password_hash");
	});

	it("clamps the admin page size to the documented maximum", async () => {
		await registerUser("clamp@example.com");
		const cookie = sessionCookie(await loginUser("clamp@example.com"));
		const db = await miniflare.getD1Database("DB");
		await db
			.prepare("UPDATE accounts SET role = 'superadmin' WHERE email = ?")
			.bind("clamp@example.com")
			.run();

		const response = await request("/api/admin/accounts?page=1&pageSize=5000", {
			cookie,
		});
		expect(response.status).toBe(200);
		expect((await readJson<{ pageSize: number }>(response)).pageSize).toBe(100);
	});
});

describe("rate limiting", () => {
	it("returns 429 with Retry-After once the registration budget per IP is spent", async () => {
		const ip = "198.51.100.44";
		const statuses: number[] = [];
		for (let attempt = 0; attempt < 6; attempt++) {
			const response = await registerUser(`limit-${attempt}@example.com`, ip);
			statuses.push(response.status);
			if (response.status === 429) {
				expect(response.headers.get("retry-after")).toBe("60");
				expect(
					(await readJson<{ data: { code: string } }>(response)).data.code,
				).toBe("RATE_LIMITED");
			}
		}
		expect(statuses.filter((status) => status === 201).length).toBe(5);
		expect(statuses[5]).toBe(429);
	});

	it("limits repeated login attempts per canonical email hash", async () => {
		await registerUser("limit-login@example.com");
		const statuses: number[] = [];
		for (let attempt = 0; attempt < 11; attempt++) {
			const response = await request("/api/auth/login", {
				ip: "198.51.100.61",
				body: {
					email: "limit-login@example.com",
					password: "wrong-password-value",
				},
			});
			statuses.push(response.status);
		}
		expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
		expect(statuses[10]).toBe(429);
	});
});
