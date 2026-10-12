'use client'

import { useState, useEffect, useRef } from 'react'
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
  ChevronUp,
  Building2,
  Download,
  Save,
  Command,
  Compass,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react'
import { Sidebar } from '@/components/features/Sidebar'
import { Header } from '@/components/features/Header'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export type DesignMode =
  | 'linear'      // 1. Üst Ada Navigasyon (Linear / Vercel)
  | 'raycast'     // 2. Yüzen İnce Dock (Raycast / Arc)
  | 'studio'      // 3. Belge Odaklı Çalışma Alanı (Notion / Figma)
  | 'island'      // 4. Dynamic Island / Genişleyen Yüzen Kapsül (Apple VisionOS / Cron)
  | 'timeline'    // 5. Kronolojik Saha Yürüyüşü (Feed & Timeline)
  | 'classic'     // 0. Eski Klasik Sol Sidebar

interface ConceptMeta {
  id: DesignMode
  title: string
  subtitle: string
  icon: string
  badge: string
}

export const CONCEPTS: ConceptMeta[] = [
  {
    id: 'raycast',
    title: '1. Yüzen Dock (Raycast / macOS)',
    subtitle: 'Sol veya alt kenarda asılı duran zarif cam ikon docku ve ⌘K arama',
    icon: '🚀',
    badge: 'Aktif ⭐',
  },
  {
    id: 'island',
    title: '2. Dynamic Island (Apple VisionOS)',
    subtitle: 'Sıfır arayüz kirliliği; sadece üstte genişleyen akıllı ada kapsülü',
    icon: '🛸',
    badge: 'Buz Efekti',
  },
  {
    id: 'linear',
    title: '3. Üst Ada (Linear / Vercel)',
    subtitle: 'Sidebar yok, üstte cam efektli ada menü, tam ekran ferahlık',
    icon: '🏝️',
    badge: 'Minimal',
  },
  {
    id: 'studio',
    title: '4. Belge Modu (Studio / Notion)',
    subtitle: 'Üstte minimal breadcrumb, ortada A4 çalışma kağıdı hissi',
    icon: '📐',
    badge: 'Belge',
  },
  {
    id: 'timeline',
    title: '5. Saha Zaman Tüneli (Feed Modeli)',
    subtitle: 'Denetimi saat saat akan bir saha yürüyüşü akışına dönüştürür',
    icon: '⏱️',
    badge: 'Mobil',
  },
  {
    id: 'classic',
    title: 'Eski Klasik Sol Sidebar',
    subtitle: 'Önceki 220px sabit dikey sütunlu geleneksel panel',
    icon: '🏛️',
    badge: 'Önceki',
  },
]

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
  const [mode, setMode] = useState<DesignMode>('raycast')
  const [userName, setUserName] = useState('Kullanıcı')
  const [userInitials, setUserInitials] = useState('K')
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const [isIslandExpanded, setIsIslandExpanded] = useState(false)
  const islandRef = useRef<HTMLDivElement>(null)

  // Dynamic Island dışına tıklandığında veya Esc tuşuna basıldığında pürüzsüzce geri toplanma
  useEffect(() => {
    if (!isIslandExpanded) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setIsIslandExpanded(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsIslandExpanded(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isIslandExpanded])

  useEffect(() => {
    // Kullanıcının "yüzen dock olsun" tercihi doğrultusunda varsayılan dock modu
    const hasDockChoice = localStorage.getItem('isg_dock_choice_set')
    if (!hasDockChoice) {
      setMode('raycast')
      localStorage.setItem('isg_design_mode', 'raycast')
      localStorage.setItem('isg_dock_choice_set', 'true')
      return
    }

    const saved = localStorage.getItem('isg_design_mode') as DesignMode | null
    if (saved && CONCEPTS.some((c) => c.id === saved)) {
      setMode(saved)
    } else {
      setMode('raycast')
    }
  }, [])

  const changeMode = (newMode: DesignMode) => {
    setMode(newMode)
    localStorage.setItem('isg_design_mode', newMode)
    setIsSwitcherOpen(false)
  }

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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

  const currentConcept = CONCEPTS.find((c) => c.id === mode) || CONCEPTS[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-amber-500 selection:text-black">
      {/* ========================================================
          1. LINEAR / VERCEL TOP ISLAND (ÜST ADA MENÜ)
          ======================================================== */}
      {mode === 'linear' && (
        <div className="flex-1 flex flex-col w-full">
          <header className="sticky top-0 z-40 h-16 border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 no-underline text-foreground shrink-0">
              <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
                <HardHat className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight hidden sm:inline-block">
                İSG <strong className="text-amber-600 dark:text-amber-400">SAHA</strong>
              </span>
            </Link>

            <nav className="flex items-center bg-muted/60 border border-border/60 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
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

            <div className="flex items-center gap-3 shrink-0">
              <Button asChild size="sm" className="bg-primary text-primary-foreground font-semibold text-xs h-8 gap-1.5 shadow-sm hidden md:inline-flex">
                <Link href="/dashboard/isg-denetim">
                  <Plus className="h-3.5 w-3.5" /> Yeni Denetim
                </Link>
              </Button>
              <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarFallback className="bg-muted text-[11px] font-bold text-foreground">{userInitials}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-7 w-7 text-muted-foreground hover:text-red-600" title="Çıkış">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      )}

      {/* ========================================================
          1. RAYCAST / ARC YÜZEN SLIM DOCK (ORİJİNAL TASARIM)
          ======================================================== */}
      {mode === 'raycast' && (
        <div className="flex-1 flex w-full relative">
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
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
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
              className="w-10 h-10 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </aside>

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
            <main className="flex-1 max-w-5xl w-full mx-auto">{children}</main>
          </div>
        </div>
      )}

      {/* ========================================================
          3. STUDIO / CANVAS BELGE MODU
          ======================================================== */}
      {mode === 'studio' && (
        <div className="flex-1 flex flex-col w-full bg-muted/20">
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

            <div className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      isActive ? 'bg-background text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
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

          <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto">
            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">{children}</div>
          </main>
        </div>
      )}

      {/* ========================================================
          4. DYNAMIC ISLAND (APPLE VISIONOS FROSTED GLASS / BUZ EFEKTİ)
          ======================================================== */}
      {mode === 'island' && (
        <div className="flex-1 flex flex-col w-full relative pt-20 sm:pt-24 selection:bg-amber-500 selection:text-black">
          {/* Gerçek Cam Kırılması İçin Çok Katmanlı Işık Difüzyon Atmosferi */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[840px] h-[180px] pointer-events-none -z-10 overflow-hidden flex items-center justify-center opacity-75">
            <div className="w-[380px] h-[100px] bg-amber-500/25 blur-[95px] rounded-full" />
            <div className="w-[300px] h-[90px] bg-sky-500/20 blur-[100px] rounded-full -ml-32" />
            <div className="w-[280px] h-[90px] bg-indigo-500/20 blur-[100px] rounded-full -mr-32" />
          </div>

          {/* Floating Glass Dynamic Island */}
          <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div
              ref={islandRef}
              className={`glass-island dynamic-island-morph rounded-full relative overflow-hidden select-none flex items-center justify-center ${
                isIslandExpanded
                  ? 'w-[94vw] sm:w-[780px] lg:w-[840px] h-14 px-3 sm:px-4 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.15)]'
                  : 'w-[340px] sm:w-[410px] h-11 px-3 cursor-pointer hover:border-white/30 hover:scale-[1.01]'
              }`}
              onClick={() => {
                if (!isIslandExpanded) setIsIslandExpanded(true)
              }}
            >
              {/* COMPACT CAPSULE VIEW */}
              <div
                className={`absolute inset-0 px-3.5 flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isIslandExpanded
                    ? 'opacity-0 scale-95 pointer-events-none translate-y-1'
                    : 'opacity-100 scale-100 pointer-events-auto translate-y-0'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black flex items-center justify-center font-black text-[11px] shadow-[0_0_12px_rgba(245,158,11,0.6)] shrink-0">
                    ⚡
                  </div>
                  <span className="font-extrabold tracking-tight text-white/95 text-xs shrink-0">
                    İSG SAHA
                  </span>
                  <span className="text-white/20 text-xs shrink-0">/</span>
                  <span className="text-zinc-200 font-medium text-xs truncate max-w-[105px] sm:max-w-[150px]">
                    {navItems.find((i) => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label || 'Çalışma Alanı'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    asChild
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 px-2.5 text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-sm hidden sm:inline-flex"
                  >
                    <Link href="/dashboard/isg-denetim">
                      <Plus className="h-3 w-3 mr-0.5" /> Denetim
                    </Link>
                  </Button>

                  <div className="h-6 w-6 rounded-full bg-white/12 border border-white/25 flex items-center justify-center text-[10px] font-bold text-amber-300 shadow-inner">
                    {userInitials}
                  </div>

                  <ChevronDown className="h-3.5 w-3.5 text-white/60 transition-colors" />
                </div>
              </div>

              {/* EXPANDED BAR VIEW */}
              <div
                className={`w-full h-full flex items-center justify-between gap-2 sm:gap-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isIslandExpanded
                    ? 'opacity-100 scale-100 pointer-events-auto translate-y-0 delay-100'
                    : 'opacity-0 scale-95 pointer-events-none -translate-y-1'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 shrink-0 no-underline text-white pl-1 group"
                >
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <span className="font-extrabold text-xs tracking-tight hidden md:inline">
                    İSG SAHA
                  </span>
                </Link>

                <nav className="flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none py-1">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                          isActive ? 'glass-pill-active' : 'glass-pill text-zinc-200'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="flex items-center gap-2 shrink-0 pr-1">
                  <Button
                    asChild
                    size="sm"
                    className="h-7 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-sm hidden lg:inline-flex"
                  >
                    <Link href="/dashboard/isg-denetim">
                      <Plus className="h-3 w-3 mr-1" /> Yeni
                    </Link>
                  </Button>

                  <button
                    onClick={() => setIsIslandExpanded(false)}
                    className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center text-xs transition-colors hover:scale-105"
                    title="Daralt (Esc)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Full Page Content Flowing Underneath Floating Frosted Island */}
          <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      )}

      {/* ========================================================
          5. SAHA ZAMAN TÜNELİ (FEED & TIMELINE MODELİ)
          ======================================================== */}
      {mode === 'timeline' && (
        <div className="flex-1 flex flex-col w-full bg-muted/10">
          <header className="sticky top-0 z-40 h-14 bg-background/90 backdrop-blur-xl border-b border-border px-4 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-amber-600" />
              <span className="font-bold text-sm">Denetim Zaman Çizelgesi</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-primary text-primary-foreground font-semibold text-xs h-8">
                <Link href="/dashboard/isg-denetim">+ Adım Ekle</Link>
              </Button>
            </div>
          </header>

          <div className="flex-1 flex max-w-6xl w-full mx-auto p-4 sm:p-6 gap-6">
            <aside aria-label="Denetim Aşamaları" className="w-52 shrink-0 hidden md:flex flex-col gap-3 pt-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Denetim Aşamaları
              </div>
              <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                <div className="relative text-xs font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                  <span>1. Şantiye Künyesi</span>
                </div>
                <div className="relative text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span>2. Fotoğraf & Bulgular</span>
                </div>
                <div className="relative text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span>3. İmza ve Tutanak</span>
                </div>
              </div>
            </aside>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      )}

      {/* ========================================================
          0. KLASİK SOL SIDEBAR (ORİJİNAL DÜZEN)
          ======================================================== */}
      {mode === 'classic' && (
        <div className="dashboard-shell dashboard-workspace grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[252px_1fr]">
          <div className="dashboard-sidebar-frame hidden md:block">
            <Sidebar />
          </div>
          <div className="dashboard-main-column flex flex-col">
            <Header />
            <main className="dashboard-content flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
          </div>
        </div>
      )}

      {/* ========================================================
          PERSISTENT FLOATING CONCEPT SELECTOR
          ======================================================== */}
      <aside aria-label="Tasarım Konsepti Menüsü" className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {isSwitcherOpen && (
          <div className="bg-zinc-950/95 text-zinc-100 border border-zinc-700/90 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl w-[90vw] max-w-sm flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Canlı Tasarım Seçenekleri
              </span>
              <button
                onClick={() => setIsSwitcherOpen(false)}
                className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {CONCEPTS.map((concept) => {
                const isSelected = mode === concept.id
                return (
                  <button
                    key={concept.id}
                    onClick={() => changeMode(concept.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500 text-black shadow-md font-bold'
                        : 'hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{concept.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-white'}`}>
                          {concept.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isSelected
                              ? 'bg-black/20 text-black'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {concept.badge}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${isSelected ? 'text-black/80' : 'text-zinc-400'}`}>
                        {concept.subtitle}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-black mt-1" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
          className="bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 border border-zinc-700/80 hover:border-amber-500/70 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-semibold transition-all group cursor-pointer"
        >
          <span className="text-base group-hover:scale-110 transition-transform">{currentConcept.icon}</span>
          <span className="font-bold text-white">{currentConcept.title}</span>
          <ChevronUp className={`h-3.5 w-3.5 text-amber-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </div>
  )
}
