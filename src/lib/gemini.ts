import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerateContentRequest,
  GenerateContentResult,
  Part,
  SingleRequestOptions,
} from '@google/generative-ai'

type GenerateContentArgs = [
  request: GenerateContentRequest | string | Array<string | Part>,
  requestOptions?: SingleRequestOptions,
]

type RetryableError = {
  status?: number
  message?: string
}

// Retry wrapper
async function generateWithRetry(
  model: GenerativeModel,
  params: GenerateContentArgs,
  retries = 3,
  delay = 2000
): Promise<GenerateContentResult> {
  try {
    return await model.generateContent(...params)
  } catch (error: unknown) {
    const retryableError = error as RetryableError
    if (
      retries > 0 &&
      (retryableError.status === 429 ||
        retryableError.status === 503 ||
        retryableError.message?.includes('429'))
    ) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return generateWithRetry(model, params, retries - 1, delay * 2)
    }
    throw retryableError
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
    generateContent: (...args: GenerateContentArgs) => generateWithRetry(baseModel, args)
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
    generateContent: (...args: GenerateContentArgs) => generateWithRetry(baseVisionModel, args)
  }
}

// Backward compatibility (lazy evaluated to prevent module-level crash if env key is missing)
export const geminiModel = {
  generateContent: (...args: GenerateContentArgs) => getGeminiModel().generateContent(...args),
}

export const geminiVisionModel = {
  generateContent: (...args: GenerateContentArgs) => getGeminiVisionModel().generateContent(...args),
}

