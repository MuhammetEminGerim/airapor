'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, Upload, Search, TrendingUp, Zap, ArrowRight, Sparkles } from 'lucide-react'
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
  const [userName, setUserName] = useState('Kullanici')
  const [searchTerm, setSearchTerm] = useState('')

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

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (!profileError) {
          setUserName(profile?.full_name || 'Kullanici')
        }

        const { count, error: countError } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (countError) {
          toast.error('Istatistikler yuklenemedi.')
        } else if (count !== null) {
          setStats({
            total: count,
            savedTime: count * 2,
          })
        }

        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('id, title, type, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8)

        if (reportsError) {
          toast.error('Raporlar yuklenirken bir hata olustu.')
        } else {
          setRecentReports(reports || [])
        }
      } catch {
        toast.error('Panel verileri alinamadi.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return recentReports
    return recentReports.filter((report) => report.title.toLowerCase().includes(normalizedSearch))
  }, [recentReports, searchTerm])

  const isFirstUse = !isLoading && stats.total === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Genel Bakis</h1>
          <p className="text-sm text-muted-foreground">Hos geldiniz, {userName}. Bugunku durumunuz burada.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Son raporlarda ara..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-none">
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" /> Yeni Rapor
            </Link>
          </Button>
        </div>
      </div>

      {isFirstUse ? (
        <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Ilk raporunuz icin hizli baslangic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-background p-3 text-sm">1. Not yazin veya dosya yukleyin.</div>
              <div className="rounded-lg border bg-background p-3 text-sm">2. Rapor turunu secip AI analizini baslatin.</div>
              <div className="rounded-lg border bg-background p-3 text-sm">3. Ciktilari duzenleyip kaydedin ve paylasin.</div>
            </div>
            <Button asChild>
              <Link href="/dashboard/upload">
                Ilk Raporu Olustur <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Rapor</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="h-7 w-16 rounded bg-muted animate-pulse" /> : <div className="text-2xl font-bold">{stats.total}</div>}
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kazanilan Saat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="h-7 w-16 rounded bg-muted animate-pulse" /> : <div className="text-2xl font-bold">{stats.savedTime}</div>}
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm bg-gradient-to-br from-indigo-50 to-background dark:from-indigo-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Verimlilik</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="h-7 w-20 rounded bg-indigo-200/60 dark:bg-indigo-800/40 animate-pulse" /> : <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Yuksek</div>}
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-8 border-border/50 shadow-sm min-h-[350px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Son Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-4 space-y-3">
                <div className="h-12 w-full rounded-lg border bg-muted/40 animate-pulse" />
                <div className="h-12 w-full rounded-lg border bg-muted/40 animate-pulse" />
                <div className="h-12 w-full rounded-lg border bg-muted/40 animate-pulse" />
              </div>
            ) : filteredReports.length > 0 ? (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <Link href="/dashboard/reports" key={report.id} className="block">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.type.toUpperCase()} • {new Date(report.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {report.status || 'Tamamlandi'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>{searchTerm ? 'Aramanizla eslesen rapor bulunamadi.' : 'Henuz rapor olusturmadiniz.'}</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/dashboard/upload">Rapor Olusturmaya Basla</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-4 border-border/50 shadow-sm flex flex-col justify-center items-center text-center p-6 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <div className="h-14 w-14 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Zap className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Hizli Olustur</h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-6 px-2">Fotograf, ses veya metinle hizli rapor akisini baslatin.</p>
          <Button variant="secondary" className="w-full" asChild>
            <Link href="/dashboard/upload">Simdi Basla</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
