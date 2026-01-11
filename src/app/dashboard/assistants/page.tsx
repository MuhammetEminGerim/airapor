'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot, Trash2, Loader2, Sparkles, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Template {
  id: string
  name: string
  icon: string
  system_prompt: string
  created_at: string
}

export default function AssistantsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [icon, setIcon] = useState('🤖')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTemplates(data.templates || [])
    } catch (error) {
      console.error(error)
      toast.error('Asistanlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name || !prompt) {
        toast.error('Lütfen isim ve talimat alanlarını doldurun')
        return
    }

    setCreating(true)
    try {
        const res = await fetch('/api/templates', {
            method: 'POST',
            body: JSON.stringify({ name, system_prompt: prompt, icon })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setTemplates([data.template, ...templates])
        setOpen(false)
        resetForm()
        toast.success('Yeni asistan oluşturuldu!')
    } catch (error) {
        toast.error('Oluşturma hatası: ' + (error as Error).message)
    } finally {
        setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu asistanı silmek istediğinize emin misiniz?')) return

    try {
        const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setTemplates(templates.filter(t => t.id !== id))
        toast.success('Asistan silindi')
    } catch (error) {
        toast.error('Silme hatası: ' + (error as Error).message)
    }
  }

  const resetForm = () => {
    setName('')
    setPrompt('')
    setIcon('🤖')
  }

  const recommendedPrompts = {
    business: [
        {
            title: "Toplantı Özeti",
            icon: "📝",
            prompt: "Sen profesyonel bir toplantı asistanısın. Gönderilen dağınık toplantı notlarını veya deşifre metnini analiz et. Şu başlıklar altında yapılandırılmış bir tutanak oluştur: 1) Toplantı Künyesi (Tarih, Katılımcılar), 2) Gündem Maddeleri, 3) Alınan Kararlar, 4) Aksiyon Planı (Kim, Ne Zaman, Ne Yapacak)."
        },
        {
            title: "Sözleşme Analisti",
            icon: "⚖️",
            prompt: "Sen kıdemli bir hukuk danışmanısın. Sana verilen sözleşme metnini incele. Taraflar için kritik riskleri, fesih şartlarını, cezai yükümlülükleri ve belirsiz maddeleri sade bir dille özetle. Dikkat edilmesi gereken noktaları 'Kırmızı Bayrak' olarak işaretle."
        },
        {
            title: "Proje Yöneticisi (SWOT)",
            icon: "📊",
            prompt: "Sen stratejik düşünen bir proje yöneticisisin. Verilen proje fikrini veya iş planını analiz et. Detaylı bir SWOT analizi (Güçlü Yönler, Zayıf Yönler, Fırsatlar, Tehditler) yap. Projenin başarısı için kritik başarı faktörlerini listele."
        }
    ],
    education: [
        {
            title: "Sınav Okuyucu",
            icon: "💯",
            prompt: "Sen adil ve titiz bir öğretmensin. Sana verilen öğrenci cevabını, sorulan soru bağlamında değerlendir. Doğruları ve yanlışları belirt. 100 üzerinden tahmini bir puan ver ve öğrencinin kendini geliştirmesi için yapıcı geri bildirimlerde bulun."
        },
        {
            title: "Makale Özetleyici (ELI5)",
            icon: "🧠",
            prompt: "Sen karmaşık konuları basitleştirmede uzman bir bilim iletişimcisisin. Sana verilen akademik makaleyi veya teknik yazıyı, 15 yaşındaki bir öğrencinin anlayabileceği sadelikte özetle. Ana fikri, metodolojiyi ve sonuçları madde madde açıkla. Jargon kullanma."
        }
    ],
    creative: [
        {
            title: "Sosyal Medya Uzmanı",
            icon: "🚀",
            prompt: "Sen viral içerik üretme konusunda uzman bir sosyal medya yöneticisisin. Verilen konuyu baz alarak 3 farklı platform için içerik üret: 1) LinkedIn (Profesyonel ve öğretici), 2) Twitter/X (Kısa, vurucu, flood şeklinde), 3) Instagram (Görsel betimlemesi ve samimi caption). Hashtag önerileri ekle."
        },
        {
            title: "SEO Uzmanı",
            icon: "🔎",
            prompt: "Sen kıdemli bir SEO uzmanısın. Gönderilen içeriği anahtar kelime yoğunluğu, okunabilirlik ve SEO uyumluluğu açısından analiz et. Başlık etiketlerini (H1, H2) kontrol et. Hataları ve sıralama artırıcı iyileştirme önerilerini listele."
        },
        {
            title: "Kod Denetçisi",
            icon: "💻",
            prompt: "Sen uzman bir yazılım mimarısın. Sana verilen kodu güvenlik, performans ve 'clean code' prensipleri açısından incele. Olası bugları, güvenlik açıklarını tespit et. Kodu daha verimli ve okunabilir hale getirmek için refactoring önerileri sun."
        },
        {
            title: "E-Posta Yazarı",
            icon: "✉️",
            prompt: "Sen kurumsal iletişim uzmanısın. Verilen kaba notları veya maddeleri, son derece profesyonel, nazik, ikna edici ve amaca yönelik bir iş e-postasına dönüştür. Konu satırı önerileri de sun."
        }
    ]
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Asistanlarım</h1>
          <p className="text-sm text-muted-foreground mt-1">Kendi özel raporlama asistanlarınızı oluşturun ve yönetin.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Yeni Asistan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Yeni Asistan Oluştur</DialogTitle>
                    <DialogDescription>
                        Yapay zekaya yeni bir rol verin. Ona nasıl davranması gerektiğini öğretin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 grid gap-2">
                            <Label htmlFor="name">Asistan Adı</Label>
                            <Input
                                id="name"
                                placeholder="Örn: Emlak Danışmanı"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 grid gap-2">
                            <Label htmlFor="icon">İkon</Label>
                            <Input
                                id="icon"
                                className="text-center text-lg"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                maxLength={2}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="prompt">Sistem Talimatı (Prompt)</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Sen bir emlak uzmanısın. Sana gönderilen ev özelliklerini inceleyip..."
                            className="h-32 font-mono text-sm"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            İpucu: AI'ya kim olduğunu, amacını ve çıktı formatını net bir şekilde anlatın.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label>Hızlı Başlangıç Şablonları</Label>
                        <Tabs defaultValue="business" className="w-full">
                            <TabsList className="w-full h-auto grid grid-cols-1 sm:grid-cols-3 mb-4 gap-2 bg-transparent p-0">
                                <TabsTrigger value="business" className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">İş & Kurumsal</TabsTrigger>
                                <TabsTrigger value="education" className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Eğitim & Akademik</TabsTrigger>
                                <TabsTrigger value="creative" className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Teknik & Kreatif</TabsTrigger>
                            </TabsList>

                            {Object.entries(recommendedPrompts).map(([key, items]) => (
                                <TabsContent key={key} value={key} className="mt-0">
                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                        {items.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/80 hover:border-primary/30 cursor-pointer transition-all group"
                                                onClick={() => {
                                                    setName(item.title)
                                                    setPrompt(item.prompt)
                                                    setIcon(item.icon)
                                                }}
                                            >
                                                <div className="text-2xl bg-background p-2 rounded-md shadow-sm group-hover:scale-110 transition-transform">
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm flex items-center justify-between">
                                                        {item.title}
                                                        <Badge variant="secondary" className="text-[10px] h-5 opacity-0 group-hover:opacity-100 transition-opacity">Seç</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {item.prompt}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleCreate} disabled={creating}>
                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Oluştur
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-xl bg-muted/20">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Henüz asistanınız yok</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
                İlk özel asistanınızı oluşturarak standart raporların ötesine geçin.
            </p>
            <Button variant="link" onClick={() => setOpen(true)} className="mt-4">
                Hemen bir tane oluştur
            </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
                <Card key={template.id} className="group relative transition-all hover:shadow-md border-border/50">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                                {template.icon}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(template.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardTitle className="mt-4">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted/50 p-3 rounded-md text-xs font-mono text-muted-foreground h-24 overflow-hidden relative">
                            {template.system_prompt}
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-muted/50 to-transparent" />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
                            Özel Asistan
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  )
}
