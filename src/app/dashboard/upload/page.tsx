'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Loader2, Wand2, Upload, Copy, Download, Check, Save, Mic, StopCircle, FileText, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Template {
  id: string
  name: string
  icon: string
}

export default function UploadPage() {
  const [input, setInput] = useState('')
  const [reportType, setReportType] = useState('genel')
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOcrLoading, setIsOcrLoading] = useState(false)
  const [result, setResult] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'upload'>('write')

  useEffect(() => {
    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates')
            const data = await res.json()
            if (data.templates) {
                setTemplates(data.templates)
            }
        } catch (error) {
            console.error('Error fetching templates:', error)
        }
    }
    fetchTemplates()
  }, [])

  const handleSave = async () => {
    if (!result) return
    setIsSaving(true)
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error('Oturum açmanız gerekiyor.')
            return
        }

        const { error } = await supabase.from('reports').insert({
            user_id: user.id,
            title: `Rapor - ${new Date().toLocaleDateString('tr-TR')}`,
            type: reportType,
            content: result,
            input_text: input
        })

        if (error) throw error

        setIsSaved(true)
        toast.success('Rapor başarıyla kaydedildi.')
    } catch (error) {
        console.error(error)
        toast.error('Kaydetme hatası: ' + (error as Error).message)
    } finally {
        setIsSaving(false)
    }
  }
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await handleAudioUpload(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
        console.error('Mikrofon hatası:', error)
        toast.error('Mikrofon izni verilmedi veya bir hata oluştu.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
    }
  }

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsOcrLoading(true)
    const formData = new FormData()
    formData.append('file', audioBlob, 'voice-note.webm')

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setInput(prev => (prev ? prev + '\n\n---\n' : '') + `[SES KAYDI ÖZETİ]:\n${data.text}`)
        toast.success('Ses kaydı başarıyla işlendi.')
    } catch (error) {
        console.error(error)
        toast.error('Ses işlenirken hata oluştu: ' + (error as Error).message)
    } finally {
        setIsOcrLoading(false)
    }
  }

    const handleGenerate = async () => {
    if (!input) return
    setIsLoading(true)
    setIsSaved(false)
    try {
      const isStandard = ['genel', 'isg', 'finans'].includes(reportType)
      const body = isStandard
        ? { text: input, reportType }
        : { text: input, templateId: reportType }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const generatedResult = data.result
      setResult(generatedResult)
      setIsSaved(false)
      toast.success('Rapor oluşturuldu. Düzenleyip kaydedebilirsiniz.')

    } catch (error) {
      console.error(error)
      toast.error('Hata oluştu: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsOcrLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    const isAudio = file.type.startsWith('audio/')
    const isPdf = file.type === 'application/pdf'
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    let label = '[RESİMDEN OKUNAN VERİ]'
    if (isAudio) label = '[SES DOSYASI ÇÖZÜMLEMESİ]'
    else if (isPdf) label = '[PDF İÇERİĞİ]'
    else if (isDocx) label = '[WORD İÇERİĞİ]'

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        // Append text to existing input
        setInput(prev => (prev ? prev + '\n\n---\n' : '') + `${label}:\n${data.text}`)
        toast.success('Dosya başarıyla okundu.')
    } catch (error) {
        console.error(error)
        toast.error('Dosya okunurken hata oluştu: ' + (error as Error).message)
    } finally {
        setIsOcrLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setIsCopied(true)
    toast.success('Kopyalandı!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapor-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-8rem)]">
      {/* Input Area */}
      <div className="flex flex-col gap-6 h-full">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Yeni Rapor</h1>
            <p className="text-sm text-muted-foreground mt-1">Verilerinizi yükleyin, AI sizin için raporlasın.</p>
        </div>

        <Card className="flex-1 flex flex-col shadow-sm border-border/50">
            <div className="flex items-center border-b p-2">
                <Button
                    variant={activeTab === 'write' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('write')}
                    className="gap-2"
                >
                    <FileText className="h-4 w-4" /> Yazı & Not
                </Button>
                <div className="w-px h-4 bg-border mx-2" />
                <Button
                    variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => {
                        setActiveTab('upload')
                        fileInputRef.current?.click()
                    }}
                    disabled={isOcrLoading}
                    className="gap-2"
                >
                    {isOcrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Dosya Yükle
                </Button>
                <Button
                    variant={isRecording ? "destructive" : "ghost"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isOcrLoading}
                    className={`gap-2 ml-2 ${isRecording ? 'animate-pulse' : ''}`}
                >
                    {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Kaydediyor...' : 'Ses Kaydet'}
                </Button>
            </div>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0 relative">
                {isOcrLoading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="font-medium">Dosya işleniyor...</p>
                        <p className="text-sm text-muted-foreground">Yapay zeka içeriği metne dönüştürüyor.</p>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*,audio/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />

                <Textarea
                    placeholder="Buraya notlarınızı yazın, yapıştırın veya yukarıdaki butonlarla dosya yükleyin..."
                    className="flex-1 resize-none border-0 focus-visible:ring-0 p-4 text-base font-mono bg-transparent rounded-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Rapor Türü" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Standart Raporlar</SelectLabel>
                                        <SelectItem value="genel">
                                            <div className="flex flex-col">
                                                <span className="font-medium">Genel Rapor</span>
                                                <span className="text-xs text-muted-foreground">Standart iş raporu formatı</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="isg">
                                            <div className="flex flex-col">
                                                <span className="font-medium">İş Güvenliği (İSG)</span>
                                                <span className="text-xs text-muted-foreground">Yönetmelik referanslı denetim</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="finans">
                                            <div className="flex flex-col">
                                                <span className="font-medium">Finansal Analiz</span>
                                                <span className="text-xs text-muted-foreground">Bütçe ve harcama analizi</span>
                                            </div>
                                        </SelectItem>
                                    </SelectGroup>
                                    {templates.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Asistanlarım</SelectLabel>
                                            {templates.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{t.icon}</span>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{t.name}</span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3 text-yellow-500" /> Özel Asistan
                                                            </span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading || !input}
                            className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    AI Analiz Ediyor...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Rapor Oluştur
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Output Area */}
      <div className="flex flex-col gap-6 h-full">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 lg:invisible">Sonuç</h1>
            <p className="text-sm text-muted-foreground mt-1 lg:invisible">Hazır olan raporunuz.</p>
        </div>

        <Card className="flex-1 flex flex-col bg-muted/30 border-border/50 shadow-sm overflow-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-background">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Rapor Önizleme</span>
                    {isSaved ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                            <Check className="w-3 h-3 mr-1" /> Kaydedildi
                        </Badge>
                    ) : result ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                            Kaydedilmedi
                        </Badge>
                    ) : null}
                </div>
                <div className="flex gap-1">
                    {result && (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} title="Kopyala">
                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} title="İndir">
                                <Download className="h-4 w-4" />
                            </Button>
                            {!isSaved && (
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-8 ml-2 gap-2"
                                >
                                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Kaydet
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0 relative bg-background">
                {result ? (
                    <Textarea
                        className="w-full h-full resize-none border-0 focus-visible:ring-0 p-6 text-sm leading-relaxed font-mono bg-transparent"
                        value={result}
                        onChange={(e) => {
                            setResult(e.target.value)
                            setIsSaved(false)
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                            <FileText className="h-8 w-8" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-medium text-foreground/80">Rapor bekleniyor</p>
                            <p className="text-sm">Sol taraftan veri girişi yaparak analizi başlatın.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
