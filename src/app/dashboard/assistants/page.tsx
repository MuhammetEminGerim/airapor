'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Bot, Trash2, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { StatusBanner } from '@/components/features/status-banner'
import { getReadableErrorMessage } from '@/lib/user-feedback'
import { createDevTimer } from '@/lib/dev-timing'

interface Template {
  id: string
  name: string
  icon: string
  system_prompt: string
  created_at: string
}

type BannerState = {
  state: 'loading' | 'success' | 'error' | 'info'
  title: string
  message?: string
}

const INITIAL_LOADING_DELAY_MS = 600
const INITIAL_LOADING_TITLE = 'Asistanlar yukleniyor'

const QUICK_PROMPTS = {
  field: [
    {
      title: 'Toolbox İSG Konuşması',
      icon: '👷',
      prompt:
        'Kıdemli İSG Uzmanı gibi davran. Günlük iş öncesi 5-10 dakikalık Toolbox (İSG bilgilendirme) konuşma metni hazırla. Tehlikeler, KKD gereksinimleri, güvenli çalışma adımları ve çalışanların dikkat etmesi gereken kritik noktaları madde madde yaz.',
    },
    {
      title: 'Saha Denetim Kontrol Listesi',
      icon: '📋',
      prompt:
        'Yapı işleri İSG baş denetçisi gibi davran. 6331 sayılı Kanun ve Yapı İşlerinde İSG Yönetmeliği kapsamında şantiye/fabrika için kontrol listesi ve risk değerlendirme maddeleri oluştur.',
    },
    {
      title: 'İskele Güvenlik Denetimi',
      icon: '🏗️',
      prompt:
        'İskele yetkin denetçisi gibi davran. Cephe iskelelerinin kurulumu, ankraj aralıkları, korkuluklar, topukluklar, platform kilitleri ve yeşil etiket onay kriterlerini listeleyen teknik denetim formu hazırla.',
    },
  ],
  risk: [
    {
      title: 'Ramak Kala & Olay Analizi',
      icon: '⚠️',
      prompt:
        'İSG kaza önleme uzmanı gibi davran. Bildirilen ramak kala olayını analiz et; olası risk derecesini, potansiyel sonuçlarını, kök nedenlerini ve tekrarlanmaması için acil DÖF aksiyonlarını listele.',
    },
    {
      title: 'Kaza Kök Neden Analizi (5 Neden)',
      icon: '🔍',
      prompt:
        'İSG kaza araştırma uzmanı gibi davran. Meydana gelen iş kazası/olayı için 5 Neden (5 Why) ve Balık Kılçığı metodolojisiyle kök nedenleri ve Düzeltici Önleyici Faaliyet (DÖF) planını çıkar.',
    },
    {
      title: '5x5 Risk Matrisi Değerlendirmesi',
      icon: '📊',
      prompt:
        'İSG risk analisti gibi davran. Verilen çalışma ortamı için tehlikeleri belirle, Olasılık x Şiddet (1-5) matrisiyle risk skorlarını hesapla ve kabul edilebilir seviyeye indirme tedbirlerini listele.',
    },
  ],
  training: [
    {
      title: 'Acil Durum Tatbikat Senaryosu',
      icon: '🚨',
      prompt:
        'Acil durum kriz yöneticisi gibi davran. Yangın, deprem veya kimyasal sızıntı için tatbikat senaryosu, söndürme/kurtarma/koruma/ilkyardım ekiplerinin görevleri ve tahliye süre değerlendirme formu hazırla.',
    },
    {
      title: 'KKD Seçim ve Kullanım Rehberi',
      icon: '🦺',
      prompt:
        'İSG teknik uzmanı gibi davran. İlgili iş kolu ve fiziksel/kimyasal maruziyetler için CE ve EN standartlarına uygun Kişisel Koruyucu Donanım (KKD) teknik şartnamesi ve çalışan talimatı oluştur.',
    },
    {
      title: 'Sıcak Çalışma İzin Prosedürü',
      icon: '🔥',
      prompt:
        'İSG saha emniyet uzmanı gibi davran. Kaynak, kesme ve kıvılcım çıkaran sıcak işler için yangın gözlemcisi, gaz ölçümü, yangın tüpü konuşlandırması ve çalışma izni formu adımlarını hazırla.',
    },
  ],
}

