/**
 * Fixed-window in-memory rate limiter (per process). Good enough for a
 * single-instance MVP; swap for a shared store (e.g. Redis) when scaling.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Returns true when the request is allowed, false when throttled. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

/** Best-effort prune so the map cannot grow unbounded. */
export function pruneBuckets(): void {
  if (buckets.size < 10_000) return;
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (now > b.resetAt) buckets.delete(k);
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
