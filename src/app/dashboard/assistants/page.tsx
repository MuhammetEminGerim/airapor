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

  const recommendedPrompts = [
    {
        title: "SEO Uzmanı",
        prompt: "Sen kıdemli bir SEO uzmanısın. Gönderilen içeriği anahtar kelime yoğunluğu, okunabilirlik ve SEO uyumluluğu açısından analiz et. Hataları ve iyileştirme önerilerini listele."
    },
    {
        title: "Kod Denetçisi",
        prompt: "Sen uzman bir yazılım mimarısın. Sana verilen kodu güvenlik, performans ve 'clean code' prensipleri açısından incele. Puanla ve refactoring önerileri sun."
    },
    {
        title: "E-Posta Yazarı",
        prompt: "Sen kurumsal iletişim uzmanısın. Verilen kaba notları veya maddeleri, son derece profesyonel, nazik ve ikna edici bir iş e-postasına dönüştür."
    }
  ]

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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Yeni Asistan Oluştur</DialogTitle>
                    <DialogDescription>
                        Yapay zekaya yeni bir rol verin. Ona nasıl davranması gerektiğini öğretin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Asistan Adı</Label>
                        <Input
                            id="name"
                            placeholder="Örn: Emlak Danışmanı"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="icon">İkon (Emoji)</Label>
                        <Input
                            id="icon"
                            className="w-16 text-center text-lg"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            maxLength={2}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="prompt">Sistem Talimatı (Prompt)</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Sen bir emlak uzmanısın. Sana gönderilen ev özelliklerini inceleyip..."
                            className="h-32"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            İpucu: AI'ya kim olduğunu, amacını ve çıktı formatını net bir şekilde anlatın.
                        </p>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-md border border-dashed">
                        <span className="text-xs font-medium text-muted-foreground mb-2 block">Hızlı Başlangıç Örnekleri:</span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {recommendedPrompts.map((item, i) => (
                                <Badge
                                    key={i}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-muted whitespace-nowrap"
                                    onClick={() => {
                                        setName(item.title)
                                        setPrompt(item.prompt)
                                    }}
                                >
                                    {item.title}
                                </Badge>
                            ))}
                        </div>
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
