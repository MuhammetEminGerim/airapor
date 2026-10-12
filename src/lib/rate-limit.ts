type RateLimitStore = {
  count: number
  lastReset: number
}

const store = new Map<string, RateLimitStore>()

export interface RateLimitResult {
  success: boolean
  remaining?: number
  reset?: number
}

// Synchronous rate limiter (compatible with existing calls, local memory store with sliding reset)
export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60 * 1000): RateLimitResult {
  const now = Date.now()
  const record = store.get(ip)

  if (!record) {
    store.set(ip, { count: 1, lastReset: now })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (now - record.lastReset > windowMs) {
    record.count = 1
    record.lastReset = now
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.lastReset + windowMs }
  }

  record.count++
  return { success: true, remaining: limit - record.count, reset: record.lastReset + windowMs }
}

// Asynchronous rate limiter supporting Upstash Redis REST API when available in production
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000)
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', `ratelimit:${key}`],
          ['EXPIRE', `ratelimit:${key}`, windowSeconds],
        ]),
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        const count = data[0]?.result as number
        if (typeof count === 'number') {
          return {
            success: count <= limit,
            remaining: Math.max(0, limit - count),
            reset: Date.now() + windowMs,
          }
        }
      }
    } catch (err) {
      console.warn('Upstash rate limit fallback to memory store:', err)
    }
  }

  return rateLimit(key, limit, windowMs)
}

// Her 10 dakikada bir eski kayıtları temizleyen garbage collector
const gcInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now - value.lastReset > 60 * 1000 * 10) {
      store.delete(key)
    }
  }
}, 60 * 1000 * 10)

gcInterval.unref?.()
