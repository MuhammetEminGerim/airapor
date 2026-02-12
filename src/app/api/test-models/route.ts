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
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API Key yok' })

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'x-goog-api-key': apiKey,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Model listesi alınamadı.' }, { status: response.status })
    }

    const data = (await response.json()) as GeminiModelsResponse

    // Sadece generateContent destekleyenleri filtreleyelim
    const availableModels = data.models
      ?.filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => model.name) || []

    return NextResponse.json({
      count: availableModels.length,
      models: availableModels,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
