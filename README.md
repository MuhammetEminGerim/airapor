# Rapor Asistanı

AI destekli rapor oluşturma, düzenleme, paylaşım ve dışa aktarma (TXT/PDF) uygulaması.

## Teknoloji
- Next.js (App Router) + TypeScript
- Supabase (Auth + Postgres)
- Google Gemini (`@google/generative-ai`)
- Tailwind CSS + shadcn/ui

## Kurulum
1. Bağımlılıkları yükle:
```bash
npm install
```
2. Ortam değişkenlerini ayarla:
```bash
cp .env.example .env.local
```
3. Geliştirme sunucusunu başlat:
```bash
npm run dev
```

## Ortam Değişkenleri
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `USER_API_KEY_ENCRYPTION_KEY` (kullanıcı API anahtarlarını şifrelemek için zorunlu)

## Komutlar
- `npm run dev`: geliştirme sunucusu
- `npm run lint`: ESLint kontrolü
- `npm run test`: birim testleri (Vitest)
- `npm run build`: prod build
- `npm run start`: prod sunucu

