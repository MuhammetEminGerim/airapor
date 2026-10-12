'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HardHat,
  LayoutDashboard,
  FileText,
  PieChart,
  Settings,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Layers,
  ChevronDown,
  Building2,
  Download,
  Save,
  Command,
} from 'lucide-react'
import { Sidebar } from '@/components/features/Sidebar'
import { Header } from '@/components/features/Header'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type DesignMode = 'linear' | 'raycast' | 'studio' | 'classic'

const navItems = [
  { label: 'Genel Bakış', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Saha Denetimi', href: '/dashboard/isg-denetim', icon: HardHat },
  { label: 'Rapor Arşivi', href: '/dashboard/reports', icon: FileText },
  { label: 'İstatistikler', href: '/dashboard/stats', icon: PieChart },
  { label: 'Firma & Ayarlar', href: '/dashboard/settings', icon: Settings },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  // Default to 'linear' (modern top island) as requested, with instant toggle
  const [mode, setMode] = useState<DesignMode>('linear')
  const [userName, setUserName] = useState('Kullanıcı')
  const [userInitials, setUserInitials] = useState('K')

  useEffect(() => {
    const saved = localStorage.getItem('isg_design_mode') as DesignMode | null
    if (saved && ['linear', 'raycast', 'studio', 'classic'].includes(saved)) {
      setMode(saved)
    }
  }, [])

  const changeMode = (newMode: DesignMode) => {
    setMode(newMode)
    localStorage.setItem('isg_design_mode', newMode)
  }

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const name = data?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
      setUserName(name)
      setUserInitials(
        name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part: string) => part[0])
          .join('')
          .toLocaleUpperCase('tr-TR')
      )
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-amber-500 selection:text-black">
      {/* ========================================================
          MODE 1: LINEAR / VERCEL TOP ISLAND (HERO CANVAS - NO SIDEBAR)
          ======================================================== */}
      {mode === 'linear' && (
        <div className="flex-1 flex flex-col w-full">
          {/* Glass Top Island Navbar */}
          <header className="sticky top-0 z-40 h-16 border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4">
            {/* Brand */}
            <Link href="/dashboard" className="flex items-center gap-2.5 no-underline text-foreground shrink-0">
              <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
                <HardHat className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight hidden sm:inline-block">
                İSG <strong className="text-amber-600 dark:text-amber-400">SAHA</strong>
              </span>
            </Link>

            {/* Clean Center Navigation Tabs */}
            <nav className="flex items-center bg-muted/60 border border-border/60 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right Quick Actions & Profile */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground font-semibold text-xs h-8 gap-1.5 shadow-sm hidden md:inline-flex"
              >
                <Link href="/dashboard/isg-denetim">
                  <Plus className="h-3.5 w-3.5" /> Yeni Denetim
                </Link>
              </Button>

              <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarFallback className="bg-muted text-[11px] font-bold text-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-7 w-7 text-muted-foreground hover:text-red-600"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Full Width Breathable Canvas */}
          <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      )}

      {/* ========================================================
          MODE 2: RAYCAST / ARC YÜZEN SLIM DOCK (FLOATING RAIL)
          ======================================================== */}
      {mode === 'raycast' && (
        <div className="flex-1 flex w-full relative">
          {/* Floating Pill Dock on the Left */}
          <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-card/85 backdrop-blur-2xl border border-border/80 rounded-2xl p-2 flex flex-col gap-2 shadow-2xl shadow-black/20">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 mb-1"
              title="İSG Saha"
            >
              <HardHat className="h-5 w-5" />
            </Link>

            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              )
            })}

            <div className="h-px bg-border/60 mx-1 my-1" />

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-500/10 flex items-center justify-center transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </aside>

          {/* Main Area with Raycast Top Header */}
          <div className="flex-1 flex flex-col w-full pl-20 sm:pl-24 pr-4 sm:pr-8 py-4 sm:py-6">
            <header className="h-12 flex items-center justify-between gap-4 border-b border-border/60 pb-3 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                <span>İSG SAHA</span>
                <span>/</span>
                <span className="text-foreground font-bold">
                  {navItems.find((i) => pathname === i.href)?.label || 'Çalışma Alanı'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-muted/60 border border-border/80 px-3 py-1.5 rounded-full text-xs text-muted-foreground w-64 shadow-inner">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Hızlı arama...</span>
                <kbd className="ml-auto text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-foreground font-semibold">
                  ⌘K
                </kbd>
              </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 3: STUDIO / CANVAS BELGE MERKEZLİ (FIGMA / NOTION TARZI)
          ======================================================== */}
      {mode === 'studio' && (
        <div className="flex-1 flex flex-col w-full bg-muted/20">
          {/* Top Studio Toolbar */}
          <header className="sticky top-0 z-40 h-12 bg-background/90 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="font-extrabold text-foreground flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs">⚡</span>
                <span>İSG Stüdyo</span>
              </Link>
              <span className="text-border">/</span>
              <div className="flex items-center gap-1.5 font-semibold text-foreground bg-muted/70 px-2.5 py-1 rounded-md border border-border">
                <span>{navItems.find((i) => pathname === i.href)?.label || 'Denetim Belgesi'}</span>
              </div>
            </div>

            {/* Horizontal Navigator */}
            <div className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-7 text-xs font-medium">
                <Link href="/dashboard/reports">Arşiv</Link>
              </Button>
              <Button asChild size="sm" className="h-7 text-xs font-semibold bg-primary text-primary-foreground">
                <Link href="/dashboard/isg-denetim">+ Yeni Rapor</Link>
              </Button>
            </div>
          </header>

          {/* Paper Document Canvas Wrapper */}
          <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto">
            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              {children}
            </div>
          </main>
        </div>
      )}

      {/* ========================================================
          MODE 0: KLASİK SIDEBAR (ESKİ TASARIMLA ANINDA KIYASLAMA)
          ======================================================== */}
      {mode === 'classic' && (
        <div className="dashboard-shell dashboard-workspace grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[252px_1fr]">
          <div className="dashboard-sidebar-frame hidden md:block">
            <Sidebar />
          </div>
          <div className="dashboard-main-column flex flex-col">
            <Header />
            <main className="dashboard-content flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* ========================================================
          PERSISTENT FLOATING DESIGN SWITCHER (CANLI GEÇİŞ ÇUBUĞU)
          ======================================================== */}
      <aside
        aria-label="Tasarım Konsept Değiştirici"
        className="fixed bottom-5 right-5 z-50 bg-zinc-950/95 text-zinc-100 border border-zinc-700/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-2 flex-wrap"
      >
        <span className="text-[11px] font-bold text-amber-400 pl-2 hidden sm:inline-block flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Gerçek Proje Tasarım Modu:
        </span>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => changeMode('linear')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'linear'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Linear / Vercel Tarzı Üst Ada Menü (Sidebar yok, tam ekran)"
          >
            <span>🏝️</span>
            <span className="hidden md:inline">1. Üst Ada (Linear)</span>
          </button>

          <button
            onClick={() => changeMode('raycast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'raycast'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Raycast / Arc Tarzı Yüzen İnce İkon Dock"
          >
            <span>🚀</span>
            <span className="hidden md:inline">2. Yüzen Dock (Raycast)</span>
          </button>

          <button
            onClick={() => changeMode('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'studio'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Studio / Belge Odaklı Çalışma Masası"
          >
            <span>📐</span>
            <span className="hidden md:inline">3. Belge Modu (Studio)</span>
          </button>

          <button
            onClick={() => changeMode('classic')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              mode === 'classic'
                ? 'bg-zinc-200 text-black font-extrabold'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Eski klasik sol sidebar düzeni"
          >
            <span>🏛️</span>
            <span className="hidden lg:inline">Eski Klasik</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
