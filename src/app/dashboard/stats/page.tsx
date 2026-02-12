'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { TrendingUp, PieChart as PieChartIcon, ArrowRight, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

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
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
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

          const days = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt']
          const dayCounts = typedReports.reduce((acc: CountMap, curr) => {
            const day = days[new Date(curr.created_at).getDay()]
            acc[day] = (acc[day] || 0) + 1
            return acc
          }, {})

          setWeeklyData(days.map((day) => ({ name: day, rapor: dayCounts[day] || 0 })))
        }
      } finally {
        setIsLoading(false)
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
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Istatistikler</h1>
          <p className="text-sm text-muted-foreground mt-1">Rapor olusturduktan sonra burada performans grafikleri gorunecek.</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Henuz veri yok
            </CardTitle>
            <CardDescription>Paneli doldurmak icin once birkac rapor olusturmaniz yeterli.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border p-3 bg-muted/20">1. Yeni rapor ekranina gidin.</div>
              <div className="rounded-lg border p-3 bg-muted/20">2. En az bir farkli rapor turu olusturun.</div>
              <div className="rounded-lg border p-3 bg-muted/20">3. Bu sayfayi yenileyip grafikleri inceleyin.</div>
            </div>
            <Button asChild>
              <Link href="/dashboard/upload">
                Rapor Olusturmaya Basla <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Istatistikler</h1>
        <p className="text-sm text-muted-foreground mt-1">Raporlama aliskanliklariniz ve dagilimlariniz.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Gunluk Rapor Aktivitesi
            </CardTitle>
            <CardDescription>Son 7 gundeki rapor olusturma yogunlugu.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#F3F4F6' }} />
                  <Bar dataKey="rapor" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-green-500" />
              Rapor Turu Dagilimi
            </CardTitle>
            <CardDescription>Hangi tur raporlari daha sik olusturuyorsunuz?</CardDescription>
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

