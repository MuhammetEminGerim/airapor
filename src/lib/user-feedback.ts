export function getReadableErrorMessage(
  error: unknown,
  fallback = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
): string {
  const rawMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : ''

  if (!rawMessage) return fallback

  const message = rawMessage.toLowerCase()

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
  }

  if (message.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı. Bilgilerinizi kontrol ederek tekrar deneyin.'
  }

  if (message.includes('email not confirmed')) {
    return 'E-posta adresiniz doğrulanmamış. Önce doğrulama bağlantısını açın.'
  }

  if (message.includes('429') || message.includes('too many requests')) {
    return 'Kısa sürede çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
  }

  if (rawMessage.length > 220) {
    return fallback
  }

  return rawMessage
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

