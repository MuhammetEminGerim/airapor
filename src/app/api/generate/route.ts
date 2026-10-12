import { NextRequest, NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'
import { createClient } from '@/lib/supabase-server'
import { PlanType, PLAN_LIMITS } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { decryptSecret } from '@/lib/secrets'

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

    // Kullanıcının profilini, API Key'ini ve Plan bilgisini çek
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const userPlan = ((profile?.plan as PlanType) || 'free') in PLAN_LIMITS ? (profile?.plan as PlanType) : 'free'
    const planConfig = PLAN_LIMITS[userPlan]

    const limiter = await checkRateLimit(`generate:${user.id}`, planConfig.limit, planConfig.window)
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }

    let userApiKey: string | undefined
    try {
      userApiKey = decryptSecret(profile?.gemini_api_key)
    } catch {
      return NextResponse.json(
        { error: 'API anahtarı çözümlenemedi. Lütfen ayarlardan yeniden kaydedin.' },
        { status: 500 }
      )
    }

    const { text, reportType, templateId } = await req.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Metin içeriği zorunludur.' },
        { status: 400 }
      )
    }

    let systemPrompt = ""

    if (templateId) {
        // Özel Şablon Kullanımı
        const { data: template, error } = await supabase
            .from('templates')
            .select('system_prompt')
            .eq('id', templateId)
            .single()

        if (error || !template) {
            return NextResponse.json(
                { error: 'Seçilen şablon bulunamadı.' },
                { status: 404 }
            )
        }
        systemPrompt = template.system_prompt
    } else {
        // Standart Rapor Türleri
        switch (reportType) {
        case 'isg':
            systemPrompt = `
GÖREV: Sen kıdemli bir İş Sağlığı ve Güvenliği (İSG) Uzmanısın.
AMAÇ: Aşağıdaki verileri/notları analiz ederek resmi bir İSG Denetim Raporu oluştur.
KURALLAR:
1. Türkiye'deki "Yapı İşlerinde İSG Yönetmeliği" ve "6331 Sayılı İSG Kanunu"nu referans al.
2. Tespit ettiğin her uygunsuzluğun yanına, ilgili yönetmelik maddesini mutlaka parantez içinde ekle. (Örn: Yapı İşl. Yön. Ek-4 Madde 12).
3. HALÜSİNASYON ÖNLEME: Metinde/resimde net olmayan bir ifade varsa, asla tahmin yürütme. Bunun yerine "[BELİRSİZ İFADE - NETLEŞTİRİLMELİ]" yaz.
4. Okunamayan kelimeler için "[OKUNAMADI]" etiketini kullan.
5. Rapor dili resmi, emir kipi içermeyen, teknik ve net olmalı.
6. Çıktıyı Markdown formatında ver (Başlıklar, Maddeler).

VERİ:
`
            break;

        case 'risk':
            systemPrompt = `
GÖREV: Sen kıdemli bir İş Sağlığı ve Güvenliği Risk Değerlendirme Uzmanısın.
AMAÇ: Aşağıdaki saha verilerini analiz ederek 5x5 L Tipi Risk Matrisi metodolojisine uygun Risk Değerlendirme Raporu oluştur.
KURALLAR:
1. Tehlike, Risk, Olasılık (1-5) ve Şiddet (1-5) puanlaması yaparak Risk Skorunu (1-25) ve Risk Seviyesini (Kabul Edilemez, Önemli, Katlanılabilir) belirle.
2. 6331 Sayılı İSG Kanunu ve İSG Risk Değerlendirmesi Yönetmeliği'ni referans al.
3. Önleyici ve Düzeltici Faaliyet (DÖF) önerileri sun.
4. Çıktıyı Markdown formatında düzenli tablolar ve maddeler halinde ver.

VERİ:
`
            break;

        case 'ramak_kala':
            systemPrompt = `
GÖREV: Sen kıdemli bir İş Sağlığı ve Güvenliği Olay Araştırma Uzmanısın.
AMAÇ: Aşağıdaki verileri inceleyerek resmi bir Ramak Kala / Olay Bildirim ve İnceleme Raporu oluştur.
KURALLAR:
1. Olayın özeti, oluş şekli, potansiyel sonuçları ve kök nedenlerini (5 Neden Metodu) açıkla.
2. Benzer olayların ve kazaların önlenmesi için acil ve kalıcı DÖF aksiyonlarını listele.
3. İlgili mevzuat ve işletme içi sorumlulukları belirt.
4. Çıktıyı profesyonel Markdown formatında düzenle.

VERİ:
`
            break;

        case 'finans':
            systemPrompt = `
GÖREV: Sen kıdemli bir Finans Analistisin.
AMAÇ: Aşağıdaki verileri finansal bir özet raporuna dönüştür.
KURALLAR:
1. Rakamları netleştir (Para birimi, yüzdelik vb.).
2. Eğer verilerde tutarsızlık varsa (Gelir < Gider ama kar var denmişse) bunu "[VERİ TUTARSIZLIĞI]" olarak işaretle.
3. Asla olmayan bir rakamı uydurma.
VERİ:
`
            break;

        default: // 'genel'
            systemPrompt = `
GÖREV: Sen kıdemli bir İSG ve Saha Denetim Danışmanısın.
AMAÇ: Aşağıdaki saha notlarını düzenli, anlaşılır ve profesyonel bir İSG değerlendirme raporuna dönüştür.
KURALLAR:
1. Başlıklar, alt başlıklar ve madde işaretleri kullan.
2. 6331 sayılı İSG mevzuatı standartlarına uygun teknik bir dil benimse.
3. Tespitler ve önerilen aksiyonlar şeklinde bölümlendir.
4. Metinde net anlaşılmayan kısımları "[ANLAŞILAMADI]" olarak işaretle, asla uydurma.
VERİ:
`
            break;
        }
    }

    const model = getGeminiModel(userApiKey)
    const result = await model.generateContent(systemPrompt + text)
    const response = await result.response
    const generatedText = response.text()

    return NextResponse.json({ result: generatedText })
  } catch (error) {
    console.error('AI Generation Error:', error)
    return NextResponse.json(
      { error: 'Rapor oluşturulurken bir hata oluştu: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
