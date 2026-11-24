import { requireSession } from '@/lib/auth'
import { getOrg } from '@/lib/data/organizations'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireSession()
  const org = await getOrg(session.organizationId)
  if (!org) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage organization preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm currentThreshold={org.defaultLowStockThreshold} />
        </CardContent>
      </Card>
    </div>
  )
}
