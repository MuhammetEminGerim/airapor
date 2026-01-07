'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Upload, Settings, PieChart, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Panel', href: '/dashboard' },
  { icon: Upload, label: 'Yeni Rapor', href: '/dashboard/upload' },
  { icon: FileText, label: 'Raporlarım', href: '/dashboard/reports' },
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
    <div className={cn('pb-12 min-h-screen bg-background flex flex-col', className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Rapor Asistanı
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
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
      <div className="px-3 py-2 border-t">
        <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
      </div>
    </div>
  )
}
