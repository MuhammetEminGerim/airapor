'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Lightbulb,
  MapPin,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { createDevTimer } from '@/lib/dev-timing'
import type { ISGReportData } from '@/types/isg'

const RISK_COLORS = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
const TYPE_COLORS = ['#23603d', '#3e8b5d', '#d8a522', '#a8743a', '#64748b']
const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

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
  note,
  tone = 'default',
  trend,
  trendGood = 'up',
}: {
  icon: LucideIcon
  label: string
  value: string | number
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
        <p className="stats-kpi-value">{value}</p>
        <p className="stats-kpi-note">{note}</p>
      </div>
    </article>
  )
}

function RankList({ items, emptyLabel }: { items: { label: string; value: number }[]; emptyLabel: string }) {
  if (!items.length) return <p className="stats-empty-note">{emptyLabel}</p>
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <ul className="stats-rank">
      {items.map((item, index) => (
        <li className="stats-rank-row" key={item.label}>
          <span className="stats-rank-index">{String(index + 1).padStart(2, '0')}</span>
          <div className="stats-rank-body">
            <span className="stats-rank-label">{item.label}</span>
            <div className="stats-rank-bar">
              <span style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }} />
            </div>
          </div>
          <span className="stats-rank-value">{item.value}</span>
        </li>
      ))}
    </ul>
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

    const typeCounts = new Map<string, number>()
    const dayCounts = new Array(7).fill(0)
    const monthBuckets = new Map<string, { label: string; rapor: number; bulgu: number }>()
    const locationCounts = new Map<string, number>()
    const responsibleCounts = new Map<string, number>()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthBuckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
        label: d.toLocaleDateString('tr-TR', { month: 'short' }),
        rapor: 0,
        bulgu: 0,
      })
    }

    let reportsThisMonth = 0
    let reportsPrevMonth = 0
    let findingsThisMonth = 0
    let findingsPrevMonth = 0
    let high = 0
    let medium = 0
    let low = 0
    let open = 0
    let closed = 0
    let overdue = 0
    let totalFindings = 0

    for (const row of rows) {
      const created = new Date(row.created_at)
      const typeLabel = (row.type || 'Bilinmeyen').toLocaleUpperCase('tr-TR')
      typeCounts.set(typeLabel, (typeCounts.get(typeLabel) || 0) + 1)
      dayCounts[created.getDay()] += 1

      const bucket = monthBuckets.get(`${created.getFullYear()}-${created.getMonth()}`)
      if (bucket) bucket.rapor += 1

      if (created >= startOfMonth) reportsThisMonth += 1
      else if (created >= startOfPrevMonth && created < startOfMonth) reportsPrevMonth += 1

      const rowFindings = row.isg_data?.findings ?? []
      for (const finding of rowFindings) {
        totalFindings += 1
        if (bucket) bucket.bulgu += 1
        if (created >= startOfMonth) findingsThisMonth += 1
        else if (created >= startOfPrevMonth && created < startOfMonth) findingsPrevMonth += 1

        if (finding.riskLevel === 'high') high += 1
        else if (finding.riskLevel === 'medium') medium += 1
        else low += 1

        if (finding.status === 'open') {
          open += 1
          if (finding.deadline && new Date(finding.deadline) < now) overdue += 1
        } else {
          closed += 1
        }

        const location = (finding.location || '').trim()
        if (location) locationCounts.set(location, (locationCounts.get(location) || 0) + 1)
        const responsible = (finding.responsible || '').trim()
        if (responsible) responsibleCounts.set(responsible, (responsibleCounts.get(responsible) || 0) + 1)
      }
    }

    const percentage = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0)
    const trend = (current: number, previous: number) =>
      previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100)
    const topFrom = (map: Map<string, number>, limit = 5) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, value]) => ({ label, value }))

    const FULL_WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts))
    const peakDayCount = Math.max(...dayCounts)
    const peakDayName = peakDayCount > 0 ? FULL_WEEKDAYS[peakDayIndex] : ''

    const sortedTypes = [...typeCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    const topType = sortedTypes[0] || null

    return {
      totalReports: rows.length,
      totalFindings,
      openFindings: open,
      closedFindings: closed,
      highRisk: high,
      overdue,
      closureRate: percentage(closed, totalFindings),
      openRate: percentage(open, totalFindings),
      highRate: percentage(high, totalFindings),
      avgFindings: rows.length ? Math.round((totalFindings / rows.length) * 10) / 10 : 0,
      reportsThisMonth,
      reportsPrevMonth,
      findingsThisMonth,
      findingsPrevMonth,
      reportsTrend: trend(reportsThisMonth, reportsPrevMonth),
      findingsTrend: trend(findingsThisMonth, findingsPrevMonth),
      peakDayName,
      peakDayCount,
      topType,
      monthlyData: [...monthBuckets.values()].map((bucket) => ({
        name: bucket.label,
        rapor: bucket.rapor,
        bulgu: bucket.bulgu,
      })),
      typeData: sortedTypes,
      weeklyData: WEEKDAYS.map((name, index) => ({ name, rapor: dayCounts[index] })),
      riskData: [
        { name: 'Yüksek', value: high, color: RISK_COLORS.high, rate: percentage(high, totalFindings) },
        { name: 'Orta', value: medium, color: RISK_COLORS.medium, rate: percentage(medium, totalFindings) },
        { name: 'Düşük', value: low, color: RISK_COLORS.low, rate: percentage(low, totalFindings) },
      ],
      topLocations: topFrom(locationCounts),
      topResponsible: topFrom(responsibleCounts),
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
        <div className="stats-grid stats-grid-primary">
          <div className="stats-panel stats-skeleton stats-skeleton-lg" />
          <div className="stats-panel stats-skeleton stats-skeleton-lg" />
        </div>
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
          <p>İlk saha denetimini oluşturduğunda grafikler ve metrikler burada dolmaya başlar.</p>
          <div className="stats-empty-steps">
            <div>
              <b>01</b> Yeni saha denetimi başlat
            </div>
            <div>
              <b>02</b> Bulguları ve risk seviyelerini kaydet
            </div>
            <div>
              <b>03</b> Buraya dönüp performansı incele
            </div>
          </div>
          <Button asChild className="stats-empty-cta">
            <Link href="/dashboard/isg-denetim">
              Saha denetimi başlat <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

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

      <section className="stats-kpis" aria-label="Özet metrikler">
        <KpiCard
          icon={FileText}
          label="Bu Ayki Denetimler"
          value={`${stats.reportsThisMonth} Rapor`}
          note={
            stats.reportsPrevMonth > 0
              ? `Geçen ay: ${stats.reportsPrevMonth} rapor · Toplam: ${stats.totalReports}`
              : stats.totalReports > 0
              ? `Toplam ${stats.totalReports} denetim kaydı`
              : 'Henüz denetim yok'
          }
          trend={stats.reportsTrend}
          trendGood="up"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Açık DÖF Oranı"
          value={`%${stats.openRate}`}
          note={`${stats.openFindings} açık bulgu · ${stats.overdue > 0 ? `${stats.overdue} termin aşımı` : 'termin gecikmesi yok'}`}
          tone={stats.overdue > 0 ? 'danger' : stats.openFindings > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          icon={Gauge}
          label="Kapanma Performansı"
          value={`%${stats.closureRate}`}
          note={`${stats.closedFindings} bulgu çözüldü · ${stats.highRisk} kritik risk`}
          tone={stats.closureRate >= 70 ? 'success' : stats.closureRate >= 40 ? 'warning' : 'danger'}
        />
      </section>

      <section className="stats-grid stats-grid-primary">
        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">SON 6 AY</span>
              <h2>Aktivite trendi</h2>
              <p className="stats-panel-insight">
                Son 6 ayda toplam <strong>{stats.totalReports}</strong> denetimde <strong>{stats.totalFindings}</strong> bulgu kaydedildi.
              </p>
            </div>
            <div className="stats-legend">
              <span>
                <i style={{ background: '#23603d' }} /> Rapor
              </span>
              <span>
                <i style={{ background: '#d8a522' }} /> Bulgu
              </span>
            </div>
          </header>
          <div className="stats-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8b998f', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={36} tick={{ fill: '#8b998f', fontSize: 12 }} />
                <Tooltip content={<StatsTooltip />} cursor={{ stroke: 'var(--redesign-line)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="rapor" name="Rapor" stroke="#23603d" strokeWidth={2.5} fill="url(#statsRapor)" />
                <Area type="monotone" dataKey="bulgu" name="Bulgu" stroke="#d8a522" strokeWidth={2.5} fill="url(#statsBulgu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">RİSK SEVİYESİ</span>
              <h2>Bulgu dağılımı</h2>
              <p className="stats-panel-insight">
                {stats.totalFindings > 0 ? (
                  <>Bulguların <strong>%{stats.highRate}</strong>&apos;i yüksek risk grubunda ({stats.highRisk} bulgu).</>
                ) : (
                  'Kayıtlı bulgu bulunmuyor.'
                )}
              </p>
            </div>
          </header>
          <div className="stats-donut-wrap">
            <div className="stats-chart stats-chart-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.riskData} dataKey="value" innerRadius={62} outerRadius={94} paddingAngle={3} strokeWidth={0}>
                    {stats.riskData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatsTooltip suffix="bulgu" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="stats-donut-center">
                <strong>{stats.totalFindings}</strong>
                <span>bulgu</span>
              </div>
            </div>
            <ul className="stats-risk-legend">
              {stats.riskData.map((item) => (
                <li key={item.name}>
                  <span className="stats-dot" style={{ background: item.color }} />
                  <span className="stats-risk-name">{item.name}</span>
                  <strong>{item.value}</strong>
                  <small>{item.rate}%</small>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="stats-grid stats-grid-triple">
        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">KATEGORİ</span>
              <h2>Rapor türleri</h2>
              <p className="stats-panel-insight">
                {stats.topType ? (
                  <>En sık denetlenen: <strong>{stats.topType.name}</strong> ({stats.topType.value} rapor).</>
                ) : (
                  'Kategori verisi bulunmuyor.'
                )}
              </p>
            </div>
          </header>
          <div className="stats-chart stats-chart-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.typeData} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--redesign-line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8b998f', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={34} tick={{ fill: '#8b998f', fontSize: 11 }} />
                <Tooltip content={<StatsTooltip suffix="rapor" />} cursor={{ fill: 'var(--redesign-soft)' }} />
                <Bar dataKey="value" name="Rapor" radius={[4, 4, 0, 0]} barSize={26}>
                  {stats.typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">HAFTALIK</span>
              <h2>Gün dağılımı</h2>
              <p className="stats-panel-insight">
                {stats.peakDayCount > 0 ? (
                  <>En çok rapor <strong>{stats.peakDayName}</strong> günü ({stats.peakDayCount} rapor) oluşturuldu.</>
                ) : (
                  'Gün dağılımı bulunmuyor.'
                )}
              </p>
            </div>
          </header>
          <div className="stats-chart stats-chart-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--redesign-line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8b998f', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={34} tick={{ fill: '#8b998f', fontSize: 11 }} />
                <Tooltip content={<StatsTooltip suffix="rapor" />} cursor={{ fill: 'var(--redesign-soft)' }} />
                <Bar dataKey="rapor" name="Rapor" fill="#3e8b5d" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">DÖF DURUMU</span>
              <h2>Kapanma performansı</h2>
              <p className="stats-panel-insight">
                {stats.overdue > 0 ? (
                  <><strong>{stats.overdue}</strong> açık aksiyonun termin süresi aşıldı.</>
                ) : (
                  'Termini geçen hiçbir açık aksiyon bulunmuyor.'
                )}
              </p>
            </div>
          </header>
          <div className="stats-status">
            <div className="stats-status-row">
              <div className="stats-status-row-head">
                <span>Giderildi</span>
                <b>{stats.closedFindings}</b>
              </div>
              <div className="stats-bar">
                <span style={{ width: `${stats.closureRate}%`, background: 'linear-gradient(90deg, #23603d, #3e8b5d)' }} />
              </div>
            </div>
            <div className="stats-status-row">
              <div className="stats-status-row-head">
                <span>Açık</span>
                <b>{stats.openFindings}</b>
              </div>
              <div className="stats-bar">
                <span style={{ width: `${stats.openRate}%`, background: 'linear-gradient(90deg, #d8a522, #e6b83f)' }} />
              </div>
            </div>
            <div className={`stats-status-note${stats.overdue > 0 ? '' : ' is-clear'}`}>
              {stats.overdue > 0 ? <Clock size={14} /> : <CheckCircle2 size={14} />}
              {stats.overdue > 0 ? `${stats.overdue} açık DÖF'ün süresi geçti` : 'Süresi geçen açık DÖF yok'}
            </div>
          </div>
        </article>
      </section>

      <section className="stats-grid stats-grid-lists">
        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">
                <MapPin size={11} /> KONUM
              </span>
              <h2>En çok bulgu alan noktalar</h2>
              <p className="stats-panel-insight">
                {stats.topLocations[0] ? (
                  <>En çok bulgu: <strong>{stats.topLocations[0].label}</strong> ({stats.topLocations[0].value} bulgu).</>
                ) : (
                  'Konum bilgisi girilmiş bulgu yok.'
                )}
              </p>
            </div>
          </header>
          <RankList items={stats.topLocations} emptyLabel="Konum bilgisi girilmiş bulgu yok." />
        </article>

        <article className="stats-panel">
          <header className="stats-panel-head">
            <div>
              <span className="stats-panel-kicker">
                <Users size={11} /> SORUMLU
              </span>
              <h2>Sorumlu dağılımı</h2>
              <p className="stats-panel-insight">
                {stats.topResponsible[0] ? (
                  <>En çok aksiyon: <strong>{stats.topResponsible[0].label}</strong> ({stats.topResponsible[0].value} bulgu).</>
                ) : (
                  'Sorumlu ataması yapılmış bulgu yok.'
                )}
              </p>
            </div>
          </header>
          <RankList items={stats.topResponsible} emptyLabel="Sorumlu bilgisi girilmiş bulgu yok." />
        </article>
      </section>
    </div>
  )
}
