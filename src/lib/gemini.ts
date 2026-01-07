import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY!
const genAI = new GoogleGenerativeAI(apiKey)

const baseModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
const baseVisionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

// Proxy object to intercept generateContent calls
export const geminiModel = {
  ...baseModel,
  generateContent: (...args: any[]) => generateWithRetry(baseModel, args)
}

export const geminiVisionModel = {
  ...baseVisionModel,
  generateContent: (...args: any[]) => generateWithRetry(baseVisionModel, args)
}
