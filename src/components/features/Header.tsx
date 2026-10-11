'use client'

import { useEffect, useState } from 'react'
import { Menu, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'

export function Header() {
  const [userName, setUserName] = useState('Kullanıcı')
  const [userInitials, setUserInitials] = useState('K')

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const name: string = data?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
      setUserName(name)
      setUserInitials(name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR'))
    }

    getUser()
  }, [])

  return (
    <header className="dashboard-topbar sticky top-0 z-30 flex items-center gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="md:hidden" aria-label="Menüyü aç">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Panel gezinmesi</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="hidden items-center gap-2 text-[10px] font-semibold tracking-[.12em] text-muted-foreground sm:flex">
        <MapPin size={14} className="text-primary" /> SAHA ÇALIŞMA ALANI
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-xs font-medium text-muted-foreground md:inline-block">{userName}</span>
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
