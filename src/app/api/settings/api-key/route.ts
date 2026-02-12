import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { encryptSecret } from '@/lib/secrets'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const { apiKey } = await req.json()
    if (typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'Geçersiz API anahtarı.' }, { status: 400 })
    }

    const trimmed = apiKey.trim()

    const encryptedValue = trimmed ? encryptSecret(trimmed) : null

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      gemini_api_key: encryptedValue,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, hasApiKey: Boolean(encryptedValue) })
  } catch (error) {
    console.error('API Key update error:', error)
    return NextResponse.json(
      { error: 'API anahtarı güncellenemedi.' },
      { status: 500 }
    )
  }
}

