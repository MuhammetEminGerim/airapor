type RateLimitStore = {
  count: number
  lastReset: number
}

const store = new Map<string, RateLimitStore>()

export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60 * 1000) {
  const now = Date.now()
  const record = store.get(ip)

  if (!record) {
    store.set(ip, { count: 1, lastReset: now })
    return { success: true }
  }

  if (now - record.lastReset > windowMs) {
    record.count = 1
    record.lastReset = now
    return { success: true }
  }

  if (record.count >= limit) {
    return { success: false }
  }

  record.count++
  return { success: true }
}

// Her 10 dakikada bir eski kayıtları temizleyen basit bir garbage collector
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now - value.lastReset > 60 * 1000 * 10) { // 10 dakika
      store.delete(key)
    }
  }
}, 60 * 1000 * 10)
