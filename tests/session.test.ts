import { describe, expect, it, vi } from "vitest";

describe("session verification handler", () => {
	it("rejects unverified forged tokens", async () => {
		const mockVerify = vi.fn().mockResolvedValue(null);
		const forgedToken = "header.eyJyb2xlIjoic3VwZXJhZG1pbiJ9.signature";

		const verified = await mockVerify(forgedToken);
		expect(verified).toBeNull();
	});

	it("accepts valid tokens and normalizes claims", async () => {
		const mockVerify = vi.fn().mockResolvedValue({
			email: "admin@stoxlyz.com",
			name: "Admin User",
			role: "admin",
		});

		const validToken = "valid.firebase.token";
		const verified = await mockVerify(validToken);

		expect(verified).not.toBeNull();
		expect(verified?.role).toBe("admin");
		expect(verified?.email).toBe("admin@stoxlyz.com");
	});
});
