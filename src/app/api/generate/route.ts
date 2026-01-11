import { NextRequest, NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'
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

    // Kullanıcının API Key'ini çek
    const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', user.id).single()
    const userApiKey = profile?.gemini_api_key

    // Rate Limiting ve Plan Kontrolü Kaldırıldı.

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
GÖREV: Sen profesyonel bir veri analistisin.
AMAÇ: Aşağıdaki ham notları düzenli, anlaşılır ve profesyonel bir iş raporuna dönüştür.
KURALLAR:
1. Başlıklar, alt başlıklar ve madde işaretleri kullan.
2. HALÜSİNASYON ÖNLEME: Metinde net anlaşılmayan kısımları "[ANLAŞILAMADI]" olarak işaretle, uydurma.
3. Yazım hatalarını düzelt ama anlamı değiştirme.
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
