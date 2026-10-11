'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Clock,
  Search,
  ArrowRight,
  HardHat,
  ClipboardCheck,
  FolderOpen,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Download,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createDevTimer } from '@/lib/dev-timing'
import { generateISGReportPDF } from '@/lib/isg-pdf'
import type { ISGReportData } from '@/types/isg'

interface DashboardReport {
  id: string
  title: string
  type: string
  created_at: string
  status: string
  isg_data?: ISGReportData | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, month: 0, savedTime: 0 })
  const [recentReports, setRecentReports] = useState<DashboardReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('Kullanıcı')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const timer = createDevTimer('dashboard-home')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        timer.mark('auth-ready', { hasUser: Boolean(user) })

        if (!user) {
          setIsLoading(false)
          timer.end({ reason: 'no-user' })
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (!profileError) setUserName(profile?.full_name || 'Kullanıcı')
        timer.mark('profile-ready', { hasProfile: !profileError })

        const { count, error: countError } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (countError) toast.error('İstatistikler yüklenemedi.')
        else if (count !== null) {
          const monthStart = new Date()
          monthStart.setDate(1)
          const { count: monthCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', monthStart.toISOString())
          setStats({ total: count, month: monthCount ?? 0, savedTime: count * 2 })
        }
        timer.mark('stats-ready', { total: count ?? 0, hasError: Boolean(countError) })

        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('id, title, type, created_at, status, isg_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8)

        if (reportsError) toast.error('Raporlar yüklenirken bir hata oluştu.')
        else setRecentReports(reports || [])
        timer.mark('reports-ready', { reports: reports?.length ?? 0, hasError: Boolean(reportsError) })
      } catch {
        toast.error('Panel verileri alınamadı.')
        timer.mark('fetch-error')
      } finally {
        setIsLoading(false)
        timer.end()
      }
    }

    fetchData()
  }, [])

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('tr-TR')
    if (!normalizedSearch) return recentReports
    return recentReports.filter((report) => report.title.toLocaleLowerCase('tr-TR').includes(normalizedSearch))
  }, [recentReports, searchTerm])

  const isFirstUse = !isLoading && stats.total === 0
  const greetingName = userName.trim().split(/\s+/)[0] || 'Kullanıcı'

  const latestReport = recentReports[0]
  const today = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', weekday: 'long' }).format(new Date())

  const isgData = latestReport?.isg_data
  const totalFindings = isgData?.findings?.length ?? 0
  const highRiskCount = isgData?.findings?.filter((f) => f.riskLevel === 'high').length ?? 0
  const openFindings = isgData?.findings?.filter((f) => f.status === 'open') ?? []
  const openCount = openFindings.length
  const urgentFinding = openFindings.find((f) => f.riskLevel === 'high') || openFindings[0] || isgData?.findings?.[0]
  const hasUrgentDof = openCount > 0 || highRiskCount > 0
  const photoUrl = isgData?.findings?.find((f) => f.photoUrl)?.photoUrl
  const projectName = isgData?.projectInfo?.projectName || isgData?.projectInfo?.companyName || 'Saha Şantiyesi'
  const inspectorName = isgData?.projectInfo?.inspectorName || 'Yetkili İSG Uzmanı'

  const handleDownloadLatestPDF = async () => {
    if (!latestReport) return
    if (latestReport.isg_data) {
      toast.loading('Kurumsal İSG PDF raporu hazırlanıyor...', { id: 'latest-pdf' })
      try {
        const isgDoc = await generateISGReportPDF(latestReport.isg_data)
        isgDoc.save(`${latestReport.title || 'ISG_Saha_Denetim_Raporu'}.pdf`)
        toast.success('Resmi İSG Denetim Raporu PDF olarak indirildi.', { id: 'latest-pdf' })
      } catch (err) {
        toast.error('PDF oluşturulurken hata: ' + (err as Error).message, { id: 'latest-pdf' })
      }
    } else {
      window.location.href = '/dashboard/reports'
    }
  }

  const handleShareWhatsApp = () => {
    if (!latestReport) return
    let summaryText = ''
    if (latestReport.isg_data) {
      summaryText = `🚨 *İSG Saha Denetim Raporu*\n🏢 *Proje:* ${latestReport.isg_data.projectInfo?.projectName || latestReport.title}\n📅 *Tarih:* ${latestReport.isg_data.projectInfo?.inspectionDate || new Date(latestReport.created_at).toLocaleDateString('tr-TR')}\n⚠️ *Bulgular:* ${totalFindings} adet (${highRiskCount} Kritik Risk, ${openCount} Açık DÖF)\n`
    } else {
      summaryText = `📋 *Saha Raporu:* ${latestReport.title}\n📅 *Tarih:* ${new Date(latestReport.created_at).toLocaleDateString('tr-TR')}\n`
    }
    summaryText += `📄 *İSG Saha Asistanı ile Düzenlenmiştir.*`
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="dashboard-home">
      <section className="dashboard-command-hero">
        <div className="dashboard-command-copy">
          <p className="field-page-kicker">SAHA PANELİ <span>/</span> GÜNLÜK BRİFİNG</p>
          <p className="dashboard-today">{today}</p>
          <h1>Merhaba,<br /><em>{greetingName}.</em></h1>
          <p className="dashboard-command-description">Denetimlerini başlat, son saha kayıtlarını gözden geçir ve raporlarını tek merkezden yönet.</p>
          <div className="dashboard-command-actions">
            <Link href="/dashboard/isg-denetim" className="dashboard-primary-action"><HardHat size={17} /> Yeni denetim <ArrowRight size={16} /></Link>
            <Link href="/dashboard/reports" className="dashboard-secondary-action"><FileText size={16} /> Rapor arşivi</Link>
          </div>
          {isFirstUse ? <p className="dashboard-first-use"><ClipboardCheck size={15} /> İlk denetim dosyanı oluşturduğunda özetlerin burada görünecek.</p> : null}
        </div>

        <article className="dashboard-preview-card">
          <div className="brief-card-header">
            <div className="brief-header-lead">
              <span className="brief-live-dot" />
              <span className="field-page-kicker mb-0">SON SAHA BRİFİNGİ</span>
              <span className="brief-header-id">ISG-01</span>
            </div>
            <span className="brief-header-date">
              {latestReport
                ? new Date(latestReport.created_at).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'HAZIR'}
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="h-4 w-44 rounded bg-muted animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>
          ) : latestReport ? (
            <>
              {/* Identity Row with Photo Pul */}
              <div className="brief-identity-row">
                <div className="brief-identity-copy">
                  <h2 className="brief-title" title={latestReport.title}>{latestReport.title}</h2>
                  <div className="brief-project-meta">
                    <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]">
                      <Building2 size={13} className="text-muted-foreground flex-none" />
                      <b className="truncate">{projectName}</b>
                    </span>
                    <span className="brief-divider">·</span>
                    <span className="text-muted-foreground truncate">{inspectorName}</span>
                  </div>
                </div>

                {/* Mini Photo Thumbnail Pul */}
                {photoUrl ? (
                  <div className="brief-thumbnail-box" title="Denetim bulgu fotoğrafı">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Saha bulgu fotoğrafı" className="brief-thumbnail-img" />
                    <span className="brief-thumbnail-badge">GÖRSEL</span>
                  </div>
                ) : (
                  <div className="brief-thumbnail-fallback" title="Fotoğrafsız denetim">
                    <HardHat size={24} />
                  </div>
                )}
              </div>

              {/* Urgent Action / DÖF Spotlight Banner */}
              <div className={`brief-dof-spotlight ${hasUrgentDof ? 'brief-dof-urgent' : 'brief-dof-clean'}`}>
                <div className="brief-dof-heading">
                  <span className="brief-dof-badge">
                    {hasUrgentDof ? (
                      <>
                        <AlertTriangle size={13} />
                        <span>ACİL DÖF TAKİBİ</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        <span>UYGUNSUZLUK BULUNMUYOR</span>
                      </>
                    )}
                  </span>
                  <span className="brief-dof-deadline">
                    {hasUrgentDof ? `Termin: ${urgentFinding?.deadline || '24 Saat'}` : 'Tüm Maddeler Kapalı'}
                  </span>
                </div>

                <p className="brief-dof-text">
                  {hasUrgentDof
                    ? (urgentFinding?.description || 'Kat boşluğunda veya iskelede düzeltici faaliyet bekleniyor.')
                    : 'Son saha denetiminde açıkta bekleyen düzeltici faaliyet kaydı bulunmuyor.'}
                </p>

                {hasUrgentDof && (
                  <div className="brief-dof-sub">
                    {urgentFinding?.responsible && <span>Sorumlu: <strong>{urgentFinding.responsible}</strong></span>}
                    {urgentFinding?.location && <span>Konum: <strong>{urgentFinding.location}</strong></span>}
                  </div>
                )}
              </div>

              {/* 3 Metric Chips */}
              <div className="brief-metrics-grid">
                <div className="brief-metric-chip">
                  <span>TOPLAM BULGU</span>
                  <strong>{totalFindings} ADET</strong>
                </div>
                <div className={`brief-metric-chip ${highRiskCount > 0 ? 'brief-chip-danger' : ''}`}>
                  <span>KRİTİK RİSK</span>
                  <strong>{highRiskCount > 0 ? `${highRiskCount} YÜKSEK` : '0 YOK'}</strong>
                </div>
                <div className={`brief-metric-chip ${openCount > 0 ? 'brief-chip-warning' : ''}`}>
                  <span>AÇIK DÖF</span>
                  <strong>{openCount > 0 ? `${openCount} AKSİYON` : '0 GİDERİLDİ'}</strong>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="brief-actions-bar">
                <Button asChild size="sm" className="bg-[#34493c] text-[#fbf9f4] hover:bg-[#28382e] font-semibold text-xs h-8">
                  <Link href="/dashboard/reports">
                    Raporu İncele <ArrowRight size={13} className="ml-1" />
                  </Link>
                </Button>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold border-border/70 hover:bg-muted"
                    onClick={handleDownloadLatestPDF}
                    title="PDF İndir"
                  >
                    <Download size={13} className="mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                    onClick={handleShareWhatsApp}
                    title="WhatsApp ile Paylaş"
                  >
                    <MessageSquare size={13} className="mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="dashboard-preview-empty">
              <span className="dashboard-preview-icon"><FolderOpen size={24} /></span>
              <h2>İlk saha dosyan için hazır.</h2>
              <p>Yeni bir denetim başlat; oluşturduğun raporun özeti burada görünsün.</p>
              <Link href="/dashboard/isg-denetim">Denetime geç <ArrowRight size={14} /></Link>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-metrics" aria-label="Saha özeti">
        <article className="dashboard-metric"><span className="dashboard-metric-icon"><FileText size={19} /></span><div><strong>{isLoading ? '—' : stats.month}</strong><b>Bu ay</b><small>oluşturulan rapor</small></div></article>
        <article className="dashboard-metric"><span className="dashboard-metric-icon"><ClipboardCheck size={19} /></span><div><strong>{isLoading ? '—' : stats.total}</strong><b>Toplam rapor</b><small>tüm zamanlar</small></div></article>
        <article className="dashboard-metric"><span className="dashboard-metric-icon"><Clock size={19} /></span><div><strong>{isLoading ? '—' : `${stats.savedTime} saat`}</strong><b>Kazanılan zaman</b><small>yaklaşık hesaplama</small></div></article>
      </section>

      <section className="dashboard-bento-grid" aria-label="Çalışma alanı">
        <article className="dashboard-bento-card dashboard-reports-card">
          <div className="dashboard-bento-heading">
            <div><span className="field-page-kicker">DOSYA KAYITLARI / SON 08</span><h2>Son raporlar</h2></div>
            <Link href="/dashboard/reports">Tüm arşiv <ArrowRight size={14} /></Link>
          </div>
          <label className="dashboard-report-search"><Search size={15} /><Input placeholder="Son raporlarda ara..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Son raporlarda ara" /></label>
          {isLoading ? (
            <div className="dashboard-report-loading"><span /><span /><span /></div>
          ) : filteredReports.length ? (
            <div className="dashboard-report-list">
              {filteredReports.map((report, index) => (
                <Link href="/dashboard/reports" className="dashboard-report-row" key={report.id}>
                  <span className="dashboard-report-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="dashboard-report-icon"><FileText size={16} /></span>
                  <span className="dashboard-report-copy"><strong>{report.title}</strong><small>{report.type.toLocaleUpperCase('tr-TR')} · {new Date(report.created_at).toLocaleDateString('tr-TR')}</small></span>
                  <span className="dashboard-report-status">{report.status || 'Tamamlandı'}</span><ArrowRight size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-report-empty"><FolderOpen size={21} /><strong>{searchTerm ? 'Eşleşen rapor yok.' : 'Henüz rapor oluşturmadın.'}</strong><span>{searchTerm ? 'Arama ifadesini değiştirip tekrar dene.' : 'İlk raporun burada listelenecek.'}</span></div>
          )}
        </article>

        <article className="dashboard-bento-card dashboard-tools-card">
          <div className="dashboard-bento-heading"><div><span className="field-page-kicker">HIZLI ERİŞİM / 02</span><h2>Saha araçları</h2></div></div>
          <Link href="/dashboard/isg-denetim" className="dashboard-tool-link"><span><HardHat size={18} /></span><div><strong>Saha denetimi</strong><small>Fotoğraf ve bulgularla başla</small></div><ArrowRight size={15} /></Link>
          <Link href="/dashboard/settings" className="dashboard-tool-link"><span><Building2 size={18} /></span><div><strong>Firma & OSGB ayarları</strong><small>Logoları ve uzman unvanını yönet</small></div><ArrowRight size={15} /></Link>
        </article>

        <article className="dashboard-bento-card dashboard-date-card">
          <span className="dashboard-bento-overline">BUGÜN SAHADA</span>
          <strong>{today}</strong>
          <p>Raporlarını kaydet, ekibinle paylaş ve tüm saha geçmişini arşivde tut.</p>
          <Link href="/dashboard/reports">Arşivi görüntüle <ArrowRight size={14} /></Link>
        </article>
      </section>
    </div>
  )
}
