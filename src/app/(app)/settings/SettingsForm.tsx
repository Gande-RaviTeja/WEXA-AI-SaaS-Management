'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  updateSettingsAction,
  updateOrgNameAction,
  changePasswordAction,
  type SettingsActionResult,
} from '@/actions/settings'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

// ─── 1. Organization Profile Form ───────────────────────────────────────────
interface OrgProfileFormProps {
  initialName: string
  orgId: string
  createdAt: Date
}

export function OrgProfileForm({ initialName, orgId, createdAt }: OrgProfileFormProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [state, formAction, isPending] = useActionState<SettingsActionResult | null, FormData>(
    updateOrgNameAction,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      toast('Organization name updated', 'success')
    } else if (state?.message && !state?.success) {
      toast(state.message, 'error')
    }
  }, [state, toast])

  const copyOrgId = () => {
    navigator.clipboard.writeText(orgId)
    setCopied(true)
    toast('Organization ID copied to clipboard', 'info')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Company / Organization name</Label>
        <div className="mt-1 flex max-w-md items-center gap-2">
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={initialName}
            required
            error={!!state?.errors?.name}
            className="flex-1"
          />
          <Button type="submit" size="sm" loading={isPending}>
            {isPending ? 'Saving…' : 'Update name'}
          </Button>
        </div>
        {state?.errors?.name && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Organization ID:</span>
          <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-gray-700 font-medium">
            {orgId}
          </code>
          <button
            type="button"
            onClick={copyOrgId}
            className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div>
          Created: {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </form>
  )
}

// ─── 2. Inventory Threshold Form ────────────────────────────────────────────
interface SettingsFormProps {
  currentThreshold: number
}

export function SettingsForm({ currentThreshold }: SettingsFormProps) {
  const { toast } = useToast()
  const [threshold, setThreshold] = useState(currentThreshold)
  const [state, formAction, isPending] = useActionState<SettingsActionResult | null, FormData>(
    updateSettingsAction,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      toast('Inventory thresholds saved', 'success')
    } else if (state?.message && !state?.success) {
      toast(state.message, 'error')
    }
  }, [state, toast])

  const presets = [3, 5, 10, 15, 20]

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="defaultLowStockThreshold">Default low-stock warning threshold</Label>
        <div className="mt-2 flex items-center gap-3">
          <Input
            id="defaultLowStockThreshold"
            name="defaultLowStockThreshold"
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            error={!!state?.errors?.defaultLowStockThreshold}
            className="w-28 text-center font-bold"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 mr-1 font-medium">Quick presets:</span>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setThreshold(preset)}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  threshold === preset
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2.5 text-xs text-gray-500 leading-relaxed max-w-lg">
          Products with quantity at or below this number automatically trigger <strong>Low stock</strong> alerts across the dashboard and inventory catalog. Individual products can still specify their own threshold overrides.
        </p>
        {state?.errors?.defaultLowStockThreshold && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            {state.errors.defaultLowStockThreshold[0]}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Saving…' : 'Save threshold'}
        </Button>
      </div>
    </form>
  )
}

// ─── 3. Change Password Form ────────────────────────────────────────────────
export function ChangePasswordForm() {
  const { toast } = useToast()
  const [state, formAction, isPending] = useActionState<SettingsActionResult | null, FormData>(
    changePasswordAction,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      toast('Password changed successfully', 'success')
    } else if (state?.message && !state?.success) {
      toast(state.message, 'error')
    }
  }, [state, toast])

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          error={!!state?.errors?.currentPassword}
          className="mt-1"
        />
        {state?.errors?.currentPassword && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            {state.errors.currentPassword[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          error={!!state?.errors?.newPassword}
          className="mt-1"
        />
        <p className="mt-1 text-[11px] text-gray-400">Must be at least 8 characters</p>
        {state?.errors?.newPassword && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            {state.errors.newPassword[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          error={!!state?.errors?.confirmPassword}
          className="mt-1"
        />
        {state?.errors?.confirmPassword && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" size="sm" loading={isPending}>
          {isPending ? 'Updating…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}

// ─── 4. Team Members List ───────────────────────────────────────────────────
interface Member {
  id: string
  email: string
  createdAt: Date
}

export function TeamMembersList({
  members,
  currentUserId,
}: {
  members: Member[]
  currentUserId: string
}) {
  return (
    <div className="space-y-3">
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 overflow-hidden bg-gray-50/50">
        {members.map((member, index) => {
          const isCurrentUser = member.id === currentUserId
          const initials = member.email.slice(0, 2).toUpperCase()

          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {member.email}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 text-[10px]">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  {index === 0 ? 'Account Owner' : 'Team Member'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">
        Team accounts are scoped exclusively to this organization. Members cannot view or interact with other companies.
      </p>
    </div>
  )
}

// ─── 5. Security & Session Card ─────────────────────────────────────────────
export function SecurityCard({ userEmail }: { userEmail: string }) {
  return (
    <div className="space-y-4 text-xs text-gray-600">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-900 mb-1">Authenticated Account</p>
          <p className="text-gray-500">{userEmail}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-900 mb-1">Session Protocol</p>
          <p className="text-gray-500">JWT (HS256) &bull; HTTP-Only Cookie</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-900 mb-1">Session Duration</p>
          <p className="text-gray-500">7 Days Sliding Expiration</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="font-semibold text-gray-900 mb-1">Multi-Tenant Guard</p>
          <p className="text-emerald-700 font-medium">Active &bull; Server-Enforced</p>
        </div>
      </div>
    </div>
  )
}
