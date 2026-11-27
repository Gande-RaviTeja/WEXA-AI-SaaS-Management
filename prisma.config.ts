import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const databaseUrl =
  process.env.PRISMA_TARGET_ENV === 'test' && process.env.TEST_DATABASE_URL
    ? env('TEST_DATABASE_URL')
    : env('DATABASE_URL')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
})
