import type { D1Database } from "@cloudflare/workers-types";

declare global {
	interface RateLimiterBinding {
		limit(options: { key: string }): Promise<{ success: boolean }>;
	}

	interface CloudflareEnv {
		DB: D1Database;
		REGISTER_LIMITER: RateLimiterBinding;
		LOGIN_LIMITER: RateLimiterBinding;
	}

	interface CloudflareExecutionContext {
		waitUntil(promise: Promise<unknown>): void;
		passThroughOnException(): void;
	}
}

declare module "h3" {
	interface H3EventContext {
		cloudflare?: {
			env: CloudflareEnv;
			context: CloudflareExecutionContext;
		};
	}
}
