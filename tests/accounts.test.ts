import { describe, expect, it } from "vitest";
import {
	hashPasswordRaw,
	isAcceptedRequestOrigin,
	verifyPasswordWithHash,
} from "../server/utils/accounts";

const PASSWORD_PEPPER = "unit-suite-pepper-value-000000000001";
const PASSWORD = "correct-horse-battery-staple";

describe("password verification", () => {
	it("accepts the password that produced the stored hash", async () => {
		const storedHash = await hashPasswordRaw(PASSWORD, PASSWORD_PEPPER);
		await expect(
			verifyPasswordWithHash(PASSWORD, storedHash, PASSWORD_PEPPER),
		).resolves.toBe(true);
	});

	it("rejects a different password against the same hash", async () => {
		const storedHash = await hashPasswordRaw(PASSWORD, PASSWORD_PEPPER);
		await expect(
			verifyPasswordWithHash(`${PASSWORD}-other`, storedHash, PASSWORD_PEPPER),
		).resolves.toBe(false);
	});
});

describe("origin validation", () => {
	it("accepts the origin the request itself is served from", () => {
		expect(
			isAcceptedRequestOrigin({
				headerOrigin: "http://localhost:3000",
				requestOrigin: "http://localhost:3000",
				configuredOrigin: "http://localhost:8787",
			}),
		).toBe(true);
	});

	it("accepts a configured origin reached through another host", () => {
		expect(
			isAcceptedRequestOrigin({
				headerOrigin: "https://preview.example",
				requestOrigin: "https://stocksx.nightdelaluna.workers.dev",
				configuredOrigin: "https://preview.example",
			}),
		).toBe(true);
	});

	it("rejects foreign, opaque, and absent origins", () => {
		const requestOrigin = "https://stocksx.nightdelaluna.workers.dev";
		expect(
			isAcceptedRequestOrigin({
				headerOrigin: "https://evil.example",
				requestOrigin,
				configuredOrigin: requestOrigin,
			}),
		).toBe(false);
		expect(
			isAcceptedRequestOrigin({
				headerOrigin: "null",
				requestOrigin,
				configuredOrigin: requestOrigin,
			}),
		).toBe(false);
		expect(
			isAcceptedRequestOrigin({
				headerOrigin: "",
				requestOrigin,
				configuredOrigin: requestOrigin,
			}),
		).toBe(false);
	});
});
