import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type GeminiModel = {
  name: string
  supportedGenerationMethods?: string[]
}

type GeminiModelsResponse = {
  models?: GeminiModel[]
}

export async function GET() {
  try {
    const isDebugEndpointEnabled = process.env.ENABLE_MODEL_DEBUG_ENDPOINT === 'true'
    if (!isDebugEndpointEnabled || process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum acmaniz gerekiyor.' }, { status: 401 })
    }

    const allowedUserIds = (process.env.DEBUG_MODEL_ALLOWED_USER_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (allowedUserIds.length > 0 && !allowedUserIds.includes(user.id)) {
      return NextResponse.json({ error: 'Yetkiniz bulunmuyor.' }, { status: 403 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key bulunamadi.' }, { status: 500 })
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'x-goog-api-key': apiKey,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Model listesi alinamadi.' }, { status: response.status })
    }

    const data = (await response.json()) as GeminiModelsResponse

    const availableModels =
      data.models
        ?.filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model) => model.name) || []

    return NextResponse.json({
      count: availableModels.length,
      models: availableModels,
    })
  } catch (error) {
    console.error('Model debug endpoint failed:', error)
    return NextResponse.json({ error: 'Model listesi alinamadi.' }, { status: 500 })
  }
}
