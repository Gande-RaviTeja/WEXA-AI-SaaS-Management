import { describe, it, expect, beforeAll } from 'vitest'
import { SignJWT } from 'jose'

const SESSION_SECRET = process.env.SESSION_SECRET || 'stockflow-super-secret-key-change-in-production-32chars'

async function makeToken(userId: string, organizationId: string, email: string) {
  const secret = new TextEncoder().encode(SESSION_SECRET)
  return new SignJWT({ userId, organizationId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

let isServerRunning = false
try {
  const check = await fetch('http://localhost:3000/login', { signal: AbortSignal.timeout(1000) })
  isServerRunning = check.status < 500
} catch {
  isServerRunning = false
}

describe.runIf(isServerRunning)('M2 Auth & Route Guarding HTTP verification', () => {
  it('redirects unauthenticated /dashboard to /login', async () => {
    const res = await fetch('http://localhost:3000/dashboard', { redirect: 'manual' })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('redirects unauthenticated /settings to /login', async () => {
    const res = await fetch('http://localhost:3000/settings', { redirect: 'manual' })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('redirects unauthenticated /products to /login', async () => {
    const res = await fetch('http://localhost:3000/products', { redirect: 'manual' })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('allows access to /dashboard with valid Acme session cookie', async () => {
    const { prisma } = await import('../src/lib/prisma')
    const acmeUser = await prisma.user.findUnique({
      where: { email: 'alice@acme.com' },
      include: { organization: true },
    })
    expect(acmeUser).not.toBeNull()

    const token = await makeToken(acmeUser!.id, acmeUser!.organizationId, acmeUser!.email)

    const res = await fetch('http://localhost:3000/dashboard', {
      headers: { Cookie: `stockflow-session=${token}` },
    })

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Acme Hardware')
    expect(html).toContain('Total products')
    expect(html).toContain('Low stock items')
    expect(html).toContain('alice@acme.com')
  })

  it('allows access to /products with valid Acme session and isolates tenant data', async () => {
    const { prisma } = await import('../src/lib/prisma')
    const acmeUser = await prisma.user.findUnique({
      where: { email: 'alice@acme.com' },
    })
    const token = await makeToken(acmeUser!.id, acmeUser!.organizationId, acmeUser!.email)

    const res = await fetch('http://localhost:3000/products', {
      headers: { Cookie: `stockflow-session=${token}` },
    })

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Steel Hammer')
    expect(html).toContain('Cordless Drill')
    expect(html).not.toContain('Mechanical Keyboard')
    expect(html).not.toContain('Webcam 1080p')
  })

  it('redirects authenticated user away from /login to /dashboard', async () => {
    const { prisma } = await import('../src/lib/prisma')
    const acmeUser = await prisma.user.findUnique({
      where: { email: 'alice@acme.com' },
    })
    const token = await makeToken(acmeUser!.id, acmeUser!.organizationId, acmeUser!.email)

    const res = await fetch('http://localhost:3000/login', {
      headers: { Cookie: `stockflow-session=${token}` },
      redirect: 'manual',
    })

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/dashboard')
  })
})
