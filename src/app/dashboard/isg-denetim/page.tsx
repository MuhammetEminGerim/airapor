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
  ArrowLeft,
  Download,
  Camera,
  ChevronDown,
  ChevronUp,
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

  // Update a single finding field
  const handleUpdateFinding = (id: string, field: keyof ISGFinding, value: unknown) => {
    setFindings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // Delete a finding
  const handleDeleteFinding = (id: string) => {
    setFindings((prev) => prev.filter((item) => item.id !== id))
    toast.info('Bulgu listeden kaldırıldı.')
  }

  // Risk statistics
  const stats = useMemo(() => {
    const high = findings.filter((f) => f.riskLevel === 'high').length
    const medium = findings.filter((f) => f.riskLevel === 'medium').length
    const low = findings.filter((f) => f.riskLevel === 'low').length
    const open = findings.filter((f) => f.status === 'open').length
    const closed = findings.filter((f) => f.status === 'closed').length
    return { high, medium, low, open, closed, total: findings.length }
  }, [findings])

  // Download current report directly as official PDF
  const handleDownloadCurrentPDF = async () => {
    if (findings.length === 0) {
      toast.error('PDF oluşturmak için en az bir adet denetim bulgusu ekleyin.')
      return
    }

    setIsExportingPDF(true)
    toast.loading('Kurumsal İSG PDF raporu hazırlanıyor...', { id: 'isg-pdf-download' })

    try {
      const projectInfo: ISGProjectInfo = {
        projectName: projectName.trim() || 'Taslak Saha Raporu',
        companyName: companyName.trim() || 'Firma Adı Belirtilmedi',
        companyLogoUrl: companyLogoUrl || undefined,
        osgbName: osgbName.trim() || undefined,
        osgbLogoUrl: osgbLogoUrl || undefined,
        location: location.trim() || 'Merkez Sahası',
        weather,
        workerCount: workerCount || '-',
        inspectionDate,
        inspectionTime,
        inspectorName: inspectorName.trim() || 'İSG Uzmanı',
        inspectorTitle: inspectorTitle.trim() || 'İş Güvenliği Uzmanı',
        inspectorCertificateNo: inspectorCertificateNo.trim() || undefined,
      }

      const signatures: ISGSignatures = {
        inspectorName: projectInfo.inspectorName,
        inspectorTitle: projectInfo.inspectorTitle,
        employerRepName: employerRepName.trim() || 'İşveren Yetkilisi',
        employerRepTitle: employerRepTitle.trim() || 'Şantiye Şefi',
        disclaimer: DEFAULT_ISG_DISCLAIMER,
      }

      const isgData: ISGReportData = {
        reportNumber: reportNumber.trim() || `RAPOR-${Date.now()}`,
        projectInfo,
        findings,
        signatures,
        generalNotes: generalNotes.trim() || undefined,
      }

      const isgDoc = await generateISGReportPDF(isgData)
      isgDoc.save(`${projectInfo.projectName}_Saha_Denetim_Raporu.pdf`)
      toast.success('Resmi İSG Denetim Raporu PDF olarak indirildi.', { id: 'isg-pdf-download' })
    } catch (err) {
      toast.error('PDF oluşturulurken hata: ' + (err as Error).message, { id: 'isg-pdf-download' })
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Save report to Supabase
  const handleSaveReport = async () => {
    if (!projectName.trim()) {
      toast.error('Lütfen Şantiye / Proje Adı alanını doldurun.')
      return
    }

    if (findings.length === 0) {
      toast.error('Lütfen en az bir adet denetim bulgusu veya fotoğrafı ekleyin.')
      return
    }

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Raporu kaydetmek için oturum açmalısınız.')
        return
      }

      const projectInfo: ISGProjectInfo = {
        projectName: projectName.trim(),
        companyName: companyName.trim() || 'Firma Adı Belirtilmedi',
        companyLogoUrl: companyLogoUrl || undefined,
        osgbName: osgbName.trim() || undefined,
        osgbLogoUrl: osgbLogoUrl || undefined,
        location: location.trim() || 'Merkez Sahası',
        weather,
        workerCount: workerCount || '-',
        inspectionDate,
        inspectionTime,
        inspectorName: inspectorName.trim() || user.email?.split('@')[0] || 'İSG Uzmanı',
        inspectorTitle: inspectorTitle.trim() || 'İş Güvenliği Uzmanı',
        inspectorCertificateNo: inspectorCertificateNo.trim() || undefined,
      }

      const signatures: ISGSignatures = {
        inspectorName: projectInfo.inspectorName,
        inspectorTitle: projectInfo.inspectorTitle,
        employerRepName: employerRepName.trim() || 'İşveren Yetkilisi',
        employerRepTitle: employerRepTitle.trim() || 'Şantiye Şefi',
        disclaimer: DEFAULT_ISG_DISCLAIMER,
      }

      const isgData: ISGReportData = {
        reportNumber: reportNumber.trim() || `RAPOR-${Date.now()}`,
        projectInfo,
        findings,
        signatures,
        generalNotes: generalNotes.trim() || undefined,
      }

      // Generate text markdown summary for backward compatibility
      const markdownSummary = `# SAHA GÖZETİM VE DENETİM RAPORU (${isgData.reportNumber})
**Proje/Şantiye:** ${projectInfo.projectName}
**Tarih:** ${projectInfo.inspectionDate} | **Saat:** ${projectInfo.inspectionTime}
**Hava Durumu:** ${projectInfo.weather} | **Çalışan Sayısı:** ${projectInfo.workerCount}
**Denetimi Yapan:** ${projectInfo.inspectorName} (${projectInfo.inspectorTitle})

---

## TESPİT EDİLEN UYGUNSUZLUKLAR VE BULGULAR (${findings.length} Adet)

${findings
  .map(
    (f, idx) => `### ${idx + 1}. ${f.location || 'Saha'} - [${f.riskLevel.toUpperCase()} RİSK]
- **Tespit:** ${f.description}
- **Mevzuat:** ${f.regulationRef}
- **Önerilen Aksiyon:** ${f.suggestedAction}
- **Sorumlu:** ${f.responsible} | **Termin:** ${f.deadline} | **Durum:** ${f.status === 'open' ? 'Açık' : 'Kapatıldı'}`
  )
  .join('\n\n')}

---
**Yasal Uyarı:** ${signatures.disclaimer}
`

      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: `${projectInfo.projectName} Saha Denetim Raporu`,
          type: 'isg',
          content: markdownSummary,
          report_number: isgData.reportNumber,
          isg_data: isgData,
        })
        .select('id')
        .single()

      if (error) throw error

      toast.success('İSG Saha Denetim Raporu başarıyla kaydedildi!')
      router.push(`/dashboard/reports?highlight=${savedReport?.id || ''}`)
    } catch (err) {
      console.error('Rapor kaydetme hatası:', err)
      toast.error('Rapor kaydedilirken hata oluştu: ' + (err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="field-page field-inspection-page flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Header bar */}
      <div className="field-page-heading flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="field-page-kicker">SAHA DENETİMİ / YENİ DOSYA</p>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Panel
            </Link>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">
              <HardHat className="h-3 w-3 mr-1" /> Saha Gözetim Denetimi
            </Badge>
          </div>
          <h1 className="field-page-title text-3xl font-extrabold tracking-tight">
            Saha Denetim Raporu Oluşturucu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saha fotoğraflarını yükleyin; Gemini Vision mevzuat ve risk analizini otomatik tamamlasın.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownloadCurrentPDF}
            disabled={isExportingPDF || isAnalyzing || findings.length === 0}
            className="border-primary/40 hover:bg-primary/10 text-primary font-semibold"
          >
            {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            PDF İndir
          </Button>

          <Button
            size="lg"
            onClick={handleSaveReport}
            disabled={isSaving || isAnalyzing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-none font-semibold"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Raporu Kaydet
          </Button>
        </div>
      </div>

      <nav className="inspection-step-nav" aria-label="Denetim bölümleri">
        <a href="#inspection-project"><span>01</span><strong>Proje künyesi</strong></a>
        <a href="#inspection-findings"><span>02</span><strong>Bulgular</strong></a>
        <a href="#inspection-approval"><span>03</span><strong>Değerlendirme ve imza</strong></a>
      </nav>

      {/* Grid: Left metadata, Right action stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Metadata Section */}
        <Card id="inspection-project" className="lg:col-span-2 border-border/60 shadow-sm scroll-mt-24">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Building2 className="h-5 w-5 text-amber-600" />
                <span>1. Şantiye & Denetim Parametreleri</span>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {reportNumber}
              </Badge>
            </div>
            <CardDescription>Resmi rapor başlığında ve denetim künyesinde yer alacak bilgiler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectName">Şantiye / Proje Adı <span className="text-red-500">*</span></Label>
                <Input
                  id="projectName"
                  placeholder="Örn: Bölen Otomotiv Yeni Depo İnşaatı"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Saha Konumu / İlçe - İl</Label>
                <Input
                  id="location"
                  placeholder="Örn: Bolu Merkez / Organize Sanayi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="inspectionDate">Denetim Tarihi</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hava Durumu</Label>
                <Select value={weather} onValueChange={setWeather}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.label} value={opt.label}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4 text-amber-600" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workerCount">Sahadaki Çalışan Sayısı</Label>
                <Input
                  id="workerCount"
                  type="number"
                  placeholder="Örn: 45"
                  value={workerCount}
                  onChange={(e) => setWorkerCount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspectionTime">Denetim Saati Aralığı</Label>
                <Input
                  id="inspectionTime"
                  placeholder="09:30 - 12:00"
                  value={inspectionTime}
                  onChange={(e) => setInspectionTime(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Denetçi: <strong>{inspectorName || 'Belirtilmedi'}</strong> ({inspectorTitle})</span>
              </div>
              <Link href="/dashboard/settings" className="text-amber-600 hover:underline font-medium">
                Logo ve Uzman Bilgilerini Düzenle →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats & Upload Box */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Denetim Özeti</span>
                <Badge variant="outline">{stats.total} Bulgu</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.high}</div>
                  <div className="text-[11px] text-red-600/80 font-medium">Yüksek Risk</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-900/50">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.medium}</div>
                  <div className="text-[11px] text-amber-600/80 font-medium">Orta Risk</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.low}</div>
                  <div className="text-[11px] text-emerald-600/80 font-medium">Düşük Risk</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-1 flex justify-between">
                <span>Açık Uygunsuzluk: <strong>{stats.open}</strong></span>
                <span>Giderilen: <strong>{stats.closed}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Upload trigger */}
          <Card className="border-dashed border-2 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-center p-5 rounded-xl shadow-sm">
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
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center border border-amber-500/20">
                {isAnalyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </div>
              <div className="font-bold text-sm text-foreground">
                {isAnalyzing ? `Yapay zeka analiz ediyor (${uploadQueueCount} kaldı)...` : 'Saha Fotoğraflarını Ekle'}
              </div>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Kameradan anlık çekin veya galeriden çoklu fotoğraf yükleyin. Gemini Vision mevzuatı otomatik eşleştirir.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                  disabled={isAnalyzing}
                >
                  <Camera className="h-3.5 w-3.5" /> Kamerayı Aç
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  className="font-semibold text-xs gap-1.5"
                  disabled={isAnalyzing}
                >
                  <Upload className="h-3.5 w-3.5" /> Çoklu Seç
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Findings Section */}
      <div id="inspection-findings" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <h2 className="text-xl font-bold tracking-tight">2. Tespitler ve Bulgular ({findings.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            {findings.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allCollapsed = Object.values(collapsedFindings).filter(Boolean).length === findings.length
                  const nextState: Record<string, boolean> = {}
                  findings.forEach((f) => { nextState[f.id] = !allCollapsed })
                  setCollapsedFindings(nextState)
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                {Object.values(collapsedFindings).filter(Boolean).length === findings.length ? 'Tümünü Aç' : 'Tümünü Daralt'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleAddManualFinding} className="gap-1 font-semibold text-xs h-8">
              <Plus className="h-4 w-4" /> Manuel Bulgu Ekle
            </Button>
          </div>
        </div>

        {findings.length === 0 ? (
          <Card className="border-dashed p-12 text-center rounded-xl">
            <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <HardHat className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold">Henüz denetim bulgusu eklenmedi</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Saha fotoğraflarını yukarıdaki alana yükleyerek veya manuel ekle butonuna tıklayarak ilk tespiti oluşturun.
              </p>
              <div className="flex gap-2 mt-2">
                <Button onClick={() => cameraInputRef.current?.click()} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5">
                  <Camera className="h-4 w-4" /> Kamerayı Aç
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="font-semibold text-xs gap-1.5">
                  <Upload className="h-4 w-4" /> Dosya Seç
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {findings.map((item, index) => {
              const isCollapsed = Boolean(collapsedFindings[item.id])
              const riskColor =
                item.riskLevel === 'high'
                  ? 'border-l-4 border-l-red-500 bg-red-500/[0.03]'
                  : item.riskLevel === 'medium'
                  ? 'border-l-4 border-l-amber-500 bg-amber-500/[0.03]'
                  : 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.03]'

              // COMPACT / COLLAPSED VIEW
              if (isCollapsed) {
                return (
                  <Card key={item.id} className={`shadow-sm overflow-hidden transition-all ${riskColor} p-3.5`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-bold text-xs text-muted-foreground shrink-0">#{index + 1}</span>
                        {item.photoUrl ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden border bg-black/5 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.photoUrl} alt="Bulgu" className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md border border-dashed flex items-center justify-center text-[10px] text-muted-foreground shrink-0 bg-muted/30">
                            <HardHat className="h-4 w-4 opacity-40" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold truncate text-foreground">
                              {item.location || 'Saha Genel'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.riskLevel === 'high'
                                ? 'bg-red-500/10 text-red-600'
                                : item.riskLevel === 'medium'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                              {item.riskLevel === 'high' ? 'YÜKSEK RİSK' : item.riskLevel === 'medium' ? 'ORTA RİSK' : 'DÜŞÜK RİSK'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.status === 'open' ? '• Açık' : '• Giderildi'}
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
                <Card key={item.id} className={`shadow-sm overflow-hidden transition-all ${riskColor} rounded-xl`}>
                  <CardHeader className="py-2.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-muted-foreground">#{index + 1}</span>
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
                          <SelectItem value="open">Açık</SelectItem>
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
                          <Label className="text-xs">Yasal Mevzuat Referansı</Label>
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
                          placeholder="Tehlikenin ve uygunsuzluğun detaylı açıklaması..."
                          value={item.description}
                          onChange={(e) => handleUpdateFinding(item.id, 'description', e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Alınması Gereken Önlem / Aksiyon</Label>
                        <Textarea
                          placeholder="Yapılması gereken düzeltici/önleyici faaliyet..."
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

      </div>

      {/* Section 3: Signatures and General Notes */}
      <Card id="inspection-approval" className="border-border/60 shadow-sm scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-field-gold" />
            <span>3. İmza Blokları & Genel Değerlendirme</span>
          </CardTitle>
          <CardDescription>Resmi raporun alt kısmında (Footer) yer alacak imza sahipleri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 border p-3 rounded-lg bg-card/40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tespit Eden</span>
              <div className="space-y-1">
                <Label className="text-xs">İSG Uzmanı Adı Soyadı</Label>
                <Input
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="İSG Uzmanı Adı"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unvanı</Label>
                <Input
                  value={inspectorTitle}
                  onChange={(e) => setInspectorTitle(e.target.value)}
                  placeholder="A Sınıfı İSG Uzmanı"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 border p-3 rounded-lg bg-card/40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tebellüğ Eden (Teslim Alan)</span>
              <div className="space-y-1">
                <Label className="text-xs">İşveren / Şantiye Yetkilisi Adı</Label>
                <Input
                  value={employerRepName}
                  onChange={(e) => setEmployerRepName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Yetkili Unvanı</Label>
                <Input
                  value={employerRepTitle}
                  onChange={(e) => setEmployerRepTitle(e.target.value)}
                  placeholder="Örn: Şantiye Şefi / Proje Müdürü"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="generalNotes">Genel Denetim Sonuç Notu (Opsiyonel)</Label>
            <Textarea
              id="generalNotes"
              placeholder="Sahadaki genel İSG durumuna ilişkin ilave değerlendirme ve tavsiyeler..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/40 text-[11px] text-muted-foreground leading-relaxed border">
            <strong>Yasal Bildirim:</strong> {DEFAULT_ISG_DISCLAIMER}
          </div>
        </CardContent>
      </Card>

      {/* Floating or bottom save bar */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard">Vazgeç</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleDownloadCurrentPDF}
          disabled={isExportingPDF || isAnalyzing || findings.length === 0}
          className="border-amber-500/40 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold"
        >
          {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          PDF İndir
        </Button>
        <Button
          size="lg"
          onClick={handleSaveReport}
          disabled={isSaving || isAnalyzing}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg px-8"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Raporu Kaydet ve Bitir
        </Button>
      </div>
    </div>
  )
}
