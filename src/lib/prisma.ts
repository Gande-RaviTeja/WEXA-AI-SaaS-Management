import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function getDatabaseUrl(): string {
  // If in test environment and TEST_DATABASE_URL is set, use it to protect demo/prod data
  if ((process.env.NODE_ENV === 'test' || process.env.VITEST) && process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL
  }
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not defined')
  }
  return url
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl()
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
