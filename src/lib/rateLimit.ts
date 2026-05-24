/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * ⚠️  This is a single-process limiter. It resets on cold starts and
 * does NOT synchronize across multiple Vercel function instances.
 * For production multi-region deployments, replace with Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number; // Unix ms timestamp when the window resets
}

// Module-level store — persists across requests within the same Lambda warm instance
const store = new Map<string, RateLimitEntry>();

/**
 * Check whether a request from `key` is within the allowed rate.
 *
 * @param key       Unique identifier for the requester (e.g. IP address)
 * @param limit     Maximum number of requests allowed within `windowMs`
 * @param windowMs  Time window in milliseconds
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfter: seconds }`
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetTime) {
    // First request in this window, or window has expired — reset
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return { allowed: true };
  }

  // Limit exceeded
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return { allowed: false, retryAfter };
}

/**
 * Extract the best available IP address from a Next.js request.
 * Checks Vercel's forwarded header first, then falls back to x-real-ip.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; the first entry is the client IP
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
