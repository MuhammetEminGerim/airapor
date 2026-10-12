import { DashboardShell } from '@/components/features/dashboard-shell'
import { DashboardContentTransition } from '@/components/features/dashboard-content-transition'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardShell>
      <DashboardContentTransition>{children}</DashboardContentTransition>
    </DashboardShell>
  )
}
