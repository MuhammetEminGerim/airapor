'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Wand2, ImagePlus, Upload, Copy, Download, Check, Save, Mic, Square, StopCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function UploadPage() {
  const [input, setInput] = useState('')
  const [reportType, setReportType] = useState('genel')
  const [isLoading, setIsLoading] = useState(false)
  const [isOcrLoading, setIsOcrLoading] = useState(false)
  const [result, setResult] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, reportType }),
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
      <Card className="flex flex-col h-full">
        <CardHeader>
            <CardTitle>Yeni Rapor Oluştur</CardTitle>
            <CardDescription>Notlarınızı yazın veya belge fotoğrafı yükleyin.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex gap-2">
                <input
                    type="file"
                    accept="image/*,audio/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOcrLoading || isLoading || isRecording}
                    className="w-full sm:w-auto"
                >
                    {isOcrLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    {isOcrLoading ? 'İşleniyor...' : 'Dosya Yükle (Resim/Ses/PDF/Docx)'}
                </Button>

                <Button
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isOcrLoading || isLoading}
                    className="w-full sm:w-auto min-w-[140px]"
                >
                    {isRecording ? (
                        <>
                           <StopCircle className="mr-2 h-4 w-4 animate-pulse" /> Kaydı Bitir
                        </>
                    ) : (
                        <>
                           <Mic className="mr-2 h-4 w-4" /> Ses Kaydet
                        </>
                    )}
                </Button>
            </div>

            <Textarea
                placeholder="Örn: Bugünkü toplantıda alınan kararlar şunlar..."
                className="flex-1 resize-none p-4 text-base font-mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />

            <div className="flex gap-4">
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Rapor Türü" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="genel">Genel Rapor</SelectItem>
                        <SelectItem value="isg">İş Güvenliği (İSG)</SelectItem>
                        <SelectItem value="finans">Finansal Analiz</SelectItem>
                    </SelectContent>
                </Select>

                <Button onClick={handleGenerate} disabled={isLoading || !input} className="flex-1">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            AI Rapor Hazırlıyor...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Rapor Oluştur
                        </>
                    )}
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Output Area */}
      <Card className="flex flex-col h-full bg-muted/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-6 min-h-[4rem]">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    AI Rapor Çıktısı
                    {isSaved && <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Kaydedildi</span>}
                </CardTitle>
                <CardDescription>Oluşturulan rapor burada görünecek.</CardDescription>
            </div>
            {result && (
                <div className="flex gap-2">
                    {!isSaved && (
                        <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="h-8">
                            {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                            Kaydet
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleCopy} title="Kopyala">
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleDownload} title="İndir">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto min-h-0 p-6 pt-0">
            {result ? (
                <Textarea
                    className="w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 p-0 text-base leading-relaxed font-mono bg-transparent"
                    value={result}
                    onChange={(e) => {
                        setResult(e.target.value)
                        setIsSaved(false)
                    }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <Wand2 className="h-12 w-12 mb-4" />
                    <p>Henüz bir rapor oluşturulmadı.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
