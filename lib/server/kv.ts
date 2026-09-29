import "server-only";
import { Redis } from "@upstash/redis";

/*
 * A tiny key-value store for server state that must be shared between
 * serverless instances: idempotency records, locked wallet quotes, spent
 * transaction hashes and field web-vitals samples.
 *
 * - With UPSTASH_REDIS_REST_URL / _TOKEN (or Vercel's KV_REST_API_URL / _TOKEN)
 *   it uses Upstash Redis over HTTP, which works in any serverless runtime.
 * - Without them (local dev, CI, e2e tests) it falls back to an in-memory map
 *   with the same semantics, so nothing needs configuring to run the project.
 *
 * Values are JSON. Every key gets a TTL so nothing piles up forever.
 */
export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  /** Set only if the key doesn't exist. Returns true if this call claimed it. */
  setIfAbsent(key: string, value: unknown, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
  /** Append to a capped list (newest last), refreshing its TTL. */
  pushCapped(key: string, value: unknown, max: number, ttlSeconds: number): Promise<void>;
  list<T>(key: string): Promise<T[]>;
  readonly backend: "redis" | "memory";
}

function redisStore(redis: Redis): KV {
  return {
    backend: "redis",
    async get<T>(key: string) {
      return (await redis.get<T>(key)) ?? null;
    },
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    async setIfAbsent(key, value, ttlSeconds) {
      return (await redis.set(key, value, { nx: true, ex: ttlSeconds })) === "OK";
    },
    async del(key) {
      await redis.del(key);
    },
    async pushCapped(key, value, max, ttlSeconds) {
      const p = redis.pipeline();
      p.rpush(key, value);
      p.ltrim(key, -max, -1);
      p.expire(key, ttlSeconds);
      await p.exec();
    },
    async list<T>(key: string) {
      return ((await redis.lrange<T>(key, 0, -1)) ?? []) as T[];
    },
  };
}

function memoryStore(): KV {
  const data = new Map<string, { value: unknown; expires: number }>();
  const live = (key: string) => {
    const hit = data.get(key);
    if (hit && hit.expires <= Date.now()) {
      data.delete(key);
      return undefined;
    }
    return hit;
  };
  // Round-trip through JSON so the fallback behaves like Redis (no shared references).
  const clone = <T>(v: unknown) => JSON.parse(JSON.stringify(v)) as T;
  return {
    backend: "memory",
    async get<T>(key: string) {
      const hit = live(key);
      return hit ? clone<T>(hit.value) : null;
    },
    async set(key, value, ttlSeconds) {
      data.set(key, { value: clone(value), expires: Date.now() + ttlSeconds * 1000 });
    },
    async setIfAbsent(key, value, ttlSeconds) {
      if (live(key)) return false;
      data.set(key, { value: clone(value), expires: Date.now() + ttlSeconds * 1000 });
      return true;
    },
    async del(key) {
      data.delete(key);
    },
    async pushCapped(key, value, max, ttlSeconds) {
      const current = (live(key)?.value as unknown[] | undefined) ?? [];
      const next = [...current, clone(value)].slice(-max);
      data.set(key, { value: next, expires: Date.now() + ttlSeconds * 1000 });
    },
    async list<T>(key: string) {
      const hit = live(key);
      return hit ? clone<T[]>(hit.value) : [];
    },
  };
}

function createStore(): KV {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? redisStore(new Redis({ url, token })) : memoryStore();
}

// One store per server instance (survives hot reloads in dev).
const globalForKv = globalThis as typeof globalThis & { __cozypawsKv?: KV };
export const kv: KV = globalForKv.__cozypawsKv ?? (globalForKv.__cozypawsKv = createStore());
