'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type DashboardContentTransitionProps = {
  children: React.ReactNode
}

export function DashboardContentTransition({ children }: DashboardContentTransitionProps) {
  const pathname = usePathname()

  return (
    <div
      key={pathname}
      className={cn(
        'dashboard-route-enter motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none'
      )}
    >
      {children}
    </div>
  )
}
