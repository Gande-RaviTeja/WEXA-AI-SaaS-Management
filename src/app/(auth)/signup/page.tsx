'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { signupAction, type ActionResult } from '@/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signupAction,
    null,
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start managing your inventory today</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8">
          {state?.message && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Corp"
                className="mt-1"
                error={!!state?.errors?.orgName}
              />
              {state?.errors?.orgName && (
                <p className="mt-1 text-xs text-red-600">{state.errors.orgName[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1"
                error={!!state?.errors?.email}
              />
              {state?.errors?.email && (
                <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="mt-1"
                error={!!state?.errors?.password}
              />
              {state?.errors?.password && (
                <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="mt-1"
                error={!!state?.errors?.confirmPassword}
              />
              {state?.errors?.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{state.errors.confirmPassword[0]}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" loading={isPending}>
              {isPending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
