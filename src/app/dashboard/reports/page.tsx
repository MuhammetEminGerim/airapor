'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, MoreHorizontal, Download, Eye, Loader2, Trash2, Edit2, Save, X, Search, Filter, Calendar, Share2, Globe, Link as LinkIcon, Lock, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

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
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewReport, setViewReport] = useState<Report | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Share Modal State
  const [shareReport, setShareReport] = useState<Report | null>(null)
  const [isShareLoading, setIsShareLoading] = useState(false)

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchReports = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            toast.error('Raporlar yüklenirken hata oluştu.')
        }
        else setReports(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleShareToggle = async (report: Report, enable: boolean) => {
    setIsShareLoading(true)
    try {
        const res = await fetch(`/api/reports/${report.id}/share`, {
            method: 'POST',
            body: JSON.stringify({ action: enable ? 'enable' : 'disable' })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        // Update local state
        const updatedReport = { ...report, is_public: enable, share_token: data.share_token || report.share_token }
        setReports(prev => prev.map(r => r.id === report.id ? updatedReport : r))
        setShareReport(updatedReport)

        toast.success(enable ? 'Rapor paylaşıma açıldı.' : 'Rapor paylaşıma kapatıldı.')
    } catch (error) {
        toast.error('İşlem başarısız: ' + (error as Error).message)
    } finally {
        setIsShareLoading(false)
    }
  }

  const copyShareLink = (token?: string) => {
      if (!token) return
      const url = `${window.location.origin}/r/${token}`
      navigator.clipboard.writeText(url)
      toast.success('Bağlantı kopyalandı!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return

    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (!error) {
        setReports(prev => prev.filter(r => r.id !== id))
        toast.success('Rapor silindi.')
    } else {
        toast.error('Silme işlemi başarısız.')
    }
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
    toast.success('Rapor metin dosyası olarak indirildi.')
  }

  const handleDownloadPDF = async (report: Report) => {
    const doc = new jsPDF()

    try {
        // Türkçe karakter desteği için Roboto fontunu yüklüyoruz
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
        console.error('Font yüklenirken hata oluştu:', error)
        toast.error('Türkçe font yüklenemedi, standart font kullanılacak.')
    }

    doc.setFontSize(16)
    doc.text(report.title, 10, 10)

    doc.setFontSize(10)
    doc.text(`Tarih: ${new Date(report.created_at).toLocaleDateString('tr-TR')}`, 10, 20)
    doc.text(`Tür: ${report.type.toUpperCase()}`, 10, 25)

    doc.setFontSize(12)
    // splitTextToSize uzun metinleri satırlara böler
    const splitText = doc.splitTextToSize(report.content, 190)

    let y = 40
    const pageHeight = doc.internal.pageSize.height
    const lineHeight = 7 // 12pt font için satır yüksekliği

    // Her satırı döngü ile kontrol edip yazdırıyoruz
    if (Array.isArray(splitText)) {
        splitText.forEach((line: string) => {
            if (y + lineHeight > pageHeight - 10) {
                doc.addPage()
                y = 20 // Yeni sayfa başlangıç Y koordinatı
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

    const { error } = await supabase
        .from('reports')
        .update({ content: editContent })
        .eq('id', viewReport.id)

    if (!error) {
        setReports(prev => prev.map(r => r.id === viewReport.id ? { ...r, content: editContent } : r))
        setViewReport({ ...viewReport, content: editContent })
        setIsEditing(false)
        toast.success('Rapor güncellendi.')
    } else {
        toast.error('Güncelleme başarısız: ' + error.message)
    }
    setIsSaving(false)
  }

  // Filter Logic
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Raporlarım</h1>
            <p className="text-sm text-muted-foreground mt-1">Oluşturduğunuz tüm raporları buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Başlık ara..."
                    className="pl-9 bg-background border-border/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-background border-border/50">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Tümü" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="genel">Genel</SelectItem>
                    <SelectItem value="isg">İSG</SelectItem>
                    <SelectItem value="finans">Finans</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Raporlar yükleniyor...</p>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Henüz rapor yok</h3>
                    <p className="max-w-sm text-center mb-4">
                        {searchTerm || typeFilter !== 'all' ? 'Aramanızla eşleşen rapor bulunamadı.' : 'Henüz hiç rapor oluşturmadınız.'}
                    </p>
                    {!(searchTerm || typeFilter !== 'all') && (
                        <Button variant="outline" asChild>
                            <a href="/dashboard/upload">Yeni Rapor Oluştur</a>
                        </Button>
                    )}
                </div>
            ) : (
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
                            <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50 group" onClick={() => {
                                setViewReport(report)
                                setEditContent(report.content)
                                setIsEditing(false)
                            }}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center border group-hover:bg-background group-hover:border-primary/20 transition-colors">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span>{report.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize font-normal">
                                        {report.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center text-muted-foreground text-sm">
                                        <Calendar className="mr-2 h-3 w-3" />
                                        {new Date(report.created_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                        Tamamlandı
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="sr-only">Menüyü aç</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setViewReport(report)
                                                    setEditContent(report.content)
                                                    setIsEditing(false)
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4" /> Görüntüle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDownloadPDF(report)}>
                                                    <FileText className="mr-2 h-4 w-4" /> PDF İndir
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDownload(report.content, report.title)}>
                                                    <Download className="mr-2 h-4 w-4" /> Metin İndir
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setShareReport(report)}>
                                                    <Share2 className="mr-2 h-4 w-4" /> Paylaş
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50" onClick={() => handleDelete(report.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                    <span>{viewReport?.title}</span>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                <X className="h-4 w-4 mr-1" /> İptal
                            </Button>
                            <Button size="sm" onClick={handleUpdateReport} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Kaydet
                            </Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Düzenle
                        </Button>
                    )}
                </DialogTitle>
                <DialogDescription>
                    {viewReport?.created_at && new Date(viewReport.created_at).toLocaleDateString('tr-TR')} - {viewReport?.type.toUpperCase()}
                </DialogDescription>
            </DialogHeader>

            {viewReport?.input_text && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Girdi / Notlar:</h4>
                    <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap text-sm border border-border/50 max-h-40 overflow-y-auto font-mono">
                        {viewReport.input_text}
                    </div>
                </div>
            )}

            <div className="mt-4">
                 <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Rapor Çıktısı:</h4>
                 {isEditing ? (
                     <Textarea
                        className="min-h-[400px] font-mono text-sm leading-relaxed"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                     />
                 ) : (
                     <div className="p-6 bg-background border rounded-lg shadow-sm whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {viewReport?.content}
                     </div>
                 )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
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
                <DialogTitle>Rapor Paylaşımı</DialogTitle>
                <DialogDescription>
                    Bu raporu herkese açık bir bağlantı ile paylaşın.
                </DialogDescription>
            </DialogHeader>

            {shareReport && (
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Herkese Açık Erişim
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Bağlantıya sahip olan herkes raporu görüntüleyebilir.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Button
                                size="sm"
                                variant={shareReport.is_public ? "destructive" : "default"}
                                onClick={() => handleShareToggle(shareReport, !shareReport.is_public)}
                                disabled={isShareLoading}
                             >
                                {isShareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : shareReport.is_public ? 'Kapat' : 'Aç'}
                             </Button>
                        </div>
                    </div>

                    {shareReport.is_public && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Paylaşım Bağlantısı</label>
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
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                <Lock className="h-3 w-3" />
                                Rapor içeriği internetteki herkes tarafından görüntülenebilir hale gelecektir.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
