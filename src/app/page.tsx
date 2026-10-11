import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  FileText,
  Share2,
  HardHat,
  Check,
  Building2,
  Camera,
  Scale,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 dark:opacity-20 pointer-events-none" />

      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-amber-500/20 to-orange-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md sticky top-0 z-50 bg-white/70 dark:bg-zinc-950/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
            <HardHat className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">İSG Saha Asistanı</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <Link href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Özellikler
          </Link>
          <Link href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Nasıl Çalışır?
          </Link>
          <Link href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Fiyatlandırma
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full px-5">
              Giriş Yap
            </Button>
          </Link>
          <Link href="/login?tab=register">
            <Button className="text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-full px-5 shadow-sm">
              Ücretsiz Başla
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 md:pt-32 md:pb-28 px-4 md:px-6">
          <div className="container mx-auto max-w-5xl text-center flex flex-col items-center">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
              6331 Sayılı Kanun & Yapı İşleri Mevzuatı Uyumlu
            </div>

            <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
              Saha Denetimlerini ve İSG Raporlarını <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                Otopilot&apos;a Alın.
              </span>
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
              Saha fotoğraflarını çekin, yükleyin. Yapay zeka uygunsuzlukları, kanun maddelerini ve risk derecelerini
              otomatik tespit etsin. Çift logolu ve resmi imzalı PDF raporunuz saniyeler içinde hazır.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
              <Link href="/dashboard/isg-denetim">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/20 transition-all duration-300 hover:scale-105 font-semibold"
                >
                  Saha Denetimi Başlat <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg rounded-full border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Paketleri İncele
                </Button>
              </Link>
            </div>

            {/* Mock Report Card Preview */}
            <div className="relative w-full max-w-4xl mx-auto rounded-2xl shadow-2xl shadow-amber-500/10 border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 text-left p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Bölen Otomotiv Yeni Depo İnşaatı</h3>
                    <p className="text-xs text-muted-foreground">Saha Gözetim ve Denetim Raporu • RAPOR-2026-052</p>
                  </div>
                </div>
                <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-900">
                  🔴 1 YÜKSEK RİSK TESPİT EDİLDİ
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3 bg-muted/30 p-4 rounded-xl border">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Konum</span>
                  <span className="font-semibold text-xs">A Blok 3. Kat / Asansör Boşluğu</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Yasal Mevzuat Referansı</span>
                  <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
                    Yapı İşlerinde İSG Yön. Ek-4 Md. 12
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Sorumlu & Termin</span>
                  <span className="font-semibold text-xs">Saha Şefi • 24 Saat İçinde</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="features" className="w-full py-24 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-zinc-100">
                İSG Uzmanları İçin Tasarlandı
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                Sahadaki her dakikanızı verimli kılacak, akşamları evde saatlerce Word/Excel ile uğraşmayı tarihe gömecek araçlar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Fotoğraftan Otomatik Tehlike Analizi</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                  Sahada çektiğiniz fotoğrafları sisteme yükleyin; Gemini Vision uygunsuzluğu analiz eder, risk derecesini
                  belirler ve uygulanması gereken düzeltici faaliyeti anında yazar.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                  <Scale className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">6331 Sayılı Mevzuat Eşleme</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Tespit edilen her eksikliğin yanına Türkiye mevzuatındaki ilgili yönetmelik maddesi (Yapı İşleri, İş
                  Ekipmanları vb.) otomatik eklenir.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Resmi Çift İmzalı PDF Çıktısı</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Firma ve OSGB logolarınızın yer aldığı, fotoğraflı renkli risk tablosu ve Uzman + İşveren imza kutulu resmi
                  A4 çıktısı.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Süreli & Güvenli Paylaşım Bağlantısı</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                  Raporu tek tıkla canlı linke dönüştürün, şantiye şefine veya taşeronlara WhatsApp üzerinden gönderin. 7 gün
                  sonra otomatik geçerliliğini yitirir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-24 bg-white dark:bg-zinc-950">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-zinc-100">
                  Nasıl Çalışır?
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                  Sahadan ofise gitmeye gerek kalmadan 3 basit adımda resmi raporlama.
                </p>
              </div>
              <Link href="/dashboard/isg-denetim">
                <Button variant="outline" className="rounded-full gap-2">
                  Hemen Dene <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Sahada Fotoğraf Çek',
                  desc: 'Şantiyede uygunsuz gördüğün yerlerin fotoğraflarını telefonundan sisteme yükle.',
                },
                {
                  step: '02',
                  title: 'Yapay Zeka Analiz Etsin',
                  desc: 'Gemini Vision fotoğraftaki tehlikeyi, yönetmelik maddesini ve risk derecesini çıkarsın.',
                },
                {
                  step: '03',
                  title: 'İmzalı PDF İndir / Paylaş',
                  desc: 'Logolu, fotoğraflı ve çift imza kutulu resmi PDF çıktısını al veya link olarak ilet.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                >
                  <div className="text-6xl font-bold text-zinc-200 dark:text-zinc-800 mb-6 group-hover:text-amber-200 dark:group-hover:text-amber-900/30 transition-colors select-none">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-24 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-zinc-100">
                Şeffaf ve Uygun Fiyatlandırma
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                İster bağımsız uzman olun, ister yüzlerce şantiyesi olan bir OSGB.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Plan 1 */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">Başlangıç</h3>
                  <p className="text-xs text-muted-foreground mb-4">Sistemi denemek isteyen uzmanlar için</p>
                  <div className="text-4xl font-extrabold mb-6">
                    0 ₺ <span className="text-sm font-normal text-muted-foreground">/ ay</span>
                  </div>
                  <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Ayda 3 Saha Raporu
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Temel AI Fotoğraf Analizi
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Standart PDF İndirme
                    </li>
                  </ul>
                </div>
                <Link href="/login?tab=register">
                  <Button variant="outline" className="w-full rounded-full">
                    Ücretsiz Başla
                  </Button>
                </Link>
              </div>

              {/* Plan 2 (Popular) */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-2 border-amber-500 shadow-xl shadow-amber-500/10 flex flex-col justify-between relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  En Çok Tercih Edilen
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">İSG Uzmanı</h3>
                  <p className="text-xs text-muted-foreground mb-4">Aktif sahada çalışan bağımsız uzmanlar için</p>
                  <div className="text-4xl font-extrabold mb-6 text-amber-600 dark:text-amber-400">
                    399 ₺ <span className="text-sm font-normal text-muted-foreground">/ ay</span>
                  </div>
                  <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Sınırsız Saha Raporu
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Sınırsız Gemini Vision Analizi
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Özel Firma & OSGB Logosu Ekleme
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> İki İmzalı Resmi Kurumsal PDF
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> 7 Gün Süreli Paylaşım Linkleri
                    </li>
                  </ul>
                </div>
                <Link href="/login?tab=register">
                  <Button className="w-full rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                    Hemen Abone Ol
                  </Button>
                </Link>
              </div>

              {/* Plan 3 */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">Kurumsal / OSGB</h3>
                  <p className="text-xs text-muted-foreground mb-4">Büyük ekipler ve OSGB firmaları için</p>
                  <div className="text-4xl font-extrabold mb-6">
                    1.490 ₺ <span className="text-sm font-normal text-muted-foreground">/ ay</span>
                  </div>
                  <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Çoklu Uzman & Şantiye Yönetimi
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Tüm Profesyonel Özellikler
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> Merkezi OSGB Dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" /> 7/24 Öncelikli Teknik Destek
                    </li>
                  </ul>
                </div>
                <Link href="/login?tab=register">
                  <Button variant="outline" className="w-full rounded-full">
                    İletişime Geç
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 px-4 md:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-20 text-center">
              <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  Saatlerce Rapor Yazmaya <br /> Son Verin.
                </h2>
                <p className="text-zinc-400 dark:text-zinc-600 text-lg max-w-xl mx-auto">
                  Bugün ücretsiz başlayın. İlk saha denetim raporunuzu 5 dakika içinde oluşturup PDF olarak indirin.
                </p>
                <div className="pt-2">
                  <Link href="/dashboard/isg-denetim">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-2xl hover:scale-105 transition-transform"
                    >
                      Hemen Başlayın
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
                <HardHat className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg">İSG Saha Asistanı</span>
            </div>

            <div className="flex gap-8 text-sm font-medium text-zinc-500">
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Gizlilik
              </Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Şartlar
              </Link>
              <Link href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Fiyatlar
              </Link>
            </div>

            <p className="text-xs text-zinc-400">© 2026 İSG Saha Asistanı. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
