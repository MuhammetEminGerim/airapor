'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { ModeToggle } from '@/components/ui/mode-toggle'

export function Header() {
  const [userName, setUserName] = useState('Kullanıcı')
  const [userInitials, setUserInitials] = useState('K')

  useEffect(() => {
    async function getUser() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // Get profile if exists
            const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
            const name = data?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
            setUserName(name)
            setUserInitials(name.substring(0, 2).toUpperCase())
        }
    }
    getUser()
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menüyü Aç</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
           {/* Accessibility fix for SheetContent requiring a Title */}
           <SheetTitle className="sr-only">Navigasyon Menüsü</SheetTitle>
           <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
            <span className="text-sm text-muted-foreground hidden md:inline-block">{userName}</span>
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
        </div>
      </div>
    </header>
  )
}
