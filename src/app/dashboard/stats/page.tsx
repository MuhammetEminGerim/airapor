'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { TrendingUp, PieChart as PieChartIcon, ArrowRight, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createDevTimer } from '@/lib/dev-timing'

const COLORS = ['#34493c', '#c4a321', '#8b6e52', '#a83a2e']

type WeeklyChartPoint = {
  name: string
  rapor: number
}

type TypeChartPoint = {
  name: string
  value: number
}

type ReportRow = {
  type: string | null
  created_at: string
}

type CountMap = Record<string, number>

export default function StatsPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyChartPoint[]>([])
  const [typeData, setTypeData] = useState<TypeChartPoint[]>([])
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

        const { data: reports } = await supabase
          .from('reports')
          .select('type, created_at')
          .eq('user_id', user.id)

        if (reports) {
          const typedReports = reports as ReportRow[]

          const typeCounts = typedReports.reduce((acc: CountMap, curr) => {
            const type = curr.type || 'Bilinmeyen'
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {})

          setTypeData(Object.keys(typeCounts).map((key) => ({ name: key.toUpperCase(), value: typeCounts[key] })))

          const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
          const dayCounts = typedReports.reduce((acc: CountMap, curr) => {
            const day = days[new Date(curr.created_at).getDay()]
            acc[day] = (acc[day] || 0) + 1
            return acc
          }, {})

          setWeeklyData(days.map((day) => ({ name: day, rapor: dayCounts[day] || 0 })))
          timer.mark('stats-ready', { reports: typedReports.length, typeBuckets: Object.keys(typeCounts).length })
        }
      } finally {
        setIsLoading(false)
        timer.end()
      }
    }

    fetchData()
  }, [])

  const totalReports = useMemo(() => typeData.reduce((sum, item) => sum + item.value, 0), [typeData])
  const hasStatsData = totalReports > 0

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 rounded-xl border bg-muted/40 animate-pulse" />
        <div className="h-32 rounded-xl border bg-muted/40 animate-pulse" />
        <div className="h-32 rounded-xl border bg-muted/40 animate-pulse" />
      </div>
    )
  }

  if (!hasStatsData) {
    return (
      <div className="field-page field-stats-page flex flex-col gap-6">
        <div className="field-page-heading">
          <p className="field-page-kicker">SAHA ÖZETİ / 01</p>
          <h1 className="field-page-title">İstatistikler</h1>
          <p className="text-sm text-muted-foreground mt-1">Rapor oluşturdukça çalışma yoğunluğun ve dağılımlar burada görünür.</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-xl">
              <Lightbulb className="h-4 w-4 text-primary" />
              Henüz veri yok
            </CardTitle>
            <CardDescription>Paneli doldurmak için önce birkaç rapor oluşturmanız yeterli.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border p-3 bg-muted/20">1. Yeni rapor ekranına gidin.</div>
              <div className="rounded-lg border p-3 bg-muted/20">2. En az bir farklı rapor türü oluşturun.</div>
              <div className="rounded-lg border p-3 bg-muted/20">3. Bu sayfayı yenileyip grafikleri inceleyin.</div>
            </div>
            <Button asChild className="bg-primary text-primary-foreground font-medium">
              <Link href="/dashboard/isg-denetim">
                Saha Denetimi Başlat <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="field-page field-stats-page flex flex-col gap-6">
      <div className="field-page-heading">
        <p className="field-page-kicker">SAHA ÖZETİ / 01</p>
        <h1 className="field-page-title">İstatistikler</h1>
        <p className="text-sm text-muted-foreground mt-1">Raporlama alışkanlıkların ve saha dosyalarının dağılımı.</p>
      </div>

      <section className="stats-ledger" aria-label="Rapor istatistik özeti">
        <div className="stats-ledger-primary"><span>ARŞİVDEKİ RAPOR</span><strong>{totalReports.toString().padStart(2, '0')}</strong><small>oluşturulan toplam dosya</small></div>
        <div><span>RAPOR TÜRÜ</span><strong>{typeData.length.toString().padStart(2, '0')}</strong><small>farklı çalışma başlığı</small></div>
        <div><span>EN YOĞUN GÜN</span><strong>{weeklyData.reduce((best, day) => day.rapor > best.rapor ? day : best, weeklyData[0] || { name: '—', rapor: 0 }).name}</strong><small>arşivde en sık rapor oluşturduğun gün</small></div>
      </section>

      <div className="field-stats-charts grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Günlük Rapor Aktivitesi
            </CardTitle>
            <CardDescription>Arşivde rapor oluşturduğun günlerin dağılımı.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#747568', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#747568', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '3px', border: '1px solid #d7d0bf', background: '#faf7ef', color: '#262921' }} cursor={{ fill: '#e5e9df' }} />
                  <Bar dataKey="rapor" fill="#34493c" radius={[2, 2, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-green-500" />
              Rapor Türü Dağılımı
            </CardTitle>
            <CardDescription>Hangi tür raporları daha sık oluşturuyorsunuz?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {typeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

