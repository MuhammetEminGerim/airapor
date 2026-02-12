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

  const fetchReports = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim()
    return reports.filter((report) => {
      const matchesSearch = report.title.toLowerCase().includes(normalizedSearch)
      const matchesType = typeFilter === 'all' || report.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [reports, searchTerm, typeFilter])

  const hasActiveFilters = Boolean(searchTerm.trim()) || typeFilter !== 'all'

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

  const renderActions = (report: Report) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Menuyu ac</span>
          {deletingId === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Islemler</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => openReport(report)}>
          <Eye className="mr-2 h-4 w-4" /> Goruntule
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadPDF(report)}>
          <FileText className="mr-2 h-4 w-4" /> PDF Indir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload(report.content, report.title)}>
          <Download className="mr-2 h-4 w-4" /> Metin Indir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setShareReport(report)}>
          <Share2 className="mr-2 h-4 w-4" /> Paylas
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleDelete(report.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Raporlarim</h1>
          <p className="text-sm text-muted-foreground mt-1">Tum raporlarinizi buradan yonetebilirsiniz.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Baslik ara..."
              className="pl-9 bg-background border-border/50"
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
              <SelectItem value="all">Tumu</SelectItem>
              <SelectItem value="genel">Genel</SelectItem>
              <SelectItem value="isg">ISG</SelectItem>
              <SelectItem value="finans">Finans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
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
                <Button asChild>
                  <Link href="/dashboard/upload">
                    Yeni Rapor Olustur <ArrowRight className="ml-2 h-4 w-4" />
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
                  <div key={report.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button className="text-left w-full" onClick={() => openReport(report)}>
                          <p className="font-medium text-sm truncate">{report.title}</p>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(report.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {renderActions(report)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize font-normal">{report.type}</Badge>
                      <Badge variant="outline" className="text-xs">Tamamlandi</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                      <TableHead className="w-[400px]">Rapor Basligi</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">Islemler</TableHead>
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
                            <span>{report.title}</span>
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
                            Tamamlandi
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {renderActions(report)}
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
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
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
