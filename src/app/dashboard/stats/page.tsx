'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { createDevTimer } from '@/lib/dev-timing'
import type { ISGReportData } from '@/types/isg'

type ReportRow = {
  type: string | null
  created_at: string
  isg_data: ISGReportData | null
}

type TooltipItem = {
  name?: string
  value?: number | string
  color?: string
  payload?: { color?: string }
}

type StatsTooltipProps = {
  active?: boolean
  payload?: TooltipItem[]
  label?: string
  suffix?: string
}

function StatsTooltip({ active, payload, label, suffix }: StatsTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="stats-tooltip">
      {label ? <strong>{label}</strong> : null}
      {payload.map((item, index) => (
        <span key={`${item.name}-${index}`}>
          <i className="stats-dot" style={{ background: item.color || item.payload?.color }} />
          {item.name}: <b>{item.value}</b>
          {suffix ? ` ${suffix}` : ''}
        </span>
      ))}
    </div>
  )
}

function TrendPill({ value, good }: { value: number; good: 'up' | 'down' | 'neutral' }) {
  let cls = 'is-flat'
  if (value !== 0 && good !== 'neutral') {
    const positive = good === 'up' ? value > 0 : value < 0
    cls = positive ? 'is-up' : 'is-down'
  }
  const Icon = value < 0 ? TrendingDown : TrendingUp
  return (
    <span className={`stats-kpi-trend ${cls}`} title="Bu ayın geçen aya göre değişimi">
      <Icon size={12} /> {Math.abs(value)}%
    </span>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
  tone = 'default',
  trend,
  trendGood = 'up',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  note: string
  tone?: 'default' | 'warning' | 'danger' | 'success'
  trend?: number
  trendGood?: 'up' | 'down' | 'neutral'
}) {
  return (
    <article className={`stats-kpi${tone === 'default' ? '' : ` is-${tone}`}`}>
      <div className="stats-kpi-top">
        <span className="stats-kpi-icon">
          <Icon size={18} />
        </span>
        {typeof trend === 'number' ? <TrendPill value={trend} good={trendGood} /> : null}
      </div>
      <div>
        <p className="stats-kpi-label">{label}</p>
        <p className="stats-kpi-value">
          <span>{value}</span>
          {unit ? <span className="stats-kpi-unit">{unit}</span> : null}
        </p>
        <p className="stats-kpi-note">{note}</p>
      </div>
    </article>
  )
}

