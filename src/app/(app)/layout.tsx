import { requireSession } from '@/lib/auth'
import { getOrg } from '@/lib/data/organizations'
import { ToastProvider } from '@/components/ui/Toast'
import { SidebarNav } from '@/components/SidebarNav'
import { notFound } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const org = await getOrg(session.organizationId)
  if (!org) notFound()

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarNav orgName={org.name} userEmail={session.email} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
