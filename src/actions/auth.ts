'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { signupSchema, loginSchema } from '@/lib/validators/auth'
import { getUserByEmail, createUserWithOrg } from '@/lib/data/users'
import { createSession } from '@/lib/auth'

export type ActionResult = {
  errors?: Record<string, string[]>
  message?: string
}

export async function signupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    orgName: formData.get('orgName'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password, orgName } = parsed.data

  const existing = await getUserByEmail(email)
  if (existing) {
    return { errors: { email: ['An account with this email already exists'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const { user, org } = await createUserWithOrg(email, passwordHash, orgName)
    await createSession({ userId: user.id, organizationId: org.id, email: user.email })
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  redirect('/dashboard')
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const user = await getUserByEmail(email)
  if (!user) {
    return { errors: { email: ['Invalid email or password'] } }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { errors: { email: ['Invalid email or password'] } }
  }

  await createSession({
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
  })

  redirect('/dashboard')
}
