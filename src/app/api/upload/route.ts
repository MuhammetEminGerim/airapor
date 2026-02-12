import { NextRequest, NextResponse } from 'next/server'
import { getGeminiVisionModel } from '@/lib/gemini'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { createClient } from '@/lib/supabase-server'
import { PLAN_LIMITS } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { decryptSecret } from '@/lib/secrets'

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const DOC_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json(
            { error: 'Oturum açmanız gerekiyor.' },
            { status: 401 }
        )
    }

    const limiter = rateLimit(`upload:${user.id}`, PLAN_LIMITS.free.limit, PLAN_LIMITS.free.window)
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }

    // Kullanıcının API Key'ini çek
    const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single()
    let userApiKey: string | undefined
    try {
      userApiKey = decryptSecret(profile?.gemini_api_key)
    } catch {
      return NextResponse.json(
        { error: 'API anahtarı çözümlenemedi. Lütfen ayarlardan yeniden kaydedin.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Dosya yüklenmedi.' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Boş dosya yüklenemez.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Dosya boyutu limiti aşıldı. Maksimum 15MB desteklenir.' },
        { status: 413 }
      )
    }

    // Dosyayı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // MIME Type kontrolü
    const mimeType = file.type
    const isAudio = mimeType.startsWith('audio/')
    const isImage = mimeType.startsWith('image/')
    const isDocument = DOC_MIME_TYPES.has(mimeType)

    if (!isAudio && !isImage && !isDocument) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya tipi. Sadece resim, ses, PDF ve DOCX kabul edilir.' },
        { status: 415 }
      )
    }

    // İşlenmiş metin
    let processedText = ""

    // PDF İşleme
    if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(buffer)
        processedText = pdfData.text
    }
    // Word (DOCX) İşleme
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer })
        processedText = result.value
    }
    // Resim ve Ses (Mevcut Logic)
    else {
        const base64Data = buffer.toString('base64')

        // Gemini'ye gönderilecek format
        const mediaData = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        }

        // Prompt Seçimi
        let prompt = "Bu resimdeki tüm yazıları, notları ve tabloları detaylıca oku ve metin olarak dışarı aktar. Sadece içeriği ver, yorum yapma. Eğer tablo varsa markdown tablosu olarak ver."

        if (isAudio) {
            prompt = "Bu ses kaydını dinle ve içeriğini detaylı bir şekilde yazıya dök (transkript). Konuşulanları profesyonel bir dille özetle ve varsa alınan kararları veya önemli notları madde madde listele. Sadece raporu ver, 'İşte döküm' gibi giriş cümleleri kurma."
        }

        const model = getGeminiVisionModel(userApiKey)
        const result = await model.generateContent([prompt, mediaData])
        const response = await result.response
        processedText = response.text()
    }

    return NextResponse.json({ text: processedText })
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json(
      { error: 'Dosya işlenirken hata oluştu: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
