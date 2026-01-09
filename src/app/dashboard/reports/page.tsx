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
import { FileText, MoreHorizontal, Download, Eye, Loader2, Trash2, Edit2, Save, X, Search, Filter } from "lucide-react"
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
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewReport, setViewReport] = useState<Report | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <CardTitle>Raporlarım</CardTitle>
                <CardDescription>
                Oluşturduğunuz tüm raporları buradan yönetebilirsiniz.
                </CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ara..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : filteredReports.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
                {searchTerm || typeFilter !== 'all' ? 'Aramanızla eşleşen rapor bulunamadı.' : 'Henüz hiç rapor oluşturmadınız.'}
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rapor Başlığı</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {report.title}
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="capitalize">{report.type}</Badge>
                </TableCell>
                <TableCell>{new Date(report.created_at).toLocaleDateString('tr-TR')}</TableCell>
                <TableCell>
                  <Badge
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Tamamlandı
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
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
                        <Eye className="mr-2 h-4 w-4" /> Görüntüle / Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPDF(report)}>
                        <FileText className="mr-2 h-4 w-4" /> PDF İndir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(report.content, report.title)}>
                        <Download className="mr-2 h-4 w-4" /> Metin İndir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(report.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}

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
                        <div className="p-3 bg-muted rounded-md whitespace-pre-wrap text-sm border max-h-40 overflow-y-auto">
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
                         <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap font-mono text-sm leading-relaxed border-l-4 border-primary pl-4 min-h-[200px]">
                            {viewReport?.content}
                         </div>
                     )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setViewReport(null)}>Kapat</Button>
                    <Button onClick={() => viewReport && handleDownloadPDF(viewReport)}>
                        <FileText className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button onClick={() => viewReport && handleDownload(viewReport.content, viewReport.title)}>
                        <Download className="mr-2 h-4 w-4" /> TXT
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
