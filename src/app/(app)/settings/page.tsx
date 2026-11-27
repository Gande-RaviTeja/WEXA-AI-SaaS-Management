import { requireSession } from '@/lib/auth'
import { getOrgWithMembers } from '@/lib/data/organizations'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import {
  OrgProfileForm,
  SettingsForm,
  TeamMembersList,
  ChangePasswordForm,
  SecurityCard,
} from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireSession()
  const org = await getOrgWithMembers(session.organizationId)
  if (!org) notFound()

  return (
    <div className="p-8 max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization profile, inventory alert thresholds, team, and security.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Organization Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>
              Your company identity and account identification details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrgProfileForm
              initialName={org.name}
              orgId={org.id}
              createdAt={org.createdAt}
            />
          </CardContent>
        </Card>

        {/* 2. Inventory Alert Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Thresholds & Alerts</CardTitle>
            <CardDescription>
              Configure company-wide stock level triggers and dashboard indicators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm currentThreshold={org.defaultLowStockThreshold} />
          </CardContent>
        </Card>

        {/* 3. Team & Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team & Access</CardTitle>
                <CardDescription>
                  Colleagues authorized to manage inventory for this organization.
                </CardDescription>
              </div>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {org.users.length} {org.users.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <TeamMembersList
              members={org.users}
              currentUserId={session.userId}
            />
          </CardContent>
        </Card>

        {/* 4. Security & Account */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Credentials</CardTitle>
            <CardDescription>
              Update your account password and review active session safeguards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SecurityCard userEmail={session.email} />

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Account Password</h3>
              <ChangePasswordForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
