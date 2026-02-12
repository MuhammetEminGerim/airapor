import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret, isEncryptedSecret } from './secrets'

const ORIGINAL_KEY = process.env.USER_API_KEY_ENCRYPTION_KEY

describe('secrets', () => {
  beforeEach(() => {
    process.env.USER_API_KEY_ENCRYPTION_KEY = 'unit-test-encryption-key'
  })

  afterEach(() => {
    if (ORIGINAL_KEY) {
      process.env.USER_API_KEY_ENCRYPTION_KEY = ORIGINAL_KEY
      return
    }

    delete process.env.USER_API_KEY_ENCRYPTION_KEY
  })

  it('encrypts and decrypts values', () => {
    const plaintext = 'AIzaSyFakeKeyForUnitTest'
    const encrypted = encryptSecret(plaintext)

    expect(isEncryptedSecret(encrypted)).toBe(true)
    expect(encrypted).not.toBe(plaintext)
    expect(decryptSecret(encrypted)).toBe(plaintext)
  })

  it('returns legacy plaintext values as-is', () => {
    const legacyPlaintext = 'legacy-key'
    expect(decryptSecret(legacyPlaintext)).toBe(legacyPlaintext)
  })
})

