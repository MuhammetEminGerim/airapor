'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  HardHat,
  Upload,
  Trash2,
  Plus,
  Save,
  FileText,
  Loader2,
  Building2,
  User,
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Snowflake,
  ShieldAlert,
  Download,
  Camera,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { generateISGReportPDF } from '@/lib/isg-pdf'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ISGFinding, ISGProjectInfo, ISGReportData, ISGRiskLevel, ISGSignatures } from '@/types/isg'
import { DEFAULT_ISG_DISCLAIMER } from '@/types/isg'
import Link from 'next/link'

const WEATHER_OPTIONS = [
  { label: 'Güneşli', icon: Sun },
  { label: 'Yağmurlu', icon: CloudRain },
  { label: 'Bulutlu', icon: Cloud },
  { label: 'Rüzgarlı', icon: Wind },
  { label: 'Karlı', icon: Snowflake },
]

export default function IsgDenetimPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('findings')
  const [collapsedFindings, setCollapsedFindings] = useState<Record<string, boolean>>({})

  const toggleFindingCollapse = (id: string) => {
    setCollapsedFindings((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Report metadata state
  const [reportNumber, setReportNumber] = useState('')
  const [projectName, setProjectName] = useState('')
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState('Güneşli')
  const [workerCount, setWorkerCount] = useState<number | string>('')
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0])
  const [inspectionTime, setInspectionTime] = useState('09:30 - 12:00')

  // Profile-based company & inspector info
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [osgbName, setOsgbName] = useState('')
  const [osgbLogoUrl, setOsgbLogoUrl] = useState('')
  const [inspectorName, setInspectorName] = useState('')
  const [inspectorTitle, setInspectorTitle] = useState('İş Güvenliği Uzmanı')
  const [inspectorCertificateNo, setInspectorCertificateNo] = useState('')

  // Signatures & Notes
  const [employerRepName, setEmployerRepName] = useState('Şantiye Yetkilisi')
  const [employerRepTitle, setEmployerRepTitle] = useState('Şantiye Şefi / Proje Müdürü')
  const [generalNotes, setGeneralNotes] = useState('')

  // Findings list and upload queue
  const [findings, setFindings] = useState<ISGFinding[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadQueueCount, setUploadQueueCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  // Initialize report number and fetch user profile
  useEffect(() => {
    const year = new Date().getFullYear()
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    setReportNumber(`RAPOR-${year}-${randomSuffix}`)

    async function loadUserProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Calculate next sequential report number for this user
        const { count } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (count !== null && count !== undefined) {
          const nextSeq = String(count + 1).padStart(3, '0')
          setReportNumber(`RAPOR-${year}-${nextSeq}`)
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_name, company_logo_url, osgb_name, osgb_logo_url, inspector_title, certificate_no')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.full_name) setInspectorName(profile.full_name)
          if (profile.company_name) setCompanyName(profile.company_name)
          if (profile.company_logo_url) setCompanyLogoUrl(profile.company_logo_url)
          if (profile.osgb_name) setOsgbName(profile.osgb_name)
          if (profile.osgb_logo_url) setOsgbLogoUrl(profile.osgb_logo_url)
          if (profile.inspector_title) setInspectorTitle(profile.inspector_title)
          if (profile.certificate_no) setInspectorCertificateNo(profile.certificate_no)
        }
      } catch (err) {
        console.error('Profil yüklenirken hata:', err)
      }
    }

    loadUserProfile()
  }, [])

  // Handle uploading and analyzing photos with Gemini Vision
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    setIsAnalyzing(true)
    setUploadQueueCount(fileList.length)

    toast.info(`${fileList.length} adet fotoğraf yüklendi, yapay zeka mevzuat analizi başlatılıyor...`)

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('projectContext', projectName || 'Genel İnşaat ve Sanayi Sahası')
      formData.append('location', location || 'Saha Genel')

      try {
        const res = await fetch('/api/isg/analyze-photo', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Fotoğraf analiz edilemedi.')
        }

        if (data.finding) {
          setFindings((prev) => [...prev, data.finding])
          toast.success(`Fotoğraf #${i + 1} analiz edildi: ${data.finding.riskLevel.toUpperCase()} RİSK`)
        }
      } catch (err) {
        toast.error(`Fotoğraf #${i + 1} analiz edilirken hata: ${(err as Error).message}`)
      } finally {
        setUploadQueueCount((prev) => Math.max(0, prev - 1))
      }
    }

    setIsAnalyzing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Add a manual finding without photo
  const handleAddManualFinding = () => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)
    const newFinding: ISGFinding = {
      id: `f-manual-${Date.now()}`,
      location: location || 'Saha Genel',
      description: '',
      regulationRef: '6331 Sayılı İSG Kanunu ve İlgili Yönetmelikler',
      riskLevel: 'medium',
      suggestedAction: '',
      responsible: 'Saha Şefi',
      deadline: deadline.toISOString().split('T')[0],
      status: 'open',
    }
    setFindings((prev) => [...prev, newFinding])
  }

  // Update a finding field
  const handleUpdateFinding = (
    id: string,
    field: keyof ISGFinding,
    value: string | ISGRiskLevel | 'open' | 'closed'
  ) => {
    setFindings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // Delete a finding
  const handleDeleteFinding = (id: string) => {
    setFindings((prev) => prev.filter((item) => item.id !== id))
    toast.success('Bulgu listeden kaldırıldı.')
  }

  // Summary counts
  const stats = useMemo(() => {
    const high = findings.filter((f) => f.riskLevel === 'high').length
    const medium = findings.filter((f) => f.riskLevel === 'medium').length
    const low = findings.filter((f) => f.riskLevel === 'low').length
    const open = findings.filter((f) => f.status === 'open').length
    const closed = findings.filter((f) => f.status === 'closed').length
    return { total: findings.length, high, medium, low, open, closed }
  }, [findings])

  // Build current report data object
  const buildCurrentReportData = (): ISGReportData => {
    const projectInfo: ISGProjectInfo = {
      projectName: projectName.trim() || 'İsimsiz Saha Denetimi',
      location: location.trim() || 'Belirtilmedi',
      inspectionDate: inspectionDate,
      inspectionTime: inspectionTime,
      weather: weather,
      workerCount: workerCount ? Number(workerCount) : '-',
      companyName: companyName || 'Firma Adı',
      companyLogoUrl: companyLogoUrl || undefined,
      osgbName: osgbName || 'OSGB Birimi',
      osgbLogoUrl: osgbLogoUrl || undefined,
      inspectorName: inspectorName || 'İş Güvenliği Uzmanı',
      inspectorTitle: inspectorTitle,
      inspectorCertificateNo: inspectorCertificateNo || undefined,
    }

    const signatures: ISGSignatures = {
      inspectorName: inspectorName || 'İSG Uzmanı',
      inspectorTitle: inspectorTitle,
      employerRepName: employerRepName || 'Şantiye Yetkilisi',
      employerRepTitle: employerRepTitle || 'Şantiye Şefi',
      disclaimer: DEFAULT_ISG_DISCLAIMER,
    }

    return {
      reportNumber: reportNumber,
      projectInfo,
      findings,
      signatures,
      generalNotes: generalNotes.trim() || undefined,
    }
  }

  // Generate & Download PDF on client
  const handleDownloadCurrentPDF = async () => {
    if (findings.length === 0) {
      toast.error('PDF oluşturmak için en az 1 bulgu veya fotoğraf eklemelisiniz.')
      return
    }

    setIsExportingPDF(true)
    const toastId = toast.loading('Resmi İSG Denetim Raporu PDF formatında hazırlanıyor...')

    try {
      const reportData = buildCurrentReportData()
      const doc = await generateISGReportPDF(reportData)
      const fileName = `${reportNumber || 'ISG-Rapor'}_${projectName.replace(/[^a-zA-Z0-9]/g, '_') || 'Denetim'}.pdf`
      doc.save(fileName)
      toast.success('Resmî PDF başarıyla indirildi.', { id: toastId })
    } catch (err) {
      console.error('PDF Generation Error:', err)
      toast.error('PDF oluşturulurken bir hata oluştu: ' + (err as Error).message, { id: toastId })
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Save report to Supabase
  const handleSaveReport = async () => {
    if (!projectName.trim()) {
      toast.error('Lütfen bir şantiye / proje adı girin.')
      setActiveTab('details')
      return
    }

    if (findings.length === 0) {
      toast.error('Kaydetmeden önce en az bir bulgu veya fotoğraf ekleyin.')
      setActiveTab('findings')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading('Saha denetim raporu kaydediliyor...')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Oturum açmanız gerekiyor.')
      }

      const reportData = buildCurrentReportData()

      // Generate a markdown overview for text search and fallback
      const findingsSummary = findings
        .map(
          (f, idx) =>
            `### Bulgu ${idx + 1}: ${f.location || 'Saha Genel'} [${f.riskLevel.toUpperCase()}]\n` +
            `* **Uygunsuzluk:** ${f.description}\n` +
            `* **Mevzuat:** ${f.regulationRef}\n` +
            `* **Aksiyon:** ${f.suggestedAction}\n` +
            `* **Sorumlu:** ${f.responsible} | **Termin:** ${f.deadline}\n`
        )
        .join('\n')

      const markdownContent = `# ${reportData.projectInfo.projectName} - Saha Denetim Raporu\n` +
        `**Rapor No:** ${reportData.reportNumber} | **Tarih:** ${reportData.projectInfo.inspectionDate}\n` +
        `**Denetçi:** ${reportData.projectInfo.inspectorName} (${reportData.projectInfo.inspectorTitle})\n\n` +
        `---\n\n## Bulgular ve Uygunsuzluklar\n\n${findingsSummary}\n\n` +
        `---\n\n## Genel Değerlendirme\n${generalNotes || 'Özel bir not belirtilmedi.'}`

      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: `${projectName} - Saha Denetimi`,
          type: 'isg',
          report_number: reportNumber,
          content: markdownContent,
          isg_data: reportData,
          status: 'completed',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Rapor başarıyla kaydedildi!', { id: toastId })
      router.push(`/dashboard/reports?highlight=${savedReport.id}`)
    } catch (err) {
      console.error('Save Error:', err)
      toast.error('Rapor kaydedilemedi: ' + (err as Error).message, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="field-page flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="field-page-kicker">RESMİ SAHA DENETİMİ</p>
            <Badge variant="secondary" className="font-mono text-[11px] font-semibold">
              {reportNumber}
            </Badge>
          </div>
          <h1 className="field-page-title text-2xl font-bold tracking-tight">Yeni Saha Raporu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saha fotoğraflarını yükleyin; Gemini Vision mevzuat ve risk analizini otomatik tamamlasın.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleDownloadCurrentPDF}
            disabled={isExportingPDF || isAnalyzing || findings.length === 0}
            className="font-medium text-xs sm:text-sm h-9 gap-1.5"
          >
            {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF İndir
          </Button>

          <Button
            onClick={handleSaveReport}
            disabled={isSaving || isAnalyzing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm h-9 gap-1.5 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Raporu Kaydet
          </Button>
        </div>
      </div>

      {/* Quick Project Summary Card */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-12 items-center">
            <div className="sm:col-span-6 space-y-1">
              <Label htmlFor="quickProjectName" className="text-xs font-semibold text-muted-foreground">
                Şantiye / Proje Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quickProjectName"
                placeholder="Örn: Bölen Otomotiv Yeni Depo İnşaatı"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="font-semibold text-sm h-9"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label htmlFor="quickLocation" className="text-xs font-semibold text-muted-foreground">
                Konum / İlçe
              </Label>
              <Input
                id="quickLocation"
                placeholder="Örn: Bolu / OSB"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-xs sm:text-sm h-9"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label htmlFor="quickDate" className="text-xs font-semibold text-muted-foreground">
                Denetim Tarihi
              </Label>
              <Input
                id="quickDate"
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="text-xs sm:text-sm h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Flow */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="findings" className="gap-2 font-semibold text-xs sm:text-sm">
            <Camera className="h-4 w-4" />
            <span>Bulgular</span>
            {findings.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                {findings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2 font-semibold text-xs sm:text-sm">
            <Building2 className="h-4 w-4" />
            <span>Şantiye Künyesi</span>
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-2 font-semibold text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span>İmza & Notlar</span>
          </TabsTrigger>
        </TabsList>

        {/* ---------------- TAB 1: BULGULAR & FOTOĞRAFLAR ---------------- */}
        <TabsContent value="findings" className="space-y-6 mt-0">
          {/* Upload Hero Area */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors rounded-2xl shadow-sm text-center p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center gap-3 max-w-lg mx-auto">
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
                {isAnalyzing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Camera className="h-7 w-7" />
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {isAnalyzing
                    ? `Yapay zeka analiz ediyor (${uploadQueueCount} fotoğraf kaldı)...`
                    : 'Saha Fotoğraflarını Ekleyin'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Fotoğrafları yükleyin; yapay zeka tehlikeleri, 6331 sayılı kanunu ve ilgili yönetmelikleri otomatik eşleştirsin.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  size="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs sm:text-sm gap-2 shadow-sm"
                  disabled={isAnalyzing}
                >
                  <Camera className="h-4 w-4" /> Kameradan Çek
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  size="default"
                  className="font-semibold text-xs sm:text-sm gap-2"
                  disabled={isAnalyzing}
                >
                  <Upload className="h-4 w-4" /> Fotoğraf Seç (Çoklu)
                </Button>
              </div>
            </div>
          </Card>

          {/* Findings Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-foreground">
                Saha Bulguları ({findings.length})
              </span>
              {findings.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {stats.high > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                      {stats.high} Yüksek Risk
                    </span>
                  )}
                  {stats.medium > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {stats.medium} Orta Risk
                    </span>
                  )}
                  {stats.low > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {stats.low} Düşük Risk
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {findings.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allCollapsed = Object.values(collapsedFindings).filter(Boolean).length === findings.length
                    const nextState: Record<string, boolean> = {}
                    findings.forEach((f) => {
                      nextState[f.id] = !allCollapsed
                    })
                    setCollapsedFindings(nextState)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  {Object.values(collapsedFindings).filter(Boolean).length === findings.length
                    ? 'Tümünü Aç'
                    : 'Tümünü Daralt'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddManualFinding}
                className="gap-1 font-semibold text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5" /> Manuel Bulgu Ekle
              </Button>
            </div>
          </div>

          {/* Findings List */}
          {findings.length === 0 ? (
            <Card className="border-dashed p-8 text-center rounded-xl bg-muted/10">
              <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                <HardHat className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground">Henüz denetim bulgusu yok</p>
                <p className="text-xs leading-relaxed">
                  Yukarıdaki kutudan fotoğraf çekip yükleyerek veya manuel bulgu ekleyerek başlayabilirsiniz.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {findings.map((item, index) => {
                const isCollapsed = Boolean(collapsedFindings[item.id])
                const riskColor =
                  item.riskLevel === 'high'
                    ? 'border-l-4 border-l-red-500 bg-red-500/[0.02]'
                    : item.riskLevel === 'medium'
                    ? 'border-l-4 border-l-amber-500 bg-amber-500/[0.02]'
                    : 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]'

                // COMPACT / COLLAPSED VIEW
                if (isCollapsed) {
                  return (
                    <Card key={item.id} className={`shadow-sm overflow-hidden transition-all ${riskColor} p-3.5`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-bold text-xs text-muted-foreground shrink-0">#{index + 1}</span>
                          {item.photoUrl ? (
                            <div className="h-11 w-11 rounded-md overflow-hidden border bg-black/5 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.photoUrl} alt="Bulgu" className="object-cover w-full h-full" />
                            </div>
                          ) : (
                            <div className="h-11 w-11 rounded-md border border-dashed flex items-center justify-center text-[10px] text-muted-foreground shrink-0 bg-muted/30">
                              <HardHat className="h-5 w-5 opacity-40" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold truncate text-foreground">
                                {item.location || 'Saha Genel'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  item.riskLevel === 'high'
                                    ? 'bg-red-500/10 text-red-600'
                                    : item.riskLevel === 'medium'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-emerald-500/10 text-emerald-600'
                                }`}
                              >
                                {item.riskLevel === 'high'
                                  ? 'YÜKSEK RİSK'
                                  : item.riskLevel === 'medium'
                                  ? 'ORTA RİSK'
                                  : 'DÜŞÜK RİSK'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {item.status === 'open' ? '• Açık DÖF' : '• Giderildi'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.description || 'Açıklama girilmedi...'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFindingCollapse(item.id)}
                            className="h-8 text-xs gap-1 font-semibold"
                          >
                            <ChevronDown className="h-3.5 w-3.5" /> Düzenle
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFinding(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                }

                // EXPANDED VIEW
                return (
                  <Card key={item.id} className={`shadow-sm overflow-hidden transition-all ${riskColor} rounded-xl border-border/70`}>
                    <CardHeader className="py-2.5 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-muted-foreground">#{index + 1}</span>
                        <Select
                          value={item.riskLevel}
                          onValueChange={(val: ISGRiskLevel) => handleUpdateFinding(item.id, 'riskLevel', val)}
                        >
                          <SelectTrigger className="h-7 text-xs w-[130px] font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🔴 Yüksek Risk</SelectItem>
                            <SelectItem value="medium">🟡 Orta Risk</SelectItem>
                            <SelectItem value="low">🟢 Düşük Risk</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={item.status}
                          onValueChange={(val: 'open' | 'closed') => handleUpdateFinding(item.id, 'status', val)}
                        >
                          <SelectTrigger className="h-7 text-xs w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Açık DÖF</SelectItem>
                            <SelectItem value="closed">Giderildi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFindingCollapse(item.id)}
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground font-medium"
                        >
                          <ChevronUp className="h-3.5 w-3.5" /> Daralt
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFinding(item.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 grid gap-4 md:grid-cols-4">
                      {/* Photo preview */}
                      <div className="md:col-span-1">
                        {item.photoUrl ? (
                          <div className="rounded-lg overflow-hidden border bg-black/5 relative aspect-video md:aspect-square flex items-center justify-center shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.photoUrl}
                              alt="Bulgu Fotoğrafı"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed aspect-video md:aspect-square flex flex-col items-center justify-center text-xs text-muted-foreground p-3 text-center bg-muted/20">
                            <HardHat className="h-6 w-6 mb-1 opacity-40" />
                            Fotoğraf Yok
                          </div>
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="md:col-span-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Şantiye İçi Konum</Label>
                            <Input
                              placeholder="Örn: A Blok 3. Kat / Asansör Boşluğu"
                              value={item.location || ''}
                              onChange={(e) => handleUpdateFinding(item.id, 'location', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Mevzuat Referansı</Label>
                            <Input
                              placeholder="Örn: Yapı İşlerinde İSG Yönetmeliği Ek-4 Md. 12"
                              value={item.regulationRef}
                              onChange={(e) => handleUpdateFinding(item.id, 'regulationRef', e.target.value)}
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Tespit Edilen Uygunsuzluk</Label>
                          <Textarea
                            placeholder="Tehlikenin net açıklaması..."
                            value={item.description}
                            onChange={(e) => handleUpdateFinding(item.id, 'description', e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Alınması Gereken Önlem / Aksiyon</Label>
                          <Textarea
                            placeholder="Yapılması gereken teknik tedbir..."
                            value={item.suggestedAction}
                            onChange={(e) => handleUpdateFinding(item.id, 'suggestedAction', e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Sorumlu Birim / Kişi</Label>
                            <Input
                              placeholder="Örn: Kalıp Taşeronu / Saha Şefi"
                              value={item.responsible}
                              onChange={(e) => handleUpdateFinding(item.id, 'responsible', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Termin Tarihi</Label>
                            <Input
                              type="date"
                              value={item.deadline}
                              onChange={(e) => handleUpdateFinding(item.id, 'deadline', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Quick tab switch footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-xs text-muted-foreground">
              Tüm bulguları tamamladıktan sonra künye ve imza alanlarını kontrol edebilirsiniz.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('details')}
              className="text-xs font-medium"
            >
              Şantiye Künyesi →
            </Button>
          </div>
        </TabsContent>

        {/* ---------------- TAB 2: ŞANTİYE & KÜNYE DETAYLARI ---------------- */}
        <TabsContent value="details" className="space-y-6 mt-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Şantiye ve Denetim Parametreleri
              </CardTitle>
              <CardDescription>Resmi rapor başlığında ve denetim künyesinde yer alacak detaylar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="projectNameFull">Şantiye / Proje Adı <span className="text-red-500">*</span></Label>
                  <Input
                    id="projectNameFull"
                    placeholder="Örn: Bölen Otomotiv Yeni Depo İnşaatı"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="locationFull">Saha Konumu / İlçe - İl</Label>
                  <Input
                    id="locationFull"
                    placeholder="Örn: Bolu Merkez / Organize Sanayi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dateFull">Denetim Tarihi</Label>
                  <Input
                    id="dateFull"
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Hava Durumu</Label>
                  <Select value={weather} onValueChange={setWeather}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.label} value={opt.label}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4 text-primary" />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="workerCountFull">Çalışan Sayısı</Label>
                  <Input
                    id="workerCountFull"
                    type="number"
                    placeholder="Örn: 45"
                    value={workerCount}
                    onChange={(e) => setWorkerCount(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inspectionTimeFull">Saat Aralığı</Label>
                  <Input
                    id="inspectionTimeFull"
                    placeholder="09:30 - 12:00"
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t text-xs text-muted-foreground flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Kayıtlı Denetçi: <strong>{inspectorName || 'Belirtilmedi'}</strong> ({inspectorTitle})</span>
                </div>
                <Link href="/dashboard/settings" className="text-primary hover:underline font-semibold inline-flex items-center gap-1">
                  Logo ve Firma Bilgilerini Ayarla <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('findings')}
              className="text-xs font-medium"
            >
              ← Bulgulara Dön
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('signatures')}
              className="text-xs font-medium"
            >
              İmza ve Notlara İlerle →
            </Button>
          </div>
        </TabsContent>

        {/* ---------------- TAB 3: İMZA & DEĞERLENDİRME ---------------- */}
        <TabsContent value="signatures" className="space-y-6 mt-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resmi Rapor İmzacıları & Genel Değerlendirme
              </CardTitle>
              <CardDescription>PDF çıktısının altında yer alacak tebellüğ ve onay bilgileri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 border p-4 rounded-xl bg-muted/10">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Tespit Eden (İSG Uzmanı)
                  </span>
                  <div className="space-y-1">
                    <Label className="text-xs">Adı Soyadı</Label>
                    <Input
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      placeholder="İSG Uzmanı Adı"
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unvanı</Label>
                    <Input
                      value={inspectorTitle}
                      onChange={(e) => setInspectorTitle(e.target.value)}
                      placeholder="A Sınıfı İSG Uzmanı"
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 border p-4 rounded-xl bg-muted/10">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Tebellüğ Eden (Şantiye Yetkilisi)
                  </span>
                  <div className="space-y-1">
                    <Label className="text-xs">Yetkili Adı Soyadı</Label>
                    <Input
                      value={employerRepName}
                      onChange={(e) => setEmployerRepName(e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Yetkili Unvanı</Label>
                    <Input
                      value={employerRepTitle}
                      onChange={(e) => setEmployerRepTitle(e.target.value)}
                      placeholder="Örn: Şantiye Şefi / Proje Müdürü"
                      className="h-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="generalNotesFull" className="text-xs font-semibold">
                  Genel Denetim Değerlendirme Notu (Opsiyonel)
                </Label>
                <Textarea
                  id="generalNotesFull"
                  placeholder="Sahadaki genel İSG durumuna ilişkin ilave değerlendirme ve tavsiyeler..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 text-[11px] text-muted-foreground leading-relaxed border">
                <strong>Yasal Bildirim:</strong> {DEFAULT_ISG_DISCLAIMER}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('details')}
              className="text-xs font-medium w-full sm:w-auto"
            >
              ← Şantiye Künyesine Dön
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                onClick={handleDownloadCurrentPDF}
                disabled={isExportingPDF || isAnalyzing || findings.length === 0}
                className="font-medium text-xs sm:text-sm h-10 gap-1.5"
              >
                {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF İndir
              </Button>
              <Button
                onClick={handleSaveReport}
                disabled={isSaving || isAnalyzing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs sm:text-sm h-10 px-6 gap-2 shadow-sm"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Raporu Kaydet ve Bitir
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
