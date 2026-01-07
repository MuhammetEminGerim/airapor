'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

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
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Günlük Rapor Aktivitesi</CardTitle>
          <CardDescription>
            Haftanın günlerine göre rapor oluşturma yoğunluğu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rapor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Rapor Türü Dağılımı</CardTitle>
          <CardDescription>
            Oluşturulan raporların türlerine göre oranı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex justify-center">
            {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string, percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center text-muted-foreground h-full">
                    Henüz veri yok
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
