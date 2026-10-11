'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Clock, Search, ArrowRight, HardHat, ClipboardCheck, FolderOpen, Building2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createDevTimer } from '@/lib/dev-timing'
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
          <div className="dashboard-preview-top"><span><i /> SAHA DOSYASI / SON KAYIT</span><span>{latestReport ? '01 / 08' : 'HAZIR'}</span></div>
          {isLoading ? (
            <div className="dashboard-preview-loading" aria-label="Son rapor yükleniyor"><span /><span /><span /></div>
          ) : latestReport ? (
            <>
            <div className="dashboard-preview-sheet">
                <div className="dashboard-preview-meta"><span>RAPOR ÖNİZLEMESİ</span><span>{new Date(latestReport.created_at).toLocaleDateString('tr-TR')}</span></div>
                {latestReport.isg_data?.findings?.[0]?.photoUrl ? <img className="dashboard-preview-photo" src={latestReport.isg_data.findings[0].photoUrl} alt="Son saha raporundaki bulgu fotoğrafı" /> : <div className="dashboard-preview-scene" aria-hidden="true"><span /><i /><b /></div>}
                <span className="dashboard-preview-icon"><FileText size={23} /></span>
                <h2>{latestReport.title}</h2>
                <div className="dashboard-preview-tags"><span>{latestReport.type.toLocaleUpperCase('tr-TR')}</span><span>{latestReport.status || 'Tamamlandı'}</span></div>
                <div className="dashboard-preview-rule" />
                <p>Son raporunu arşivden açıp inceleyebilir, indirebilir veya ekibinle paylaşabilirsin.</p>
              </div>
              <Link href="/dashboard/reports" className="dashboard-preview-open">Raporu aç <ArrowRight size={15} /></Link>
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
