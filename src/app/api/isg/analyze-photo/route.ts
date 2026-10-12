import { NextRequest, NextResponse } from 'next/server'
import { getGeminiVisionModel } from '@/lib/gemini'
import { createClient } from '@/lib/supabase-server'
import { PlanType, PLAN_LIMITS } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { decryptSecret } from '@/lib/secrets'
import type { ISGRiskLevel } from '@/types/isg'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB max
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])

interface AIAnalysisOutput {
  hazardDetected: boolean
  description: string
  regulationRef: string
  riskLevel: ISGRiskLevel
  suggestedAction: string
  responsible: string
  suggestedDays: number
}

const ISG_SYSTEM_PROMPT = `GÖREV: Sen Türkiye'de görev yapan kıdemli bir A Sınıfı İş Sağlığı ve Güvenliği (İSG) Denetçisisin.
GÖNDERİLEN GÖRSEL: Şantiye, fabrika veya işyerinde çekilmiş bir saha denetim fotoğrafı.

AMAÇ:
Fotoğraftaki tehlikeleri, uygunsuzlukları veya risk teşkil eden durumları analiz ederek Türk İSG Mevzuatına uygun, resmi denetim raporunda yer alacak nitelikte bir bulguya dönüştür.

KURALLAR:
1. MEVZUAT DAYANAĞI (regulationRef):
   - Tespit ettiğin uygunsuzluğu mutlaka Türkiye mevzuatıyla eşleştir (Örn: "Yapı İşlerinde İSG Yönetmeliği Ek-4 Bölüm II Madde 12", "6331 Sayılı İSG Kanunu Madde 10", "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yön. Ek-II Madde 4", "Elektrik İç Tesisleri Yönetmeliği Md. 25" vb.).
2. RİSK DERECESİ (riskLevel):
   - "high": Yüksekten düşme riski, açık asansör/şaft boşlukları, çökme riski, açıkta elektrik kablosu, derhal iş durdurmayı gerektiren hayati tehlikeler.
   - "medium": Eksik KKD (baret, yelek, emniyet kemeri bağlantı noktası), düzensiz malzeme istifi, korkuluk yüksekliği yetersizliği, eksik uyarı levhası vb.
   - "low": Genel tertip ve düzen (5S) eksikliği, silinmiş levha, küçük ikincil önlemler.
3. ÖNERİLEN AKSİYON (suggestedAction):
   - Sahada uygulanması gereken teknik, net ve kesin düzeltici/önleyici faaliyeti belirt.
4. SORUMLU (responsible):
   - Bu sorunu çözecek saha birimi veya unvanı (Örn: "Saha Şefi", "Kalıpçı Taşeronu", "Elektrik Ekibi", "İskele Sorumlusu", "Mekanik Ekip", "Tüm Çalışanlar").
5. ÖNERİLEN TERMİN (suggestedDays):
   - Yüksek risk için 1 (aynı gün/derhal), orta risk için 2-3, düşük risk için 5-7 gün.

YALNIZCA AŞAĞIDAKİ JSON ŞEMASINDA YANIT VER (Başka hiçbir giriş veya kapanış metni yazma):
{
  "hazardDetected": true,
  "description": "Tespit edilen tehlikenin net teknik açıklaması",
  "regulationRef": "İlgili yönetmelik ve madde referansı",
  "riskLevel": "high",
  "suggestedAction": "Alınması gereken teknik önlem",
  "responsible": "Sorumlu birim/unvan",
  "suggestedDays": 1
}

Eğer fotoğrafta belirgin bir tehlike veya uygunsuzluk yoksa:
"hazardDetected": false, "riskLevel": "low", "description": "Görselde belirgin bir iş güvenliği uygunsuzluğu tespit edilmedi.", "regulationRef": "6331 Sayılı İSG Kanunu", "suggestedAction": "Mevcut güvenli çalışma koşullarının korunması tavsiye edilir.", "responsible": "Saha Şefi", "suggestedDays": 0 olarak ver.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    // Kullanıcının profilini, API Key'ini ve Plan bilgisini çek
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const userPlan = ((profile?.plan as PlanType) || 'free') in PLAN_LIMITS ? (profile?.plan as PlanType) : 'free'
    const planConfig = PLAN_LIMITS[userPlan]

    const limiter = await checkRateLimit(`isg-photo:${user.id}`, planConfig.limit, planConfig.window)
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }

    let userApiKey: string | undefined
    if (profile?.gemini_api_key) {
      try {
        userApiKey = decryptSecret(profile.gemini_api_key)
      } catch {
        return NextResponse.json(
          { error: 'Kayıtlı API anahtarınız çözümlenemedi. Ayarlardan tekrar kaydedin.' },
          { status: 500 }
        )
      }
    }

    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const location = (formData.get('location') as string) || ''
    const projectContext = (formData.get('projectContext') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'Fotoğraf yüklenmedi.' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Boş dosya yüklenemez.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Fotoğraf boyutu 10MB sınırını aşıyor.' },
        { status: 413 }
      )
    }

    const mimeType = file.type || 'image/jpeg'
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya türü. Lütfen JPEG, PNG veya WEBP formatında fotoğraf yükleyin.' },
        { status: 415 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')

    // 1. Storage bucket yüklemesi dene (hata verirse Base64 data-url fallback)
    let photoUrl = `data:${mimeType};base64,${base64Data}`
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('isg-photos')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('isg-photos')
          .getPublicUrl(uploadData.path)
        if (publicUrlData?.publicUrl) {
          photoUrl = publicUrlData.publicUrl
        }
      }
    } catch {
      // Storage hazır değilse veya hata verirse data URL ile sorunsuz devam et
    }

    // 2. Gemini Vision ile analiz et
    let contextPrompt = ISG_SYSTEM_PROMPT
    if (projectContext.trim()) {
      contextPrompt += `\n\nŞANTİYE / İŞYERİ TÜRÜ: ${projectContext.trim()}`
    }
    if (location.trim()) {
      contextPrompt += `\nFOTOĞRAFIN ÇEKİLDİĞİ KONUM: ${location.trim()}`
    }

    const mediaData = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    }

    const visionModel = getGeminiVisionModel(userApiKey)
    const result = await visionModel.generateContent([contextPrompt, mediaData])
    const responseText = result.response.text()

    // 3. JSON sonucunu güvenli parse et
    let parsed: AIAnalysisOutput
    try {
      // Markdown backtick bloklarını temizle
      const cleanedText = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      parsed = JSON.parse(cleanedText)
    } catch {
      // JSON formatı dışında düz metin dönmüşse graceful fallback
      parsed = {
        hazardDetected: true,
        description: responseText.trim(),
        regulationRef: '6331 Sayılı İSG Kanunu ve İlgili Yönetmelikler',
        riskLevel: 'high',
        suggestedAction: 'Tespit edilen uygunsuzluk için gerekli teknik tedbirler derhal alınmalıdır.',
        responsible: 'Saha Şefi',
        suggestedDays: 1,
      }
    }

    // Termin tarihini hesapla (YYYY-MM-DD)
    const deadlineDate = new Date()
    deadlineDate.setDate(deadlineDate.getDate() + (parsed.suggestedDays || 1))
    const formattedDeadline = deadlineDate.toISOString().split('T')[0]

    return NextResponse.json({
      success: true,
      photoUrl,
      finding: {
        id: `f-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        photoUrl,
        location: location.trim() || undefined,
        description: parsed.description || 'Görselde uygunsuzluk tespit edildi.',
        regulationRef: parsed.regulationRef || '6331 Sayılı İSG Kanunu',
        riskLevel: (['high', 'medium', 'low'].includes(parsed.riskLevel) ? parsed.riskLevel : 'high') as ISGRiskLevel,
        suggestedAction: parsed.suggestedAction || 'Gerekli güvenlik önlemleri alınmalıdır.',
        responsible: parsed.responsible || 'Saha Şefi',
        deadline: formattedDeadline,
        status: 'open' as const,
      },
    })
  } catch (error) {
    console.error('İSG Photo Analysis Error:', error)
    return NextResponse.json(
      { error: 'Fotoğraf analiz edilirken bir hata oluştu: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
