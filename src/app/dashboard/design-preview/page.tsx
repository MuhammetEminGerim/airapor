'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Upload, TrendingUp, MoreHorizontal, ArrowUpRight, Zap, CheckCircle2, Search } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Dummy Data
const stats = { total: 124, savedTime: 248, efficiency: "+12%" }
const recentReports = [
    { id: 1, title: 'Q3 Finansal Analiz', type: 'Finans', date: 'Bugün, 14:30', status: 'Tamamlandı' },
    { id: 2, title: 'Şantiye Denetim Raporu', type: 'İSG', date: 'Dün, 09:15', status: 'Tamamlandı' },
    { id: 3, title: 'Pazarlama Stratejisi', type: 'Genel', date: '2 Gün Önce', status: 'İşleniyor' },
]

export default function DesignPreviewPage() {
  return (
    <div className="p-4 md:p-8 min-h-screen bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tasarım Önizleme</h1>
        <p className="text-muted-foreground">Projemiz için en uygun stili seçmek adına hazırlanan 3 farklı konsept.</p>
      </div>

      <Tabs defaultValue="bento" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="bento">Konsept A: Modern Bento / SaaS</TabsTrigger>
          <TabsTrigger value="glass">Konsept B: Future AI / Glass</TabsTrigger>
          <TabsTrigger value="soft">Konsept C: Minimalist / Soft</TabsTrigger>
        </TabsList>

        {/* --- CONCEPT A: BENTO GRID --- */}
        <TabsContent value="bento" className="space-y-6">
            <div className="border rounded-xl p-6 bg-gray-50/50 dark:bg-zinc-900/50">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Genel Bakış</h2>
                        <p className="text-sm text-zinc-500">Tüm aktiviteleriniz tek bir bakışta.</p>
                    </div>
                    <div className="flex gap-2">
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input placeholder="Ara..." className="pl-9 w-64 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-9" />
                        </div>
                        <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 h-9 shadow-none">
                            <Upload className="mr-2 h-4 w-4" /> Yeni Rapor
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    {/* Stats Cards - Bento Style */}
                    <Card className="col-span-12 md:col-span-4 border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Toplam Rapor</CardTitle>
                            <FileText className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</div>
                            <p className="text-xs text-zinc-500 mt-1">Geçen aya göre +4%</p>
                        </CardContent>
                    </Card>
                    <Card className="col-span-12 md:col-span-4 border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kazanılan Saat</CardTitle>
                            <Clock className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.savedTime}</div>
                            <p className="text-xs text-zinc-500 mt-1">Manuel yazmaya kıyasla</p>
                        </CardContent>
                    </Card>
                     <Card className="col-span-12 md:col-span-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Verimlilik Artışı</CardTitle>
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.efficiency}</div>
                            <p className="text-xs text-indigo-600/60 dark:text-indigo-400/60 mt-1">Bu hafta rekor seviye</p>
                        </CardContent>
                    </Card>

                    {/* Main Content Area */}
                    <Card className="col-span-12 md:col-span-8 border-zinc-200 dark:border-zinc-800 shadow-sm h-[300px]">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Son Raporlar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentReports.map((report) => (
                                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{report.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{report.type} • {report.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs font-normal border-zinc-300 text-zinc-600">{report.status}</Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Action */}
                    <Card className="col-span-12 md:col-span-4 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center items-center text-center p-6 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                         <div className="h-12 w-12 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Zap className="h-6 w-6" />
                         </div>
                         <h3 className="font-semibold text-lg mb-2">Hızlı Oluştur</h3>
                         <p className="text-sm text-zinc-400 dark:text-zinc-600 mb-6">Fotoğraf çek veya ses kaydı al.</p>
                         <Button variant="secondary" className="w-full">Şimdi Başla</Button>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* --- CONCEPT B: GLASSMORPHISM --- */}
        <TabsContent value="glass" className="space-y-6">
            <div className="border border-white/10 rounded-3xl p-8 bg-zinc-950 text-white relative overflow-hidden min-h-[600px]">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                             <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent mb-2">Dashboard</h2>
                             <p className="text-white/60">Yapay zeka destekli analizleriniz hazır.</p>
                        </div>
                        <Button className="rounded-full bg-white text-black hover:bg-white/90 px-6">
                             <Upload className="mr-2 h-4 w-4" /> Yeni Yükle
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-3xl font-bold mb-1">{stats.total}</div>
                            <div className="text-sm text-white/50">Toplam Rapor</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-3xl font-bold mb-1">{stats.savedTime}</div>
                            <div className="text-sm text-white/50">Saat Tasarruf</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
                             <div className="absolute inset-0 bg-noise opacity-10"></div>
                             <h3 className="font-semibold text-lg mb-1 relative z-10">AI Asistan</h3>
                             <p className="text-sm text-white/70 mb-4 relative z-10">Yeni bir analiz başlatmaya hazır mısın?</p>
                             <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm relative z-10">
                                Başlat
                             </Button>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-6">Son İşlemler</h3>
                        <div className="space-y-4">
                            {recentReports.map((report) => (
                                <div key={report.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-white/10">
                                            <span className="text-xs font-bold">{report.type.substring(0,1)}</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{report.title}</div>
                                            <div className="text-xs text-white/50">{report.date}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{report.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </TabsContent>

        {/* --- CONCEPT C: MINIMALIST / SOFT --- */}
        <TabsContent value="soft" className="space-y-6">
            <div className="rounded-[40px] p-8 bg-[#F8F9FA] text-zinc-800 border-4 border-white shadow-xl min-h-[600px]">
                <div className="max-w-5xl mx-auto">
                    <header className="flex justify-between items-center mb-12">
                        <div>
                             <h2 className="text-3xl font-bold text-zinc-800 tracking-tight">Hoş geldiniz, Emin.</h2>
                             <p className="text-zinc-500 font-medium">Bugün raporlamalarınız harika gidiyor.</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-white shadow-lg shadow-zinc-200/50 flex items-center justify-center">
                            <span className="font-bold text-lg">E</span>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-14 w-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                                <FileText className="h-7 w-7" />
                            </div>
                            <span className="text-4xl font-black text-zinc-800 mb-2">{stats.total}</span>
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Rapor</span>
                        </div>
                        <div className="bg-white rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                             <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                                <Clock className="h-7 w-7" />
                            </div>
                            <span className="text-4xl font-black text-zinc-800 mb-2">{stats.savedTime}</span>
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Saat</span>
                        </div>
                        <div className="bg-zinc-900 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-between group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-white" />
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Yeni Oluştur</h3>
                                <p className="text-white/50 text-sm">Hemen Başla</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold">Son Aktiviteler</h3>
                            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-600">Tümünü Gör</Button>
                        </div>
                        <div className="space-y-6">
                            {recentReports.map((report) => (
                                <div key={report.id} className="flex items-center gap-6 group">
                                    <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-zinc-800 text-lg">{report.title}</h4>
                                        <p className="text-sm text-zinc-400 font-medium">{report.date}</p>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-zinc-50 text-zinc-500 text-sm font-semibold">
                                        {report.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