export default function AssistantsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [banner, setBanner] = useState<BannerState | null>(null)

  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [icon, setIcon] = useState('🤖')

  const normalizedName = name.trim()
  const normalizedPrompt = prompt.trim()
  const normalizedIcon = icon.trim()

  const nameError = useMemo(() => {
    if (!normalizedName) return 'Asistan adı zorunludur.'
    if (normalizedName.length < 3) return 'Asistan adı en az 3 karakter olmalıdır.'
    return ''
  }, [normalizedName])

  const promptError = useMemo(() => {
    if (!normalizedPrompt) return 'Sistem talimatı zorunludur.'
    if (normalizedPrompt.length < 40) return 'Daha iyi sonuç için en az 40 karakterlik talimat yazın.'
    return ''
  }, [normalizedPrompt])

  const iconError = normalizedIcon.length === 0 ? 'Bir ikon girin.' : ''
  const canCreate = !creating && !nameError && !promptError && !iconError

  useEffect(() => {
    const timer = createDevTimer('dashboard-assistants')
    let isMounted = true
    const loadingBannerTimer = setTimeout(() => {
      if (!isMounted) return
      setBanner({
        state: 'loading',
        title: INITIAL_LOADING_TITLE,
        message: 'Kayitli sablonlar getiriliyor.',
      })
    }, INITIAL_LOADING_DELAY_MS)

    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates')
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Asistanlar yuklenemedi.')

        clearTimeout(loadingBannerTimer)
        if (!isMounted) return
        setTemplates(data.templates || [])
        setBanner((current) => {
          if (current?.state === 'loading' && current.title === INITIAL_LOADING_TITLE) {
            return null
          }
          return current
        })
        timer.mark('templates-ready', { count: data.templates?.length ?? 0 })
      } catch (error) {
        clearTimeout(loadingBannerTimer)
        if (!isMounted) return
        const message = getReadableErrorMessage(error, 'Asistanlar yuklenemedi.')
        setBanner({ state: 'error', title: 'Asistanlar yuklenemedi', message })
        toast.error(message)
        timer.mark('templates-error')
      } finally {
        if (!isMounted) return
        setLoading(false)
        timer.end()
      }
    }

    fetchTemplates()

    return () => {
      isMounted = false
      clearTimeout(loadingBannerTimer)
    }
  }, [])

  const handleCreate = async () => {
    if (!canCreate) {
      setBanner({
        state: 'error',
        title: 'Asistan oluşturulamadı',
        message: nameError || promptError || iconError,
      })
      return
    }

    setCreating(true)
    setBanner({
      state: 'loading',
      title: 'Asistan oluşturuluyor',
      message: 'Talimatlar kaydediliyor.',
    })

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          system_prompt: normalizedPrompt,
          icon: normalizedIcon,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Asistan oluşturulamadı.')

      setTemplates((prev) => [data.template, ...prev])
      setOpen(false)
      resetForm()
      setBanner({
        state: 'success',
        title: 'Asistan oluşturuldu',
        message: 'Yeni asistanınız rapor ekranında seçilebilir.',
      })
      toast.success('Yeni asistan oluşturuldu.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Asistan oluşturulamadı.')
      setBanner({ state: 'error', title: 'Asistan oluşturulamadı', message })
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu asistanı silmek istediğinize emin misiniz?')) return

    setDeletingId(id)
    setBanner({
      state: 'loading',
      title: 'Asistan siliniyor',
      message: 'Seçili asistan kaldırılıyor.',
    })

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Asistan silinemedi.')

      setTemplates((prev) => prev.filter((t) => t.id !== id))
      setBanner({
        state: 'success',
        title: 'Asistan silindi',
        message: 'Liste güncellendi.',
      })
      toast.success('Asistan silindi.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Asistan silinemedi.')
      setBanner({ state: 'error', title: 'Asistan silinemedi', message })
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setName('')
    setPrompt('')
    setIcon('🤖')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
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
              <DialogDescription>Yapay zekaya yeni bir rol tanımlayın.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 grid gap-2">
                  <Label htmlFor="name">Asistan Adı</Label>
                  <Input
                    id="name"
                    placeholder="Örn: İskele Güvenlik Denetçisi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                  />
                  {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
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
                  {iconError ? <p className="text-xs text-red-600">{iconError}</p> : null}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prompt">Sistem Talimatı</Label>
                <Textarea
                  id="prompt"
                  placeholder="Asistanın rolünü, hedefini ve beklenen çıktı formatını yazın..."
                  className="h-32 font-mono text-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={3000}
                />
                {promptError ? <p className="text-xs text-red-600">{promptError}</p> : null}
                <p className="text-xs text-muted-foreground text-right">{normalizedPrompt.length}/3000</p>
              </div>

              <div className="space-y-3">
                <Label>Hızlı Başlangıç Şablonları</Label>
                <Tabs defaultValue="field" className="w-full">
                  <TabsList className="w-full h-auto grid grid-cols-1 sm:grid-cols-3 mb-4 gap-2 bg-transparent p-0">
                    <TabsTrigger value="field" className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">
                      Saha Denetimi
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">
                      Risk & Olay Analizi
                    </TabsTrigger>
                    <TabsTrigger value="training" className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">
                      Eğitim & Prosedür
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries(QUICK_PROMPTS).map(([key, items]) => (
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
                                <Badge variant="secondary" className="text-[10px] h-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Seç
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.prompt}</p>
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
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreate} disabled={!canCreate}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {banner ? <StatusBanner state={banner.state} title={banner.title} message={banner.message} /> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-44 rounded-xl border bg-muted/40 animate-pulse" />
          ))}
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
            Hemen oluştur
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
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

