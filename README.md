# Rapor Asistani

AI destekli rapor olusturma, duzenleme, paylasim ve disa aktarma (TXT/PDF) uygulamasi.

## Teknoloji
- Next.js (App Router) + TypeScript
- Supabase (Auth + Postgres)
- Google Gemini (`@google/generative-ai`)
- Tailwind CSS + shadcn/ui

## Kurulum
1. Bagimliliklari yukle:
```bash
npm install
```
2. Ortam degiskenlerini ayarla:
```bash
cp .env.example .env.local
```
3. Gelistirme sunucusunu baslat:
```bash
npm run dev
```

## Ortam Degiskenleri
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `USER_API_KEY_ENCRYPTION_KEY` (kullanici API anahtarlarini sifrelemek icin zorunlu)
- `ENABLE_MODEL_DEBUG_ENDPOINT` (opsiyonel, `/api/test-models` endpoint'ini non-prod ortamda acmak icin)
- `DEBUG_MODEL_ALLOWED_USER_IDS` (opsiyonel, virgul ile ayrilmis allowlist)

## Komutlar
- `npm run dev`: gelistirme sunucusu
- `npm run lint`: ESLint kontrolu
- `npm run test`: birim testleri (Vitest)
- `npm run build`: prod build
- `npm run start`: prod sunucu
