'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, savedTime: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { count, error } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (!error && count !== null) {
            setStats({
                total: count,
                savedTime: count * 2 // Assumption: 2 hours saved per report
            })
        }
      }
      setIsLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Genel Bakış</h1>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Rapor</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
                <>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Oluşturulan toplam rapor</p>
                </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kazanılan Zaman</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
                <>
                    <div className="text-2xl font-bold">{stats.savedTime} Saat</div>
                    <p className="text-xs text-muted-foreground">Rapor başına ort. 2 saat</p>
                </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Hızlı Başlat</CardTitle>
            <Upload className="h-4 w-4 text-primary-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 text-primary-foreground/90">Hemen yeni bir belge yükle veya not al.</p>
            <Button size="sm" variant="secondary" className="w-full" asChild>
                <Link href="/dashboard/upload">Yeni Rapor Oluştur</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Area */}
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-12 text-center min-h-[400px]">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">
            Yeni Rapor Oluştur
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Fotoğrafını çek, ses kaydı al veya notlarını yükle. Yapay zeka senin için profesyonel bir rapor hazırlasın.
          </p>
          <Button asChild>
            <Link href="/dashboard/upload">Başla</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
