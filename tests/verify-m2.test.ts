import { describe, it, expect, beforeAll } from 'vitest'
import { signupAction, loginAction } from '../src/actions/auth'
import { getUserByEmail } from '../src/lib/data/users'
import { prisma } from '../src/lib/prisma'

describe('M2 Auth — Server Actions & Data Layer', () => {
  beforeAll(async () => {
    // Clean up test user if exists
    await prisma.user.deleteMany({ where: { email: { in: ['testauth@example.com', 'baduser@example.com'] } } })
  })

  it('validates invalid email format', async () => {
    const fd = new FormData()
    fd.append('email', 'not-an-email')
    fd.append('password', 'password123')
    fd.append('confirmPassword', 'password123')
    fd.append('orgName', 'Test Corp')

    const res = await signupAction(null, fd)
    expect(res.errors?.email).toBeDefined()
    expect(res.errors?.email?.[0]).toContain('Invalid email')
  })

  it('validates password minimum length (< 8 chars)', async () => {
    const fd = new FormData()
    fd.append('email', 'short@example.com')
    fd.append('password', 'short')
    fd.append('confirmPassword', 'short')
    fd.append('orgName', 'Test Corp')

    const res = await signupAction(null, fd)
    expect(res.errors?.password).toBeDefined()
    expect(res.errors?.password?.[0]).toContain('at least 8 characters')
  })

  it('validates password confirmation mismatch', async () => {
    const fd = new FormData()
    fd.append('email', 'mismatch@example.com')
    fd.append('password', 'password123')
    fd.append('confirmPassword', 'different123')
    fd.append('orgName', 'Test Corp')

    const res = await signupAction(null, fd)
    expect(res.errors?.confirmPassword).toBeDefined()
    expect(res.errors?.confirmPassword?.[0]).toContain('do not match')
  })

  it('rejects login with wrong password', async () => {
    const fd = new FormData()
    fd.append('email', 'alice@acme.com')
    fd.append('password', 'wrongpassword')

    const res = await loginAction(null, fd)
    expect(res.errors?.email).toBeDefined()
    expect(res.errors?.email?.[0]).toContain('Invalid email or password')
  })

  it('rejects login with non-existent email', async () => {
    const fd = new FormData()
    fd.append('email', 'nobody@example.com')
    fd.append('password', 'somepassword')

    const res = await loginAction(null, fd)
    expect(res.errors?.email).toBeDefined()
    expect(res.errors?.email?.[0]).toContain('Invalid email or password')
  })

  it('detects duplicate email on signup', async () => {
    const fd = new FormData()
    fd.append('email', 'alice@acme.com') // already in seed
    fd.append('password', 'password123')
    fd.append('confirmPassword', 'password123')
    fd.append('orgName', 'Duplicate Org')

    const res = await signupAction(null, fd)
    expect(res.errors?.email).toBeDefined()
    expect(res.errors?.email?.[0]).toContain('already exists')
  })
})
