import { describe, expect, it } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  it('blocks requests after limit and resets after the window', async () => {
    const key = `test:${Date.now()}:${Math.random()}`
    const limit = 2
    const windowMs = 40

    expect(rateLimit(key, limit, windowMs).success).toBe(true)
    expect(rateLimit(key, limit, windowMs).success).toBe(true)
    expect(rateLimit(key, limit, windowMs).success).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, windowMs + 15))

    expect(rateLimit(key, limit, windowMs).success).toBe(true)
  })
})

