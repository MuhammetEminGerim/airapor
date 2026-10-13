'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  ArrowRight,
  HardHat,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
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
  const [openDof, setOpenDof] = useState(0)
  const [recentReports, setRecentReports] = useState<DashboardReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('Kullanıcı')

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

        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('id, title, type, created_at, status, isg_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8)

        if (reportsError) toast.error('Raporlar yüklenirken bir hata oluştu.')
        else {
          const loadedReports = (reports || []) as DashboardReport[]
          const openDof = loadedReports.reduce(
            (total, report) => total + (report.isg_data?.findings?.filter((finding) => finding.status === 'open').length ?? 0),
            0,
          )
          setOpenDof(openDof)
          setRecentReports(loadedReports)
        }
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

  const greetingName = userName.trim().split(/\s+/)[0] || 'Kullanıcı'

  const today = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', weekday: 'long' }).format(new Date())
  const latestReport = recentReports[0]
  const latestOpenFinding = latestReport?.isg_data?.findings?.find((finding) => finding.status === 'open')
  const hasOpenDof = openDof > 0

  return (
    <div className="dashboard-home dashboard-home-redesign">
      <header className="dashboard-welcome">
        <div>
          <p className="dashboard-redesign-kicker">{today}</p>
          <h1>Merhaba, <span>{greetingName}</span></h1>
          <p>Bugün ne yapmak istiyorsun?</p>
        </div>
        <Link href="/dashboard/isg-denetim" className="dashboard-redesign-primary">
          <HardHat size={17} /> Yeni denetim <ArrowRight size={16} />
        </Link>
      </header>

      <section className="dashboard-focus-grid dashboard-focus-grid-single" aria-label="Öncelikli durum">
        <article className={`dashboard-focus-card ${hasOpenDof ? 'has-alert' : 'is-clear'}`}>
          <div className="dashboard-focus-icon">
            {hasOpenDof ? <AlertTriangle size={21} /> : <CheckCircle2 size={21} />}
          </div>
          <div className="dashboard-focus-content">
            <span className="dashboard-redesign-label">{hasOpenDof ? 'DİKKAT GEREKTİREN DURUM' : 'DURUM TEMİZ'}</span>
            <h2>{hasOpenDof ? `${openDof} açık aksiyon bekliyor` : 'Açık aksiyon bulunmuyor'}</h2>
            <p>
              {hasOpenDof
                ? (latestOpenFinding?.description || 'Rapor arşivindeki açık düzeltici faaliyetleri gözden geçir.')
                : 'Son raporlarında bekleyen bir düzeltici faaliyet görünmüyor.'}
            </p>
            {hasOpenDof ? (
              <Link href="/dashboard/reports">
                Aksiyonları incele <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <section className="dashboard-reports-panel" aria-label="Son raporlar">
        <div className="dashboard-panel-header">
          <div>
            <span className="dashboard-redesign-label">GEÇMİŞTEN DEVAM ET</span>
            <h2>Son 3 rapor</h2>
          </div>
          <Link href="/dashboard/reports">Tümünü gör <ArrowRight size={14} /></Link>
        </div>
        {isLoading ? (
          <div className="dashboard-report-loading"><span /><span /><span /></div>
        ) : recentReports.length ? (
          <div className="dashboard-redesign-report-list">
            {recentReports.slice(0, 3).map((report) => {
              const reportOpenCount = report.isg_data?.findings?.filter((finding) => finding.status === 'open').length ?? 0
              return (
                <Link href="/dashboard/reports" className="dashboard-redesign-report" key={report.id}>
                  <span className="dashboard-redesign-report-icon"><FileText size={17} /></span>
                  <span>
                    <strong>{report.title}</strong>
                    <small>{report.type.toLocaleUpperCase('tr-TR')} · {new Date(report.created_at).toLocaleDateString('tr-TR')}</small>
                  </span>
                  {reportOpenCount > 0 ? (
                    <b>{reportOpenCount} açık</b>
                  ) : (
                    <i><CheckCircle2 size={15} /> Hazır</i>
                  )}
                  <ArrowRight size={15} />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="dashboard-report-empty">
            <FolderOpen size={21} />
            <strong>Henüz rapor oluşturmadın.</strong>
            <span>Yeni denetim başlattığında raporların burada görünecek.</span>
          </div>
        )}
      </section>
    </div>
  )
}
