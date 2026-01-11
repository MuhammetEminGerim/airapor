import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Download, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import jsPDF from 'jspdf'

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Token ile raporu çek
  const { data: report, error } = await supabase
    .from('reports')
    .select('*, profiles(full_name)')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (error || !report) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-muted/20">
        <header className="border-b bg-background/50 backdrop-blur sticky top-0 z-10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span>Rapor Asistanı</span>
                </div>
                <div className="flex items-center gap-4">
                     <div className="text-sm text-muted-foreground hidden sm:block">
                        <span className="font-medium text-foreground">{report.profiles?.full_name || 'Bir Kullanıcı'}</span> tarafından paylaşıldı
                     </div>
                     <Button variant="outline" size="sm" asChild>
                        <a href="/">Kendi Raporunu Oluştur</a>
                     </Button>
                </div>
            </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">{report.type === 'isg' ? 'İş Güvenliği' : report.type}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{report.title}</h1>
                </div>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-background min-h-[500px]">
                        {report.content}
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 flex justify-center text-center">
                <div className="max-w-md space-y-2">
                    <div className="flex items-center justify-center gap-2 text-primary font-medium">
                        <ShieldCheck className="h-5 w-5" />
                        Güvenli ve Doğrulanmış
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Bu rapor yapay zeka destekli <strong>Rapor Asistanı</strong> kullanılarak oluşturulmuştur.
                    </p>
                </div>
            </div>
        </main>
    </div>
  )
}
