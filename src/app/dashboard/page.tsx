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

const CACHE_KEY_REPORTS = 'isg_cache_recent_reports'
const CACHE_KEY_DOF = 'isg_cache_open_dof'
const CACHE_KEY_USER = 'isg_cache_user_name'

export default function DashboardPage() {
  // Stale-While-Revalidate (Anında Render Önbelleği)
  const [openDof, setOpenDof] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY_DOF)
        if (cached !== null) return Number(cached)
      } catch {}
    }
    return 0
  })

  const [recentReports, setRecentReports] = useState<DashboardReport[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY_REPORTS)
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return []
  })

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY_USER)
        if (cached) return cached
      } catch {}
    }
    return 'Kullanıcı'
  })

  // Eğer önbellekten rapor geldiyse bekleme animasyonuna gerek yok, anında göster
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem(CACHE_KEY_REPORTS)
    }
    return true
  })

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

        // Paralel İstek (Promise.all): Profil ve Raporları aynı anda çekerek süreyi yarıya indiriyoruz
        const [profileRes, reportsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('reports')
            .select('id, title, type, created_at, status, isg_data')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(4), // Sadece son 3-4 raporu çekerek veri aktarım boyutunu hafifletiyoruz
        ])

        if (profileRes.data?.full_name) {
          setUserName(profileRes.data.full_name)
          sessionStorage.setItem(CACHE_KEY_USER, profileRes.data.full_name)
        }

        if (reportsRes.error) {
          toast.error('Raporlar yüklenirken bir hata oluştu.')
        } else {
          const loadedReports = (reportsRes.data || []) as DashboardReport[]
          const computedOpenDof = loadedReports.reduce(
            (total, report) =>
              total +
              (report.isg_data?.findings?.filter((finding) => finding.status === 'open').length ?? 0),
            0,
          )

          setOpenDof(computedOpenDof)
          setRecentReports(loadedReports)

          // Bir sonraki yenilemede 0 ms gecikmeyle anında açılması için önbelleğe al
          sessionStorage.setItem(CACHE_KEY_REPORTS, JSON.stringify(loadedReports))
          sessionStorage.setItem(CACHE_KEY_DOF, String(computedOpenDof))
        }

        timer.mark('reports-ready', { reports: reportsRes.data?.length ?? 0 })
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

        {isLoading && recentReports.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-muted rounded w-2/5" />
                  <div className="h-2.5 bg-muted/60 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
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
