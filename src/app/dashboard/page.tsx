'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, Upload, Loader2, Search, TrendingUp, Zap, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface DashboardReport {
  id: string
  title: string
  type: string
  created_at: string
  status: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, savedTime: 0 })
  const [recentReports, setRecentReports] = useState<DashboardReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // Get user name for greeting
            const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
            if (profileError) console.error('Error fetching profile:', profileError)
            setUserName(profile?.full_name || 'Kullanıcı')

            // Get Stats
            const { count, error: countError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

            if (countError) {
                console.error('Error fetching count:', countError)
            } else if (count !== null) {
                setStats({
                    total: count,
                    savedTime: count * 2 // Assumption: 2 hours saved per report
                })
            }

            // Get Recent Reports
            const { data: reports, error: reportsError } = await supabase
                .from('reports')
                .select('id, title, type, created_at, status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (reportsError) {
                console.error('Error fetching reports:', reportsError)
                toast.error('Raporlar yüklenirken bir hata oluştu.')
            } else if (reports) {
                setRecentReports(reports)
            }
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Genel Bakış</h1>
            <p className="text-sm text-muted-foreground">Hoş geldiniz, {userName}. İşte bugünkü durumunuz.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rapor ara..." className="pl-9 w-64 bg-background" />
            </div>
            <Button asChild className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-none">
                <Link href="/dashboard/upload">
                    <Upload className="mr-2 h-4 w-4" /> Yeni Rapor
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Stats Cards */}
        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Rapor</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                    <>
                        <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tüm zamanlar</p>
                    </>
                )}
            </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Kazanılan Saat</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                    <>
                        <div className="text-2xl font-bold text-foreground">{stats.savedTime}</div>
                        <p className="text-xs text-muted-foreground mt-1">Manuel yazmaya kıyasla</p>
                    </>
                )}
            </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm bg-gradient-to-br from-indigo-50 to-background dark:from-indigo-950/20 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Verimlilik</CardTitle>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                    <>
                        <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Yüksek</div>
                        <p className="text-xs text-indigo-600/60 dark:text-indigo-400/60 mt-1">AI ile hızlandırıldı</p>
                    </>
                )}
            </CardContent>
        </Card>

        {/* Main Content Area - Recent Reports */}
        <Card className="col-span-12 md:col-span-8 border-border/50 shadow-sm min-h-[350px]">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Son Raporlar</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : recentReports.length > 0 ? (
                    <div className="space-y-4">
                        {recentReports.map((report) => (
                            <Link href="/dashboard/reports" key={report.id} className="block">
                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center group-hover:bg-background transition-colors border border-transparent group-hover:border-border">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-none mb-1">{report.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {report.type.toUpperCase()} • {new Date(report.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                            {report.status || 'Tamamlandı'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Henüz rapor oluşturmadınız.</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/dashboard/upload">İlk raporunu oluştur</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Quick Action Card */}
        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm flex flex-col justify-center items-center text-center p-6 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
             <div className="h-14 w-14 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Zap className="h-7 w-7" />
             </div>
             <h3 className="font-semibold text-lg mb-2">Hızlı Oluştur</h3>
             <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-6 px-4">
                Fotoğrafını çek, sesini kaydet veya dosyanı yükle. AI anında raporlasın.
             </p>
             <Button variant="secondary" className="w-full" asChild>
                <Link href="/dashboard/upload">Şimdi Başla</Link>
             </Button>
        </Card>
      </div>
    </div>
  )
}
