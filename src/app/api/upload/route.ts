import { NextRequest, NextResponse } from 'next/server'
import { geminiVisionModel } from '@/lib/gemini'
import mammoth from 'mammoth'
import { createClient } from '@/lib/supabase-server'

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

    // Rate Limiting ve Plan Kontrolü Kaldırıldı.

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Dosya yüklenmedi.' }, { status: 400 })
    }

    // Dosyayı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // MIME Type kontrolü
    const mimeType = file.type

    // İşlenmiş metin
    let processedText = ""

    // PDF İşleme
    if (mimeType === 'application/pdf') {
        const pdf = require('pdf-parse')
        const pdfData = await pdf(buffer)
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
        const isAudio = mimeType.startsWith('audio/')

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

        const result = await geminiVisionModel.generateContent([prompt, mediaData])
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
