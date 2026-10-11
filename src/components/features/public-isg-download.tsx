'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateISGReportPDF } from '@/lib/isg-pdf'
import type { ISGReportData } from '@/types/isg'
import { toast } from 'sonner'

export function PublicISGDownloadButton({ isgData, title }: { isgData: ISGReportData; title: string }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    toast.loading('Kurumsal İSG PDF raporu hazırlanıyor...', { id: 'public-pdf' })
    try {
      const doc = await generateISGReportPDF(isgData)
      doc.save(`${title || 'ISG_Saha_Denetim_Raporu'}.pdf`)
      toast.success('Resmi İSG Denetim Raporu PDF olarak indirildi.', { id: 'public-pdf' })
    } catch (err) {
      toast.error('PDF oluşturulurken hata: ' + (err as Error).message, { id: 'public-pdf' })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
    >
      {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Resmi PDF İndir
    </Button>
  )
}
