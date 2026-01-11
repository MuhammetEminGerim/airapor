'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Loader2, TrendingUp, Calendar, PieChart as PieChartIcon } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function StatsPage() {
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [typeData, setTypeData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: reports } = await supabase
            .from('reports')
            .select('type, created_at')
            .eq('user_id', user.id)

        if (reports) {
            // Process Type Data
            const typeCounts = reports.reduce((acc: any, curr) => {
                const type = curr.type || 'Bilinmeyen'
                acc[type] = (acc[type] || 0) + 1
                return acc
            }, {})
            setTypeData(Object.keys(typeCounts).map(key => ({ name: key.toUpperCase(), value: typeCounts[key] })))

            // Process Weekly Data (Last 7 days simplified)
            const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
            const dayCounts = reports.reduce((acc: any, curr) => {
                const day = days[new Date(curr.created_at).getDay()]
                acc[day] = (acc[day] || 0) + 1
                return acc
            }, {})

            const chartData = days.map(day => ({ name: day, rapor: dayCounts[day] || 0 }))
            setWeeklyData(chartData)
        }
        setIsLoading(false)
    }
    fetchData()
  }, [])

  if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">İstatistikler</h1>
        <p className="text-sm text-muted-foreground mt-1">Raporlama alışkanlıklarınız ve verileriniz.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Günlük Rapor Aktivitesi
                    </CardTitle>
                    <CardDescription>
                        Son 7 gündeki rapor oluşturma yoğunluğu.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  <Bar
                    dataKey="rapor"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-green-500" />
                        Rapor Türü Dağılımı
                    </CardTitle>
                    <CardDescription>
                        Hangi tür raporları daha sık oluşturuyorsunuz?
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex justify-center mt-4">
              {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground h-full gap-2">
                      <PieChartIcon className="h-8 w-8 opacity-20" />
                      <span className="text-sm">Henüz veri yok</span>
                  </div>
              )}
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center gap-4 mt-4">
                {typeData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
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
