'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Settings, PieChart, LogOut, HardHat, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Genel bakış', href: '/dashboard' },
  { icon: HardHat, label: 'Saha denetimi', href: '/dashboard/isg-denetim' },
  { icon: FileText, label: 'Rapor arşivi', href: '/dashboard/reports' },
  { icon: PieChart, label: 'İstatistikler', href: '/dashboard/stats' },
  { icon: Settings, label: 'Firma & Ayarlar', href: '/dashboard/settings' },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={cn('dashboard-sidebar pb-5 min-h-screen flex flex-col', className)}>
      <div className="flex-1">
        <Link href="/dashboard" className="sidebar-brand flex items-center gap-2 text-inherit no-underline">
          <span className="brand-mark"><HardHat size={17} /></span>
          <span>İSG <strong>SAHA</strong></span>
        </Link>
        <p className="sidebar-section-label">ÇALIŞMA ALANI</p>
        <nav className="space-y-1" aria-label="Panel gezinmesi">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
            return (
              <Button
                key={item.href}
                variant="ghost"
                data-active={isActive}
                className="sidebar-nav-item w-full justify-start gap-3 font-medium"
                asChild
              >
                <Link href={item.href} aria-current={isActive ? 'page' : undefined}>
                  <item.icon aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>
      </div>
      <div className="sidebar-logout mt-5">
        <div className="mb-3 rounded-sm border border-border bg-background/60 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold"><ClipboardList size={15} /> SAHA DOSYASI</div>
          <p className="mb-0 mt-1 text-[10px] leading-relaxed text-muted-foreground">Denetim notların ve raporların burada düzenli.</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-xs text-muted-foreground hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Çıkış yap
        </Button>
      </div>
    </aside>
  )
}
