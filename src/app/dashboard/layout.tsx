import { Sidebar } from '@/components/features/Sidebar'
import { Header } from '@/components/features/Header'
import { DashboardContentTransition } from '@/components/features/dashboard-content-transition'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-shell dashboard-workspace grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[252px_1fr]">
      <div className="dashboard-sidebar-frame hidden md:block">
        <Sidebar />
      </div>
      <div className="dashboard-main-column flex flex-col">
        <Header />
        <main className="dashboard-content flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <DashboardContentTransition>{children}</DashboardContentTransition>
        </main>
      </div>
    </div>
  )
}
