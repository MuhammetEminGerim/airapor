import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  FileText,
  Smartphone,
  Bot,
  Share2,
  ShieldCheck,
  LayoutTemplate
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center font-bold text-xl gap-2" href="/">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>Rapor Asistanı</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block" href="#features">
            Özellikler
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block" href="#how-it-works">
            Nasıl Çalışır?
          </Link>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <Link href="/login">
            <Button variant="ghost" size="sm">Giriş Yap</Button>
          </Link>
          <Link href="/login?tab=register">
            <Button size="sm">Ücretsiz Başla</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-4">
                  ✨ Yeni: Kişiselleştirilebilir Asistanlar Yayında
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500">
                  İşinizi Yapay Zeka ile <br /> Raporlayın
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl py-4">
                  Ses kayıtlarını, toplantı notlarını veya karmaşık verilerinizi saniyeler içinde profesyonel PDF raporlarına dönüştürün.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
                <Link href="/dashboard">
                  <Button size="lg" className="h-12 px-8 text-lg w-full sm:w-auto shadow-lg shadow-primary/20">
                    Hemen Başla <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                   <Button variant="outline" size="lg" className="h-12 px-8 text-lg w-full sm:w-auto">
                    Nasıl Çalışır?
                  </Button>
                </Link>
              </div>
              <div className="pt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Kredi Kartı Gerekmez
                </div>
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Ücretsiz Başlangıç
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30 border-y">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Neden Rapor Asistanı?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Standart AI sohbetlerinden fazlası. İş akışınız için tasarlanmış profesyonel araçlar.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col p-6 bg-background rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Özel Asistanlar</h3>
                <p className="text-muted-foreground">
                  Sadece özetleme istemeyin. Hukuk danışmanı, SEO uzmanı veya sınav okuyucu gibi özel roller atayın ve uzman raporları alın.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col p-6 bg-background rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Çoklu Format Desteği</h3>
                <p className="text-muted-foreground">
                  Sadece metin değil; ses kayıtları, PDF dosyaları, Word belgeleri ve hatta el yazısı fotoğraflarını yükleyin. AI hepsini anlar.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col p-6 bg-background rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Akıllı Paylaşım</h3>
                <p className="text-muted-foreground">
                  Oluşturduğunuz raporları tek tıkla herkese açık bir web sayfasına dönüştürün ve müşterilerinizle paylaşın.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col p-6 bg-background rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                  <LayoutTemplate className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Profesyonel Şablonlar</h3>
                <p className="text-muted-foreground">
                  İSG, Finans veya Genel formatlarda hazır şablonları kullanın. Çıktılarınız her zaman kurumsal ve düzenli olsun.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col p-6 bg-background rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">PDF İhracatı</h3>
                <p className="text-muted-foreground">
                  Raporlarınızı anında A4 formatında, Türkçe karakter sorunu olmadan PDF olarak indirin ve arşivleyin.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="flex flex-col p-6 bg-background rounded-2xl shadow-sm border hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Kendi API Anahtarın</h3>
                <p className="text-muted-foreground">
                  İsterseniz kendi Google Gemini API anahtarınızı girerek limitlere takılmadan özgürce ve güvenle çalışın.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Nasıl Çalışır?</h2>
                <p className="text-muted-foreground">
                    Karmaşık süreçleri 3 basit adıma indirdik.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-24 w-24 bg-background border-4 border-muted rounded-full flex items-center justify-center shadow-lg text-2xl font-bold text-muted-foreground">
                        1
                    </div>
                    <h3 className="text-xl font-bold">Verini Yükle</h3>
                    <p className="text-muted-foreground max-w-xs">
                        Ses kaydı al, fotoğraf çek veya dosya yükle. Format fark etmez.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-24 w-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg text-2xl font-bold">
                        2
                    </div>
                    <h3 className="text-xl font-bold">AI Analiz Etsin</h3>
                    <p className="text-muted-foreground max-w-xs">
                        Seçtiğin asistan (örn: Hukukçu) veriyi analiz eder ve raporunu yazar.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-24 w-24 bg-background border-4 border-muted rounded-full flex items-center justify-center shadow-lg text-2xl font-bold text-muted-foreground">
                        3
                    </div>
                    <h3 className="text-xl font-bold">Paylaş ve Bitir</h3>
                    <p className="text-muted-foreground max-w-xs">
                        Raporu PDF olarak indir veya bir link ile takımınla paylaş.
                    </p>
                </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-zinc-900 text-zinc-50">
            <div className="container px-4 md:px-6 mx-auto text-center">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Raporlamaya Zaman Harcamayı Bırakın</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto mb-8 text-lg">
                    Bugün ücretsiz üye olun ve yapay zeka destekli iş akışının konforunu yaşayın. Kredi kartı gerekmez.
                </p>
                <Link href="/login?tab=register">
                    <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold">
                        Hemen Başlayın <Zap className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-auto bg-muted/20">
        <p className="text-xs text-muted-foreground">© 2026 Rapor Asistanı. Tüm hakları saklıdır.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Kullanım Şartları
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Gizlilik Politikası
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="https://github.com/MuhammetEminGerim" target="_blank">
            Geliştirici
          </Link>
        </nav>
      </footer>
    </div>
  )
}
