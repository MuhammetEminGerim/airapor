'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  MoreHorizontal,
  Download,
  Eye,
  Loader2,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  Filter,
  Calendar,
  Share2,
  Globe,
  Link as LinkIcon,
  Lock,
  Copy,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  Clock,
  Building2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import Link from 'next/link'
import { createDevTimer } from '@/lib/dev-timing'
import { generateISGReportPDF } from '@/lib/isg-pdf'
import type { ISGReportData } from '@/types/isg'

type Report = {
  id: string
  title: string
  type: string
  created_at: string
  status: string
  content: string
  input_text?: string
  is_public?: boolean
  share_token?: string
  share_expires_at?: string | null
  report_number?: string
  isg_data?: ISGReportData | null
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewReport, setViewReport] = useState<Report | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [shareReport, setShareReport] = useState<Report | null>(null)
  const [isShareLoading, setIsShareLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState<'all' | 'high_risk' | 'open_dof' | 'isg'>('all')

  const stats = useMemo(() => {
    const highRisk = reports.filter((r) => r.isg_data?.findings?.some((f) => f.riskLevel === 'high')).length
    const openDof = reports.filter((r) => r.isg_data?.findings?.some((f) => f.status === 'open')).length
    const isg = reports.filter((r) => r.type === 'isg').length
    return { highRisk, openDof, isg }
  }, [reports])

  const fetchReports = async () => {
    const timer = createDevTimer('dashboard-reports')
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      timer.mark('auth-ready', { hasUser: Boolean(user) })

      if (user) {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Raporlar yuklenirken hata olustu.')
        } else {
          setReports(data || [])
        }
        timer.mark('reports-ready', { count: data?.length ?? 0, hasError: Boolean(error) })
      }
    } finally {
      setIsLoading(false)
      timer.end()
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim()
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(normalizedSearch) ||
        (report.isg_data?.projectInfo?.projectName?.toLowerCase().includes(normalizedSearch) ?? false) ||
        (report.isg_data?.projectInfo?.companyName?.toLowerCase().includes(normalizedSearch) ?? false)
      const matchesType = typeFilter === 'all' || report.type === typeFilter

      let matchesQuick = true
      if (quickFilter === 'high_risk') {
        matchesQuick = Boolean(report.isg_data?.findings?.some((f) => f.riskLevel === 'high'))
      } else if (quickFilter === 'open_dof') {
        matchesQuick = Boolean(report.isg_data?.findings?.some((f) => f.status === 'open'))
      } else if (quickFilter === 'isg') {
        matchesQuick = report.type === 'isg'
      }

      return matchesSearch && matchesType && matchesQuick
    })
  }, [reports, searchTerm, typeFilter, quickFilter])

  const hasActiveFilters = Boolean(searchTerm.trim()) || typeFilter !== 'all' || quickFilter !== 'all'

  const openReport = (report: Report) => {
    setViewReport(report)
    setEditContent(report.content)
    setIsEditing(false)
  }

  const handleShareToggle = async (report: Report, enable: boolean) => {
    setIsShareLoading(true)
    try {
      const res = await fetch(`/api/reports/${report.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ action: enable ? 'enable' : 'disable' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Paylasim islemi basarisiz.')

      const updatedReport = {
        ...report,
        is_public: enable,
        share_token: data.share_token || report.share_token,
        share_expires_at: enable ? data.share_expires_at || report.share_expires_at : null,
      }
      setReports((prev) => prev.map((r) => (r.id === report.id ? updatedReport : r)))
      setShareReport(updatedReport)

      toast.success(enable ? 'Rapor paylasima acildi.' : 'Rapor paylasima kapatildi.')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsShareLoading(false)
    }
  }

  const copyShareLink = (token?: string) => {
    if (!token) return
    const url = `${window.location.origin}/r/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Baglanti kopyalandi.')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu raporu silmek istediginize emin misiniz?')) return

    setDeletingId(id)
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id))
      toast.success('Rapor silindi.')
    } else {
      toast.error('Silme islemi basarisiz.')
    }
    setDeletingId(null)
  }

  const handleDownload = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Rapor metin dosyasi olarak indirildi.')
  }

  const handleDownloadPDF = async (report: Report) => {
    if (report.isg_data) {
      toast.loading('Kurumsal İSG PDF raporu hazırlanıyor...', { id: 'isg-pdf' })
      try {
        const isgDoc = await generateISGReportPDF(report.isg_data)
        isgDoc.save(`${report.title || 'ISG_Saha_Denetim_Raporu'}.pdf`)
        toast.success('Resmi İSG Denetim Raporu PDF olarak indirildi.', { id: 'isg-pdf' })
      } catch (err) {
        toast.error('İSG PDF oluşturulurken hata: ' + (err as Error).message, { id: 'isg-pdf' })
      }
      return
    }
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
    } catch {
      toast.error('Turkce font yuklenemedi, varsayilan font kullanilacak.')
    }

    doc.setFontSize(16)
    doc.text(report.title, 10, 10)
    doc.setFontSize(10)
    doc.text(`Tarih: ${new Date(report.created_at).toLocaleDateString('tr-TR')}`, 10, 20)
    doc.text(`Tur: ${report.type.toUpperCase()}`, 10, 25)

    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(report.content, 190)

    let y = 40
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
      doc.text(splitText, 10, 40)
    }

    doc.save(`${report.title}.pdf`)
    toast.success('PDF olarak indirildi.')
  }

  const handleUpdateReport = async () => {
    if (!viewReport) return
    setIsSaving(true)

    const { error } = await supabase.from('reports').update({ content: editContent }).eq('id', viewReport.id)

    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === viewReport.id ? { ...r, content: editContent } : r)))
      setViewReport({ ...viewReport, content: editContent })
      setIsEditing(false)
      toast.success('Rapor guncellendi.')
    } else {
      toast.error(`Guncelleme basarisiz: ${error.message}`)
    }
    setIsSaving(false)
  }

  const handleShareWhatsApp = (report: Report) => {
    let summaryText = ''
    if (report.isg_data) {
      const highCount = report.isg_data.findings?.filter((f) => f.riskLevel === 'high').length ?? 0
      const openCount = report.isg_data.findings?.filter((f) => f.status === 'open').length ?? 0
      summaryText = `🚨 *İSG Saha Denetim Raporu*\n🏢 *Proje:* ${report.isg_data.projectInfo?.projectName || report.title}\n📅 *Tarih:* ${report.isg_data.projectInfo?.inspectionDate || new Date(report.created_at).toLocaleDateString('tr-TR')}\n⚠️ *Bulgular:* ${report.isg_data.findings?.length ?? 0} adet (${highCount} Kritik Risk, ${openCount} Açık DÖF)\n`
    } else {
      summaryText = `📋 *Saha Raporu:* ${report.title}\n📅 *Tarih:* ${new Date(report.created_at).toLocaleDateString('tr-TR')}\n`
    }

    if (report.is_public && report.share_token) {
      summaryText += `🔗 *Rapor Bağlantısı:* ${window.location.origin}/share/${report.share_token}`
    } else {
      summaryText += `📄 *İSG Saha Asistanı ile Düzenlenmiştir.*`
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`
    window.open(waUrl, '_blank')
  }

  const renderActions = (report: Report) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Menuyu ac</span>
          {deletingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => openReport(report)}>
          <Eye className="mr-2 h-4 w-4" /> Görüntüle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadPDF(report)}>
          <FileText className="mr-2 h-4 w-4" /> PDF İndir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShareWhatsApp(report)}>
          <MessageSquare className="mr-2 h-4 w-4 text-emerald-600" /> WhatsApp ile Paylaş
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload(report.content, report.title)}>
          <Download className="mr-2 h-4 w-4" /> Metin İndir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setShareReport(report)}>
          <Share2 className="mr-2 h-4 w-4" /> Paylaşım Linki
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleDelete(report.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="field-page field-reports-page flex flex-col gap-6">
      <div className="field-page-heading flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <p className="field-page-kicker">ARŞİV / RAPOR KAYITLARI</p>
          <h1 className="field-page-title">Rapor arşivi</h1>
          <p className="text-sm text-muted-foreground mt-1">Denetim çıktılarını bul, gözden geçir ve paylaş.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rapor başlığı ara..."
              className="pl-9 bg-card border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background border-border/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tumu" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="isg">İSG Saha Denetimi</SelectItem>
              <SelectItem value="risk">Risk Değerlendirme</SelectItem>
              <SelectItem value="ramak_kala">Ramak Kala</SelectItem>
              <SelectItem value="genel">Genel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* İSG Hızlı Filtre Butonları */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={quickFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('all')}
          className={`h-8 text-xs font-semibold ${quickFilter === 'all' ? 'bg-[#34493c] text-[#fbf9f4] hover:bg-[#28382e]' : 'border-border/60 hover:bg-muted'}`}
        >
          Tüm Dosyalar ({reports.length})
        </Button>
        <Button
          variant={quickFilter === 'high_risk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('high_risk')}
          className={`h-8 text-xs font-semibold ${
            quickFilter === 'high_risk'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'text-red-600 hover:text-red-700 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
          Kritik Riskler ({stats.highRisk})
        </Button>
        <Button
          variant={quickFilter === 'open_dof' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('open_dof')}
          className={`h-8 text-xs font-semibold ${
            quickFilter === 'open_dof'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'text-amber-700 dark:text-amber-400 hover:text-amber-800 border-amber-300 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Açık DÖF Takibi ({stats.openDof})
        </Button>
        <Button
          variant={quickFilter === 'isg' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('isg')}
          className={`h-8 text-xs font-semibold ${quickFilter === 'isg' ? 'bg-[#34493c] text-[#fbf9f4] hover:bg-[#28382e]' : 'border-border/60 hover:bg-muted'}`}
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Saha Denetimleri ({stats.isg})
        </Button>
      </div>

      <section className="archive-summary" aria-label="Arşiv özeti">
        <div className="archive-summary-lead">
          <span className="archive-summary-icon"><FileText size={18} /></span>
          <div><span className="archive-summary-label">TOPLAM DOSYA</span><strong>{isLoading ? '—' : reports.length.toString().padStart(2, '0')}</strong></div>
        </div>
        <div className="archive-summary-item"><span className="archive-summary-label">GÖRÜNTÜLENEN</span><strong>{isLoading ? '—' : filteredReports.length.toString().padStart(2, '0')}</strong></div>
        <div className="archive-summary-item"><span className="archive-summary-label">PAYLAŞILAN</span><strong>{isLoading ? '—' : reports.filter((report) => report.is_public).length.toString().padStart(2, '0')}</strong></div>
        <span className="archive-summary-note">DOSYA DÜZENİ · SON EKLENEN EN ÜSTTE</span>
      </section>

      {!isLoading && filteredReports.length > 0 ? (
        <section className="archive-dossier-wall" aria-label="Rapor dosyaları">
          {filteredReports.map((report, index) => {
            const hasHighRisk = report.isg_data?.findings?.some((f) => f.riskLevel === 'high')
            const openFindingsCount = report.isg_data?.findings?.filter((f) => f.status === 'open').length ?? 0
            const totalFindingsCount = report.isg_data?.findings?.length ?? 0

            return (
              <article className="archive-dossier" key={`dossier-${report.id}`}>
                <button
                  className="archive-dossier-open"
                  onClick={() => openReport(report)}
                  aria-label={`${report.title} raporunu aç`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="archive-dossier-index">
                      DOSYA <strong>{String(filteredReports.length - index).padStart(3, '0')}</strong>
                    </span>
                    {hasHighRisk && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-red-600 bg-red-100 dark:bg-red-950/50 dark:text-red-400 px-2 py-0.5 rounded font-mono">
                        <AlertTriangle className="h-3 w-3" /> KRİTİK RİSK
                      </span>
                    )}
                  </div>

                  <span className="archive-dossier-glyph">
                    <FileText size={21} />
                  </span>

                  <span className="archive-dossier-title">{report.title}</span>

                  {report.isg_data?.projectInfo?.projectName && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate max-w-full">
                      <Building2 className="h-3 w-3 flex-none text-muted-foreground/70" />
                      <span className="truncate">{report.isg_data.projectInfo.projectName}</span>
                    </div>
                  )}

                  {totalFindingsCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                        {totalFindingsCount} Bulgu
                      </span>
                      {openFindingsCount > 0 && (
                        <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          {openFindingsCount} Açık DÖF
                        </span>
                      )}
                    </div>
                  )}

                  <span className="archive-dossier-meta">
                    <span>{report.type.toLocaleUpperCase('tr-TR')}</span>
                    <span>
                      {new Date(report.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                </button>

                <div className="archive-dossier-footer">
                  <span className="archive-dossier-status">
                    <i />
                    {report.is_public ? 'PAYLAŞIMDA' : 'ARŞİVLENDİ'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px] font-semibold border-border/70 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadPDF(report)
                      }}
                      title="PDF İndir"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShareWhatsApp(report)
                      }}
                      title="WhatsApp ile Paylaş"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    {renderActions(report)}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : null}

      <Card className={`archive-ledger border-border/50 shadow-sm ${!isLoading && filteredReports.length > 0 ? 'hidden' : ''}`}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 md:p-6 space-y-3">
              <div className="h-10 w-full rounded-lg border bg-muted/40 animate-pulse" />
              <div className="h-10 w-full rounded-lg border bg-muted/40 animate-pulse" />
              <div className="h-10 w-full rounded-lg border bg-muted/40 animate-pulse" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{hasActiveFilters ? 'Sonuc bulunamadi' : 'Henuz rapor yok'}</h3>
              <p className="max-w-sm mb-4">
                {hasActiveFilters
                  ? 'Aramaniza uygun rapor bulunamadi. Filtreleri sifirlayip tekrar deneyin.'
                  : 'Ilk raporunuzu olusturarak listede gormeye baslayabilirsiniz.'}
              </p>
              {!hasActiveFilters ? (
                <Button asChild className="bg-primary text-primary-foreground font-medium">
                  <Link href="/dashboard/isg-denetim">
                    Saha Denetimi Başlat <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => { setSearchTerm(''); setTypeFilter('all') }}>
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="md:hidden p-3 space-y-3">
                {filteredReports.map((report) => (
                  <div key={report.id} className="rounded-lg border p-3 space-y-3 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button className="text-left w-full" onClick={() => openReport(report)}>
                          <p className="font-semibold text-sm truncate">{report.title}</p>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(report.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600"
                          onClick={() => handleShareWhatsApp(report)}
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownloadPDF(report)}
                          title="PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {renderActions(report)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize font-normal">{report.type}</Badge>
                      {report.isg_data?.findings?.some((f) => f.riskLevel === 'high') && (
                        <Badge variant="destructive" className="text-xs">Kritik Risk</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">Tamamlandı</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                      <TableHead className="w-[400px]">Rapor Başlığı</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer hover:bg-muted/50 group"
                        onClick={() => openReport(report)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center border">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <span>{report.title}</span>
                              {report.isg_data?.projectInfo?.projectName && (
                                <p className="text-xs text-muted-foreground font-normal">{report.isg_data.projectInfo.projectName}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize font-normal">{report.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Calendar className="mr-2 h-3 w-3" />
                            {new Date(report.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                            Tamamlandı
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleDownloadPDF(report)}
                              title="PDF İndir"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700"
                              onClick={() => handleShareWhatsApp(report)}
                              title="WhatsApp ile Paylaş"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              WhatsApp
                            </Button>
                            {renderActions(report)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span className="truncate">{viewReport?.title}</span>
              {isEditing ? (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" /> Iptal
                  </Button>
                  <Button size="sm" onClick={handleUpdateReport} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Kaydet
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Duzenle
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewReport?.created_at && new Date(viewReport.created_at).toLocaleDateString('tr-TR')} - {viewReport?.type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {viewReport?.input_text ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Girdi / Notlar</h4>
              <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap text-sm border max-h-40 overflow-y-auto font-mono">
                {viewReport.input_text}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Rapor Ciktisi</h4>
            {isEditing ? (
              <Textarea className="min-h-[360px] font-mono text-sm leading-relaxed" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            ) : (
              <div className="p-6 bg-background border rounded-lg whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {viewReport?.content}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewReport(null)}>Kapat</Button>
            <Button onClick={() => viewReport && handleDownloadPDF(viewReport)}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button variant="secondary" onClick={() => viewReport && handleDownload(viewReport.content, viewReport.title)}>
              <Download className="mr-2 h-4 w-4" /> TXT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareReport} onOpenChange={(open) => !open && setShareReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rapor Paylasimi</DialogTitle>
            <DialogDescription>Bu raporu herkese acik bir baglanti ile paylasin.</DialogDescription>
          </DialogHeader>

          {shareReport ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50 gap-4">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium leading-none">Herkese Acik Erisim</label>
                  <p className="text-sm text-muted-foreground">Baglantiya sahip olan herkes raporu goruntuleyebilir.</p>
                </div>
                <Button
                  size="sm"
                  variant={shareReport.is_public ? 'destructive' : 'default'}
                  onClick={() => handleShareToggle(shareReport, !shareReport.is_public)}
                  disabled={isShareLoading}
                >
                  {isShareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : shareReport.is_public ? 'Kapat' : 'Ac'}
                </Button>
              </div>

              {shareReport.is_public ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Paylasim Baglantisi</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${shareReport.share_token}`}
                        className="pl-9 bg-muted"
                      />
                    </div>
                    <Button size="icon" variant="outline" onClick={() => copyShareLink(shareReport.share_token)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" asChild>
                      <a href={`/r/${shareReport.share_token}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-field-gold bg-field-yellow/15 p-2 rounded border border-field-gold/40">
                    <Lock className="h-3 w-3" />
                    Rapor internetteki herkes tarafindan goruntulenebilir hale gelir.
                  </div>
                  {shareReport.share_expires_at ? (
                    <p className="text-xs text-muted-foreground">
                      Baglanti gecerlilik sonu: {new Date(shareReport.share_expires_at).toLocaleString('tr-TR')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
