import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// Retry wrapper
async function generateWithRetry(model: GenerativeModel, params: any[], retries = 3, delay = 2000): Promise<any> {
  try {
    return await (model.generateContent as any)(...params)
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status === 503 || error.message?.includes('429'))) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return generateWithRetry(model, params, retries - 1, delay * 2)
    }
    throw error
  }
}

export function getGeminiModel(userApiKey?: string) {
  const apiKey = (userApiKey && userApiKey.trim() !== '') ? userApiKey : process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please set it in .env or provide it in user settings.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const baseModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  return {
    ...baseModel,
    generateContent: (...args: any[]) => generateWithRetry(baseModel, args)
  }
}

export function getGeminiVisionModel(userApiKey?: string) {
  const apiKey = (userApiKey && userApiKey.trim() !== '') ? userApiKey : process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please set it in .env or provide it in user settings.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const baseVisionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  return {
    ...baseVisionModel,
    generateContent: (...args: any[]) => generateWithRetry(baseVisionModel, args)
  }
}

// Backward compatibility (uses env var only)
// These are kept so existing code doesn't break immediately,
// but we should migrate to getGeminiModel() in routes.
const defaultGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const defaultBaseModel = defaultGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export const geminiModel = {
  ...defaultBaseModel,
  generateContent: (...args: any[]) => generateWithRetry(defaultBaseModel, args)
}

export const geminiVisionModel = {
  ...defaultBaseModel, // Using same model for vision as it supports both
  generateContent: (...args: any[]) => generateWithRetry(defaultBaseModel, args)
}
