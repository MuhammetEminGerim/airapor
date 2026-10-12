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
  Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  const [userName, setUserName] = useState('Kullanıcı')

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const name = data?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
      setUserName(name)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentLabel =
    navItems.find((i) => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(`${i.href}/`)))
      ?.label || 'Çalışma Alanı'

  return (
    <div className="flex-1 flex w-full min-h-screen relative bg-background text-foreground">
      {/* Expandable Floating Dock */}
      <aside
        aria-label="Yüzen İSG Navigasyon Menüsü"
        className="group/dock fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-card/85 backdrop-blur-2xl border border-border/80 rounded-2xl p-2 flex flex-col gap-2 shadow-2xl shadow-black/20 w-[56px] hover:w-56 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="h-10 rounded-xl bg-amber-600 text-white flex items-center shadow-md shadow-amber-600/30 mb-1 px-2.5 gap-3 overflow-hidden transition-all shrink-0 w-full"
          title="İSG Saha"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <HardHat className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight whitespace-nowrap opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 delay-75">
            İSG SAHA
          </span>
        </Link>

        {/* Navigation Links */}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`h-10 rounded-xl flex items-center transition-all px-2.5 gap-3 overflow-hidden shrink-0 w-full ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
              title={item.label}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 delay-75">
                {item.label}
              </span>
            </Link>
          )
        })}

        <div className="h-px bg-border/60 mx-1 my-1 shrink-0" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="h-10 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-500/10 flex items-center transition-colors cursor-pointer px-2.5 gap-3 overflow-hidden shrink-0 w-full"
          title="Çıkış Yap"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 delay-75">
            Çıkış Yap
          </span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full pl-20 sm:pl-24 pr-4 sm:pr-8 py-4 sm:py-6">
        <header className="h-12 flex items-center justify-between gap-4 border-b border-border/60 pb-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <span>İSG SAHA</span>
            <span>/</span>
            <span className="text-foreground font-bold">{currentLabel}</span>
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
  )
}
