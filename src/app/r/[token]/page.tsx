import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, ShieldCheck, HardHat } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ISGReportData } from '@/types/isg'
import { PublicISGDownloadButton } from '@/components/features/public-isg-download'

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  // Token ile raporu çek
  const { data: report, error } = await supabase
    .from('reports')
    .select('*, profiles(full_name)')
    .eq('share_token', token)
    .eq('is_public', true)
    .gt('share_expires_at', nowIso)
    .single()

  if (error || !report) {
    notFound()
  }

  const isgData = report.isg_data as ISGReportData | null

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
              <HardHat className="h-5 w-5" />
            </div>
            <span>İSG Rapor Sistemi</span>
          </div>
          <div className="flex items-center gap-3">
            {isgData ? <PublicISGDownloadButton isgData={isgData} title={report.title} /> : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Sistemi İncele</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {isgData ? (
          /* Structured ISG Report View */
          <div className="space-y-6">
            {/* Header / Brand block */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div className="flex items-center gap-4">
                    {isgData.projectInfo.companyLogoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={isgData.projectInfo.companyLogoUrl}
                        alt="Firma Logosu"
                        className="h-12 max-w-[120px] object-contain"
                      />
                    ) : null}
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Saha Gözetim ve Denetim Raporu
                      </span>
                      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {isgData.projectInfo.projectName}
                      </h1>
                    </div>
                  </div>

                  {isgData.projectInfo.osgbLogoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={isgData.projectInfo.osgbLogoUrl}
                      alt="OSGB Logosu"
                      className="h-12 max-w-[120px] object-contain self-end sm:self-auto"
                    />
                  ) : (
                    <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                      {isgData.reportNumber}
                    </Badge>
                  )}
                </div>

                {/* Metadata summary */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-muted-foreground block mb-1">Şantiye Konumu</span>
                    <strong className="text-foreground">{isgData.projectInfo.location || '-'}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-muted-foreground block mb-1">Denetim Tarihi</span>
                    <strong className="text-foreground">
                      {isgData.projectInfo.inspectionDate} ({isgData.projectInfo.inspectionTime})
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-muted-foreground block mb-1">Hava / Çalışan</span>
                    <strong className="text-foreground">
                      {isgData.projectInfo.weather} / {isgData.projectInfo.workerCount} Kişi
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-muted-foreground block mb-1">İSG Uzmanı</span>
                    <strong className="text-foreground">
                      {isgData.projectInfo.inspectorName} ({isgData.projectInfo.inspectorTitle})
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Findings */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-600" />
                Saha Bulguları ve Tespitleri ({isgData.findings.length} Adet)
              </h2>

              <div className="space-y-4">
                {isgData.findings.map((f, idx) => {
                  const riskBorder =
                    f.riskLevel === 'high'
                      ? 'border-l-4 border-l-red-500'
                      : f.riskLevel === 'medium'
                      ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-emerald-500'

                  const riskBadge =
                    f.riskLevel === 'high'
                      ? 'bg-red-500/10 text-red-600 border-red-200'
                      : f.riskLevel === 'medium'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-200'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'

                  return (
                    <Card key={f.id || idx} className={`overflow-hidden shadow-sm ${riskBorder}`}>
                      <CardHeader className="py-2.5 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-muted-foreground">#{idx + 1}</span>
                          <span className="text-xs font-semibold">{f.location || 'Saha'}</span>
                          <Badge variant="outline" className={`text-[10px] ${riskBadge}`}>
                            {f.riskLevel.toUpperCase()} RİSK
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {f.status === 'open' ? 'Açık' : 'Giderildi'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 grid gap-4 sm:grid-cols-4">
                        {f.photoUrl ? (
                          <div className="sm:col-span-1 rounded-lg overflow-hidden border aspect-video sm:aspect-square bg-muted/40 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.photoUrl} alt="Bulgu Fotoğrafı" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <div className={`space-y-2 text-xs ${f.photoUrl ? 'sm:col-span-3' : 'sm:col-span-4'}`}>
                          <div>
                            <span className="text-muted-foreground font-medium block">Tespit:</span>
                            <p className="font-semibold text-foreground text-sm mt-0.5">{f.description}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block">Mevzuat Referansı:</span>
                            <p className="font-mono text-muted-foreground">{f.regulationRef}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block">Önerilen Aksiyon:</span>
                            <p className="text-foreground">{f.suggestedAction}</p>
                          </div>
                          <div className="pt-2 border-t flex flex-wrap justify-between text-muted-foreground text-[11px]">
                            <span>Sorumlu: <strong>{f.responsible}</strong></span>
                            <span>Termin: <strong>{f.deadline}</strong></span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Signatures */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 text-xs text-center">
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground font-semibold block text-[11px]">TESPİT VE TEBLİĞ EDEN</span>
                    <strong className="block text-foreground text-sm">{isgData.signatures.inspectorName}</strong>
                    <span className="text-muted-foreground block">{isgData.signatures.inspectorTitle}</span>
                    <div className="pt-3 text-muted-foreground/60 italic text-[11px]">[İmzalı Nüsha]</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
                    <span className="text-muted-foreground font-semibold block text-[11px]">TEBELLÜĞ EDEN</span>
                    <strong className="block text-foreground text-sm">{isgData.signatures.employerRepName}</strong>
                    <span className="text-muted-foreground block">{isgData.signatures.employerRepTitle}</span>
                    <div className="pt-3 text-muted-foreground/60 italic text-[11px]">[İmzalı Nüsha]</div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed text-center border-t pt-3">
                  {isgData.signatures.disclaimer}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Standard text/markdown report fallback */
          <div className="space-y-6">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {report.type === 'isg' ? 'İş Güvenliği' : report.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {report.title}
                </h1>
              </div>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-background min-h-[500px]">
                  {report.content}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security badge */}
        <div className="mt-8 flex justify-center text-center">
          <div className="max-w-md space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary font-medium text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Doğrulanmış ve Güvenli İSG Raporu
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bu rapor İSG Saha Asistanı kullanılarak hazırlanmış olup geçerlilik süresi mevcuttur.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
