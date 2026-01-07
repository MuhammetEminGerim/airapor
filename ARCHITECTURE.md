# Proje Mimarisi ve Teknik Dokümantasyon

## 1. Proje Vizyonu
**Yapay Zeka Destekli Raporlama Asistanı**
Bu proje, kullanıcıların karmaşık metinlerden, kısa notlardan veya fotoğraflardan (belge, tablo) saniyeler içinde profesyonel raporlar oluşturmasını sağlayan bir web uygulamasıdır. Temel değer önerisi, saatler süren raporlama angaryasını dakikalara indirmektir.

## 2. Teknoloji Yığını (Tech Stack) - $0 Başlangıç Odaklı
Maliyet minimizasyonu ve yüksek performans için aşağıdaki teknolojiler seçilmiştir:

### Core & Frontend
- **Framework:** Next.js 14+ (App Router) - *Hem Frontend hem Backend API için.*
- **Dil:** TypeScript - *Tip güvenliği ve kod kalitesi için.*
- **Stil:** Tailwind CSS - *Hızlı UI geliştirme için.*
- **UI Kit:** shadcn/ui - *Modern, erişilebilir ve ücretsiz bileşenler için.*
- **Grafikler:** Recharts - *Dashboard istatistikleri için.*

### Backend & Veri (Serverless)
- **Database:** Supabase (PostgreSQL) - *Ücretsiz planda 500MB veri.*
- **Auth:** Supabase Auth - *E-posta ve Google girişi.*
- **Storage:** Supabase Storage - *Yüklenen belge ve resimler için.*

### Yapay Zeka & İşleme
- **LLM (Metin Üretimi):** Google Gemini API (Gemini 1.5 Flash/Pro) - *Geliştirici ücretsiz kotası (Rate-limited).*
- **OCR (Görüntü İşleme):**
  - *Basit Taramalar:* Tesseract.js (Client/Server-side kütüphane - Ücretsiz).
  - *Karmaşık Analiz:* Google Gemini Vision (Görseli anlama ve veriye çevirme).

### DevOps & Hosting
- **Hosting:** Vercel (Hobby Plan) - *Ücretsiz SSL, CD/CI ve hosting.*

## 3. Veritabanı Şeması (Taslak)

Veritabanı yapısı Supabase (PostgreSQL) üzerinde ilişkisel olarak kurgulanacaktır.

### `profiles` (Users)
- `id`: UUID (Supabase Auth ile bağlı)
- `email`: Text
- `full_name`: Text
- `avatar_url`: Text
- `created_at`: Timestamp

### `reports`
- `id`: UUID
- `user_id`: UUID (Foreign Key -> profiles.id)
- `title`: Text
- `status`: Enum ('draft', 'processing', 'completed')
- `input_summary`: Text (Kullanıcının girdiği ham veri özeti)
- `generated_content`: JSONB (AI tarafından üretilen yapılandırılmış rapor verisi)
- `created_at`: Timestamp

### `uploads`
- `id`: UUID
- `user_id`: UUID
- `report_id`: UUID (Opsiyonel, bir rapora bağlıysa)
- `file_path`: Text (Supabase Storage yolu)
- `file_type`: Text (image/jpeg, application/pdf vb.)
- `extracted_text`: Text (OCR sonucu elde edilen ham metin)

## 4. Klasör Yapısı (Directory Structure)

```
/
├── public/              # Statik dosyalar (logo, favicon)
├── src/
│   ├── app/             # Next.js App Router sayfaları
│   │   ├── (auth)/      # Login/Register sayfaları (Route Group)
│   │   ├── dashboard/   # Ana panel
│   │   ├── api/         # Backend API endpointleri
│   │   └── page.tsx     # Landing page
│   ├── components/      # UI Bileşenleri
│   │   ├── ui/          # shadcn/ui bileşenleri (Button, Input vb.)
│   │   └── features/    # Projeye özel bileşenler (ReportCard, Uploader vb.)
│   ├── lib/             # Yardımcı kütüphaneler
│   │   ├── supabase.ts  # Veritabanı bağlantısı
│   │   ├── gemini.ts    # AI servis yapılandırması
│   │   └── utils.ts     # Genel yardımcı fonksiyonlar
│   ├── types/           # TypeScript tip tanımlamaları
│   └── services/        # İş mantığı servisleri (AIService, OCRService)
└── ...config files
```

## 5. AI ve Prompt Mühendisliği Kuralları
1.  **Sistem Mesajları:** AI'ya her zaman "Sen profesyonel bir veri analistisin" rolü atanacak.
2.  **Gizlilik:** Kullanıcı verileri AI'ya gönderilmeden önce (mümkünse) anonimleştirilecek veya kullanıcıya verisinin işleneceği bilgisi verilecek.
3.  **Hata Toleransı:** AI servisleri (Gemini) yanıt vermezse veya kota dolarsa, kullanıcıya "Şu an yoğunluk var, lütfen bekleyin" mesajı gösterilecek (Graceful Degradation).

## 6. Geliştirme Yol Haritası (Roadmap)

1.  **Faz 1: Kurulum:** Next.js projesinin oluşturulması, Supabase bağlantısı ve Auth kurulumu.
2.  **Faz 2: Dashboard UI:** Ana ekranın, dosya yükleme alanının ve rapor listesinin kodlanması.
3.  **Faz 3: AI Entegrasyonu:** Gemini API ile bağlantı, basit metin özetleme fonksiyonunun yazılması.
4.  **Faz 4: OCR Modülü:** Fotoğraf yükleme ve Tesseract/Gemini Vision ile veri çekme.
5.  **Faz 5: Rapor Çıktısı:** Oluşan raporu ekranda düzgün gösterme ve PDF/Excel olarak dışa aktarma (Export).
