import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Zap, FileText, Smartphone } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center font-bold text-xl" href="/">
          <FileText className="mr-2 h-6 w-6" />
          Rapor Asistanı
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="/login">
            Giriş Yap
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Raporlama Angaryasına Son Verin
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Notlarınızı, saha fotoğraflarınızı veya karmaşık verilerinizi yapay zeka ile saniyeler içinde profesyonel raporlara, İSG tutanaklarına veya finansal özetlere dönüştürün.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link href="/dashboard">
                  <Button size="lg" className="h-12 px-8 text-lg">
                    Ücretsiz Dene <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                   <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Yapay Zeka Hızı</h2>
                <p className="text-muted-foreground">
                  Saatler süren rapor yazma işini saniyelere indirin. Gemini AI teknolojisi ile en karmaşık verileri bile anında özetleyin.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <Smartphone className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Fotoğraftan Rapor</h2>
                <p className="text-muted-foreground">
                  Saha notlarının, faturaların veya el yazılarının fotoğrafını çekin. OCR teknolojimiz metni okusun ve raporlasın.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Mevzuat Uyumlu</h2>
                <p className="text-muted-foreground">
                  Özellikle İSG raporlarında ilgili yönetmelik maddelerini otomatik ekleyerek yasal uyumluluğunuzu artırın.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-auto">
        <p className="text-xs text-muted-foreground">© 2026 Rapor Asistanı. Tüm hakları saklıdır.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Kullanım Şartları
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Gizlilik
          </Link>
        </nav>
      </footer>
    </div>
  )
}
