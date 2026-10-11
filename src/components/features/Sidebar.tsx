'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Upload, Settings, PieChart, LogOut, Bot, HardHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Panel', href: '/dashboard' },
  { icon: HardHat, label: 'İSG Saha Denetimi', href: '/dashboard/isg-denetim' },
  { icon: Upload, label: 'Hızlı Not/Rapor', href: '/dashboard/upload' },
  { icon: FileText, label: 'Raporlarım', href: '/dashboard/reports' },
  { icon: Bot, label: 'Asistanlarım', href: '/dashboard/assistants' },
  { icon: PieChart, label: 'İstatistikler', href: '/dashboard/stats' },
  { icon: Settings, label: 'Ayarlar', href: '/dashboard/settings' },
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
    <div className={cn('pb-12 min-h-screen bg-muted/40 border-r flex flex-col', className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-6 px-4 text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-amber-600 flex items-center justify-center">
                <HardHat className="h-4 w-4 text-white" />
            </div>
            İSG Asistanı
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={cn(
                    "w-full justify-start font-medium",
                    pathname === item.href && "bg-secondary text-foreground shadow-sm"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-4 border-t bg-background/50 backdrop-blur-sm">
        <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={handleLogout}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
      </div>
    </div>
  )
}
