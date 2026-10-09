import type { D1Database } from '@cloudflare/workers-types';

export interface CloudflareEnv {
  DB: D1Database;
  REGISTER_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
  LOGIN_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

export interface H3EventContext {
  cloudflare: {
    env: CloudflareEnv;
    context: {
      waitUntil: (promise: Promise<any>) => void;
      passThroughOnException: () => void;
    };
  };
}