export default function StatsPage() {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const timer = createDevTimer('dashboard-stats')
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        timer.mark('auth-ready', { hasUser: Boolean(user) })

        if (!user) {
          setIsLoading(false)
          timer.end({ reason: 'no-user' })
          return
        }

        const { data } = await supabase
          .from('reports')
          .select('type, created_at, isg_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        setRows((data as ReportRow[]) || [])
        timer.mark('stats-ready', { reports: data?.length ?? 0 })
      } finally {
        setIsLoading(false)
        timer.end()
      }
    }

    fetchData()
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Son 30 günün başlangıcı (00:00:00)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const dailyMap = new Map<string, { label: string; rapor: number; bulgu: number }>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      dailyMap.set(key, { label, rapor: 0, bulgu: 0 })
    }

    let reportsThisMonth = 0
    let reportsPrevMonth = 0
    let reportsLast30Days = 0
    let findingsLast30Days = 0
    let open = 0
    let closed = 0
    let overdue = 0
    let totalFindings = 0

    for (const row of rows) {
      const created = new Date(row.created_at)

      if (created >= startOfMonth) reportsThisMonth += 1
      else if (created >= startOfPrevMonth && created < startOfMonth) reportsPrevMonth += 1

      const rowFindings = row.isg_data?.findings ?? []
      totalFindings += rowFindings.length

      if (created >= thirtyDaysAgo) {
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`
        const entry = dailyMap.get(key)
        if (entry) {
          entry.rapor += 1
          reportsLast30Days += 1
          entry.bulgu += rowFindings.length
          findingsLast30Days += rowFindings.length
        }
      }

      for (const finding of rowFindings) {
        if (finding.status === 'open') {
          open += 1
          if (finding.deadline && new Date(finding.deadline) < now) overdue += 1
        } else {
          closed += 1
        }
      }
    }

    const trend = (current: number, previous: number) =>
      previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100)

    return {
      totalReports: rows.length,
      totalFindings,
      openFindings: open,
      closedFindings: closed,
      overdue,
      reportsThisMonth,
      reportsPrevMonth,
      reportsTrend: trend(reportsThisMonth, reportsPrevMonth),
      reportsLast30Days,
      findingsLast30Days,
      thirtyDaysData: [...dailyMap.values()].map((entry) => ({
        name: entry.label,
        rapor: entry.rapor,
        bulgu: entry.bulgu,
      })),
    }
  }, [rows])

  if (isLoading) {
    return (
      <div className="stats-dashboard">
        <div className="stats-kpis">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="stats-kpi stats-skeleton" key={index} />
          ))}
        </div>
        <div className="stats-panel stats-skeleton stats-skeleton-lg" />
      </div>
    )
  }

  if (stats.totalReports === 0) {
    return (
      <div className="stats-dashboard">
        <header className="stats-head">
          <div>
            <p className="stats-kicker">SAHA ANALİZİ / İSTATİSTİKLER</p>
            <h1>İstatistikler</h1>
            <p className="stats-sub">Rapor ve düzeltici faaliyet performansının özeti.</p>
          </div>
        </header>

        <div className="stats-empty">
          <span className="stats-empty-icon">
            <Lightbulb size={22} />
          </span>
          <h2>Henüz analiz edilecek veri yok</h2>
          <p>İlk saha denetimini oluşturduğunda rapor trendi ve metriklerin burada listelenir.</p>
          <Button asChild className="stats-empty-cta">
            <Link href="/dashboard/isg-denetim">
              Saha denetimi başlat <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const hasRecentActivity = stats.reportsLast30Days > 0 || stats.findingsLast30Days > 0

  return (
    <div className="stats-dashboard">
      <header className="stats-head">
        <div>
          <p className="stats-kicker">SAHA ANALİZİ / İSTATİSTİKLER</p>
          <h1>İstatistikler</h1>
          <p className="stats-sub">Rapor, bulgu ve düzeltici faaliyet performansının özeti.</p>
        </div>
        <Link href="/dashboard/reports" className="stats-head-link">
          Rapor arşivine git <ArrowRight size={15} />
        </Link>
      </header>

      {/* 3 Temel Metrik Kartı */}
      <section className="stats-kpis" aria-label="Özet metrikler">
        <KpiCard
          icon={FileText}
          label="Toplam Rapor"
          value={stats.totalReports}
          unit="rapor"
          note="Arşivlenmiş tüm denetimler"
        />
        <KpiCard
          icon={Calendar}
          label="Bu Ay Oluşturulan"
          value={stats.reportsThisMonth}
          unit="rapor"
          note={
            stats.reportsPrevMonth > 0
              ? `Geçen ay ${stats.reportsPrevMonth} rapor oluşturuldu`
              : 'Geçen aya kıyasla ilk denetimler'
          }
          trend={stats.reportsTrend}
          trendGood="up"
        />
        <KpiCard
          icon={stats.openFindings > 0 ? AlertTriangle : CheckCircle2}
          label="Açık DÖF"
          value={stats.openFindings}
          unit={stats.openFindings > 0 ? 'bulgu' : undefined}
          note={
            stats.overdue > 0
              ? `${stats.overdue} aksiyonun süresi geçti`
              : stats.openFindings > 0
              ? 'Takip bekleyen açık bulgu'
              : 'Tüm düzeltici faaliyetler kapalı'
          }
          tone={stats.overdue > 0 ? 'danger' : stats.openFindings > 0 ? 'warning' : 'success'}
        />
      </section>

      {/* Son 30 Gün Rapor Trendi - Tek Grafik veya Kompakt Boş Durum */}
      <article className="stats-panel">
        <header className="stats-panel-head">
          <div>
            <span className="stats-panel-kicker">SON 30 GÜN</span>
            <h2>Raporlama trendi</h2>
            {hasRecentActivity ? (
              <p className="stats-panel-insight">
                Son 30 günde toplam <strong>{stats.reportsLast30Days}</strong> rapor ve <strong>{stats.findingsLast30Days}</strong> bulgu kaydedildi.
              </p>
            ) : null}
          </div>
          {hasRecentActivity ? (
            <div className="stats-legend">
              <span>
                <i style={{ background: '#23603d' }} /> Rapor
              </span>
              <span>
                <i style={{ background: '#d8a522' }} /> Bulgu
              </span>
            </div>
          ) : null}
        </header>

        {hasRecentActivity ? (
          <div className="stats-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.thirtyDaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="statsRapor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#23603d" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#23603d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="statsBulgu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d8a522" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#d8a522" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--redesign-line)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                  tick={{ fill: '#8b998f', fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={36}
                  tick={{ fill: '#8b998f', fontSize: 11 }}
                />
                <Tooltip content={<StatsTooltip />} cursor={{ stroke: 'var(--redesign-line)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="rapor"
                  name="Rapor"
                  stroke="#23603d"
                  strokeWidth={2.5}
                  fill="url(#statsRapor)"
                />
                <Area
                  type="monotone"
                  dataKey="bulgu"
                  name="Bulgu"
                  stroke="#d8a522"
                  strokeWidth={2.5}
                  fill="url(#statsBulgu)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="stats-chart-empty">
            <div className="stats-chart-empty-icon">
              <TrendingUp size={20} />
            </div>
            <h3>Son 30 günde aktivite yok</h3>
            <p>Yeni bir denetim oluşturduğunda trend burada görünecek.</p>
            <Button asChild size="sm" className="stats-chart-empty-btn">
              <Link href="/dashboard/isg-denetim">
                Yeni denetim başlat <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </article>
    </div>
  )
}
