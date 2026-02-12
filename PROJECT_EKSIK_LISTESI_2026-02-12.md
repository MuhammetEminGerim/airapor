# Proje Eksik Listesi (12 Şubat 2026)

## 1) Kritik: Repoda düz metin şifre tutuluyor
- Kanıt: `supabasesifre.txt:1`
- Not: Dosya versiyon kontrolünde (`git ls-files` çıktısında var).

## 2) Kritik: Korumasız debug endpoint
- Kanıt: `src/app/api/test-models/route.ts:3`
- Not: Auth kontrolü yok, `raw` veri dönüyor (`src/app/api/test-models/route.ts:19`).

## 3) Yüksek: Rate limit devre dışı
- Kanıt: `src/app/api/generate/route.ts:21`
- Kanıt: `src/app/api/upload/route.ts:22`

## 4) Yüksek: Upload sınır kontrolleri eksik
- Kanıt: `src/app/api/upload/route.ts:32`
- Kanıt: `src/app/api/upload/route.ts:54`

## 5) Yüksek: Kullanıcı API anahtarı plaintext saklanıyor
- Kanıt: `src/app/dashboard/settings/page.tsx:93`
- Kullanım: `src/app/api/generate/route.ts:18`, `src/app/api/upload/route.ts:19`

## 6) Orta-Yüksek: Paylaşım token rotasyon/expiry yok
- Kanıt: `src/app/api/reports/[id]/share/route.ts:25`
- Kanıt: `src/app/api/reports/[id]/share/route.ts:28`

## 7) Yüksek: Lint kalite kapısı kırık
- Komut: `npm run lint`
- Sonuç: 52 bulgu (28 error, 24 warning)

## 8) Yüksek: Test altyapısı yok
- Komut: `npm test`
- Sonuç: `Missing script: "test"`
- Not: `src` altında test/spec dosyası yok.

## 9) Orta: Build uyarıları mevcut
- Komut: `npm run build`
- Uyarı: `middleware` yerine `proxy` öneriliyor.
- Uyarı: workspace root/çoklu lockfile uyarısı.

## 10) Orta: Kullanılmayan bağımlılık ve ölü kod
- Kanıt: `package.json:38` (`tesseract.js`) kodda kullanılmıyor.
- Kanıt: `package.json:27` (`jspdf-autotable`) kodda kullanılmıyor.
- Kanıt: `src/lib/rate-limit.ts:8`, `src/lib/constants.ts:1` fiilen kullanılmıyor.

## 11) Orta: Dokümantasyon ve metadata güncel değil
- Kanıt: `README.md:1` hâlâ varsayılan şablon.
- Kanıt: `src/app/layout.tsx:18` varsayılan metadata.
- Kanıt: `src/app/layout.tsx:28` `lang="en"` ama uygulama TR odaklı.

## 12) Orta: Repo hijyeni zayıf (ham/büyük dosyalar)
- Örnekler: `bozuk.pdf`, `deneme.txt`, `doru.txt`, `command for terminal.txt`

