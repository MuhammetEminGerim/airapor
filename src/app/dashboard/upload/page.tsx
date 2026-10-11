'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2,
  Wand2,
  Upload,
  Copy,
  Download,
  Check,
  Save,
  Mic,
  StopCircle,
  FileText,
  Sparkles,
  Circle,
  CheckCircle2,
  Lightbulb,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import jsPDF from 'jspdf'
import { getReadableErrorMessage } from '@/lib/user-feedback'
import { StatusBanner } from '@/components/features/status-banner'
import { createDevTimer } from '@/lib/dev-timing'

interface Template {
  id: string
  name: string
  icon: string
}

type BannerState = {
  state: 'loading' | 'success' | 'error' | 'info'
  title: string
  message?: string
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const MIN_INPUT_LENGTH = 20
const ONBOARDING_KEY = 'ra:onboarding:upload:v1'
const TEMPLATE_LOADING_DELAY_MS = 600
const TEMPLATE_LOADING_TITLE = 'Sablonlar yukleniyor'

export default function UploadPage() {
  const [input, setInput] = useState('')
  const [reportType, setReportType] = useState('isg')
  const [templates, setTemplates] = useState<Template[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploadLoading, setIsUploadLoading] = useState(false)
  const [result, setResult] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const trimmedInput = input.trim()
  const canGenerate = trimmedInput.length >= MIN_INPUT_LENGTH && !isGenerating && !isUploadLoading
  const isBusy = isGenerating || isUploadLoading || isSaving

  const onboardingSteps = useMemo(
    () => [
      { label: 'Veri girisi yapin (yazi / dosya / ses)', done: trimmedInput.length > 0 },
      { label: 'Raporu olusturun', done: result.trim().length > 0 },
      { label: 'Raporu kaydedin', done: isSaved },
    ],
    [trimmedInput.length, result, isSaved]
  )

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' ? window.localStorage.getItem(ONBOARDING_KEY) === 'dismissed' : true
    setShowOnboarding(!dismissed)
  }, [])

  useEffect(() => {
    const timer = createDevTimer('dashboard-upload')
    let hasEnded = false
    let isMounted = true
    const finishTimer = () => {
      if (hasEnded) return
      hasEnded = true
      timer.end()
    }
    const loadingBannerTimer = setTimeout(() => {
      if (!isMounted) return
      setBanner({
        state: 'loading',
        title: TEMPLATE_LOADING_TITLE,
        message: 'Asistan listesi getiriliyor.',
      })
    }, TEMPLATE_LOADING_DELAY_MS)

    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates')
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Sablonlar getirilemedi.')

        clearTimeout(loadingBannerTimer)
        if (!isMounted) return
        setTemplates(data.templates || [])
        setBanner((current) => {
          if (current?.state === 'loading' && current.title === TEMPLATE_LOADING_TITLE) {
            return null
          }
          return current
        })
        timer.mark('templates-ready', { count: data.templates?.length ?? 0 })
      } catch (error) {
        clearTimeout(loadingBannerTimer)
        if (!isMounted) return
        const message = getReadableErrorMessage(error, 'Sablonlar getirilemedi.')
        setBanner({ state: 'error', title: 'Sablonlar yuklenemedi', message })
        timer.mark('templates-error')
      } finally {
        finishTimer()
      }
    }

    fetchTemplates()

    return () => {
      isMounted = false
      clearTimeout(loadingBannerTimer)
      finishTimer()
    }
  }, [])

  const dismissOnboarding = () => {
    setShowOnboarding(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_KEY, 'dismissed')
    }
  }

  const appendToInput = (label: string, text: string) => {
    setInput((prev) => (prev ? `${prev}\n\n---\n${label}:\n${text}` : `${label}:\n${text}`))
  }

  const insertSampleInput = () => {
    const sample = [
      'Saha Denetim Notları (3. Kat Kalıp & İskele):',
      '- Cephe iskelesinde çalışan personelin paraşüt tipi emniyet kemerleri yaşam hattına bağlı değil.',
      '- Merdiven kova boşluklarında 1 metre yüksekliğinde standart korkuluk ve topukluk eksik.',
      '- Elektrik panosu önünde yalıtkan paspas bulunmuyor ve kaçak akım rölesi test etiketi yok.',
      '- Zemin kat malzeme alanında yanıcı tiner bidonları ile açık elektrik kabloları yan yana depolanmış.',
    ].join('\n')

    setInput(sample)
    setBanner({
      state: 'info',
      title: 'Örnek İSG saha notları eklendi',
      message: 'Hızlı deneme için rapor oluştur butonuna basabilirsiniz.',
    })
  }

  const handleSave = async () => {
    if (!result.trim()) {
      setBanner({
        state: 'error',
        title: 'Kaydetme islemi basarisiz',
        message: 'Once bir rapor olusturun veya cikti ekleyin.',
      })
      return
    }

    setIsSaving(true)
    setBanner({
      state: 'loading',
      title: 'Rapor kaydediliyor',
      message: 'Veriler hesabiniza ekleniyor.',
    })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Oturum acmaniz gerekiyor.')

      const { error } = await supabase.from('reports').insert({
        user_id: user.id,
        title: `Rapor - ${new Date().toLocaleDateString('tr-TR')}`,
        type: reportType,
        content: result,
        input_text: input,
      })

      if (error) throw error

      setIsSaved(true)
      setBanner({
        state: 'success',
        title: 'Rapor kaydedildi',
        message: 'Raporlarim ekranindan duzenleyebilir veya paylasabilirsiniz.',
      })
      toast.success('Rapor basariyla kaydedildi.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Rapor kaydedilemedi.')
      setBanner({ state: 'error', title: 'Kaydetme islemi basarisiz', message })
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const startRecording = async () => {
    try {
      setBanner({
        state: 'info',
        title: 'Ses kaydi basladi',
        message: 'Kaydi durdurdugunuzda ses metne donusturulecek.',
      })

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processUpload(audioBlob, 'voice-note.webm')
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Mikrofon erisimi saglanamadi.')
      setBanner({ state: 'error', title: 'Ses kaydi baslatilamadi', message })
      toast.error(message)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return

    mediaRecorderRef.current.stop()
    setIsRecording(false)
    setBanner({
      state: 'loading',
      title: 'Ses kaydi isleniyor',
      message: 'Kayit metne donusturuluyor.',
    })
  }

  const processUpload = async (file: Blob | File, fileName?: string) => {
    setIsUploadLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file, fileName)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Dosya islenemedi.')

      const fileType = 'type' in file ? file.type : ''
      const isAudio = fileType.startsWith('audio/')
      const isPdf = fileType === 'application/pdf'
      const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      const label = isAudio
        ? '[SES DOSYASI COZUMLEMESI]'
        : isPdf
          ? '[PDF ICERIGI]'
          : isDocx
            ? '[WORD ICERIGI]'
            : '[GORSELDEN CIKARILAN METIN]'

      appendToInput(label, data.text)
      setBanner({
        state: 'success',
        title: 'Dosya islendi',
        message: 'Cikarilan metin giris alanina eklendi.',
      })
      toast.success('Dosya basariyla islendi.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Dosya isleme basarisiz.')
      setBanner({ state: 'error', title: 'Dosya islenemedi', message })
      toast.error(message)
    } finally {
      setIsUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!canGenerate) {
      setBanner({
        state: 'error',
        title: 'Rapor olusturulamadi',
        message: `Rapor uretmek icin en az ${MIN_INPUT_LENGTH} karakter icerik girin.`,
      })
      return
    }

    setIsGenerating(true)
    setIsSaved(false)
    setBanner({
      state: 'loading',
      title: 'Rapor olusturuluyor',
      message: 'Yapay zeka icerigi analiz ediyor.',
    })

    try {
      const isStandard = ['genel', 'isg', 'risk', 'ramak_kala', 'finans'].includes(reportType)
      const body = isStandard ? { text: trimmedInput, reportType } : { text: trimmedInput, templateId: reportType }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Rapor olusturulamadi.')

      setResult(String(data.result || ''))
      setIsSaved(false)
      setBanner({
        state: 'success',
        title: 'Rapor hazir',
        message: 'Ciktiyi duzenleyip kaydedebilirsiniz.',
      })
      toast.success('Rapor olusturuldu.')
    } catch (error) {
      const message = getReadableErrorMessage(error, 'Rapor olusturulamadi.')
      setBanner({ state: 'error', title: 'Rapor olusturulamadi', message })
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isSupportedType =
      file.type.startsWith('image/') ||
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!isSupportedType) {
      setBanner({
        state: 'error',
        title: 'Desteklenmeyen dosya tipi',
        message: 'Sadece gorsel, ses, PDF ve DOCX yukleyebilirsiniz.',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setBanner({
        state: 'error',
        title: 'Dosya boyutu cok buyuk',
        message: 'Maksimum dosya boyutu 15MB olmalidir.',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setBanner({
      state: 'loading',
      title: 'Dosya isleniyor',
      message: 'Icerik metne donusturuluyor.',
    })
    await processUpload(file)
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setIsCopied(true)
    toast.success('Rapor panoya kopyalandi.')
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

  const handleDownloadPDF = async () => {
    if (!result) return
    const doc = new jsPDF()

    try {
      const fontUrl = '/fonts/Roboto-Regular.ttf'
      const response = await fetch(fontUrl)
      const blob = await response.blob()
      const reader = new FileReader()
      await new Promise((resolve, reject) => {
        reader.onload = resolve
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      if (reader.result && typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1]
        doc.addFileToVFS('Roboto-Regular.ttf', base64)
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
        doc.setFont('Roboto')
      }
    } catch (error) {
      const message = getReadableErrorMessage(error, 'PDF fontu yuklenemedi, varsayilan font kullanilacak.')
      toast.error(message)
    }

    const title = `Rapor - ${new Date().toLocaleDateString('tr-TR')}`
    doc.setFontSize(16)
    doc.text(title, 10, 10)

    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(result, 190)

    let y = 30
    const pageHeight = doc.internal.pageSize.height
    const lineHeight = 7

    if (Array.isArray(splitText)) {
      splitText.forEach((line: string) => {
        if (y + lineHeight > pageHeight - 10) {
          doc.addPage()
          y = 20
        }
        doc.text(line, 10, y)
        y += lineHeight
      })
    } else {
      doc.text(splitText, 10, 30)
    }

    doc.save(`${title}.pdf`)
    toast.success('PDF olarak indirildi.')
  }

  return (
    <div className="field-page field-report-composer grid gap-6 lg:grid-cols-2 h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-6 h-full">
        <div className="field-page-heading">
          <p className="field-page-kicker">HIZLI NOT / RAPOR OLUŞTURUCU</p>
          <h1 className="field-page-title">Yeni rapor</h1>
          <p className="text-sm text-muted-foreground mt-1">Metin yazin, dosya yukleyin veya ses kaydi alin.</p>
        </div>

        {showOnboarding ? (
          <Card className="border-field-gold/50 bg-field-yellow/15">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-field-gold" />
                <span className="text-sm font-semibold">Ilk rapor rehberi</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dismissOnboarding}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {onboardingSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-2 text-sm">
                  {step.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={insertSampleInput}>
                Ornek not ekle
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {banner ? <StatusBanner state={banner.state} title={banner.title} message={banner.message} /> : null}

        <Card className="flex-1 flex flex-col shadow-sm border-border/50">
          <div className="flex flex-wrap items-center gap-2 border-b p-2">
            <Button variant="secondary" size="sm" className="gap-2">
              <FileText className="h-4 w-4" /> Yazi / Not
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="gap-2"
            >
              {isUploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dosya Yukle
            </Button>

            <Button
              variant={isRecording ? 'destructive' : 'ghost'}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isBusy}
              className={`gap-2 ${isRecording ? 'animate-pulse' : ''}`}
            >
              {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Kaydi Durdur' : 'Ses Kaydet'}
            </Button>
          </div>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0 relative">
            {isUploadLoading ? (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="font-medium">Dosya isleniyor</p>
                <p className="text-sm text-muted-foreground">Bu islem dosya boyutuna gore birkac saniye surebilir.</p>
              </div>
            ) : null}

            <input
              type="file"
              accept="image/*,audio/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <Textarea
              placeholder="Saha denetim notlarınızı yazın veya üstteki butonları kullanarak ses kaydı / fotoğraf / dosya ekleyin..."
              className="flex-1 resize-none border-0 focus-visible:ring-0 p-4 text-base font-mono bg-transparent rounded-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="p-4 border-t bg-muted/20 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Minimum {MIN_INPUT_LENGTH} karakter onerilir.</span>
                <span>{trimmedInput.length} karakter</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1">
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Rapor Turu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>İSG Rapor Türleri</SelectLabel>
                        <SelectItem value="isg">İSG Saha Denetim Raporu (6331)</SelectItem>
                        <SelectItem value="risk">Risk Değerlendirme & Analiz</SelectItem>
                        <SelectItem value="ramak_kala">Ramak Kala & Olay Bildirimi</SelectItem>
                        <SelectItem value="genel">Genel İSG Değerlendirmesi</SelectItem>
                      </SelectGroup>
                      {templates.length > 0 ? (
                        <SelectGroup>
                          <SelectLabel>Asistanlarim</SelectLabel>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{t.icon}</span>
                                <div className="flex flex-col">
                                  <span className="font-medium">{t.name}</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-yellow-500" /> Ozel Asistan
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerate} disabled={!canGenerate} className="sm:w-auto w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Olusturuluyor...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Rapor Olustur
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="field-composer-preview flex flex-col gap-6 h-full">
        <div className="field-page-heading lg:invisible">
          <p className="field-page-kicker">BELGE ÖNİZLEMESİ</p>
          <h1 className="field-page-title">Rapor çıktısı</h1>
          <p className="text-sm text-muted-foreground mt-1">Hazır rapor içeriği.</p>
        </div>

        <Card className="flex-1 flex flex-col bg-muted/30 border-border/50 shadow-sm overflow-hidden h-full">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Rapor Onizleme</span>
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
            <div className="flex flex-wrap gap-1">
              {result ? (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} title="Kopyala">
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadPDF} title="PDF Indir">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} title="TXT Indir">
                    <Download className="h-4 w-4" />
                  </Button>
                  {!isSaved ? (
                    <Button size="sm" variant="default" onClick={handleSave} disabled={isSaving} className="h-8 ml-1 gap-2">
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Kaydet
                    </Button>
                  ) : null}
                </>
              ) : null}
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
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-4 text-center px-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground/80">Rapor bekleniyor</p>
                  <p className="text-sm">Sol taraftan icerik ekleyip analiz baslatin.</p>
                  {trimmedInput.length === 0 ? (
                    <Button variant="link" size="sm" onClick={insertSampleInput}>
                      Ornek icerik ekle
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

