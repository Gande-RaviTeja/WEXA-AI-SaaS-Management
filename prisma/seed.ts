import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing data
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // ─── Org 1: Acme Hardware ───────────────────────────────────────────────
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Hardware',
      defaultLowStockThreshold: 5,
    },
  })

  const acmeHash = await bcrypt.hash('password123', 12)
  await prisma.user.createMany({
    data: [
      { email: 'alice@acme.com', passwordHash: acmeHash, organizationId: acme.id },
      { email: 'bob@acme.com',   passwordHash: acmeHash, organizationId: acme.id },
    ],
  })

  await prisma.product.createMany({
    data: [
      {
        organizationId: acme.id,
        name: 'Steel Hammer',
        sku: 'HMR-001',
        description: '16oz claw hammer with fiberglass handle',
        quantity: 42,
        costPrice: 8.5,
        sellingPrice: 15.99,
      },
      {
        organizationId: acme.id,
        name: 'Cordless Drill',
        sku: 'DRL-002',
        description: '18V lithium-ion cordless drill',
        quantity: 3,         // below default threshold → low stock
        costPrice: 45.0,
        sellingPrice: 89.99,
      },
      {
        organizationId: acme.id,
        name: 'PVC Pipe 1in',
        sku: 'PVC-003',
        description: '10ft schedule-40 PVC pipe',
        quantity: 120,
        costPrice: 2.0,
        sellingPrice: 4.5,
      },
      {
        organizationId: acme.id,
        name: 'Electrical Tape',
        sku: 'ELC-004',
        description: 'Black vinyl electrical tape, 60ft',
        quantity: 2,         // below default threshold → low stock
        costPrice: 1.0,
        sellingPrice: 3.49,
      },
      {
        organizationId: acme.id,
        name: 'Work Gloves (L)',
        sku: 'GLV-005',
        description: 'Heavy-duty leather work gloves, Large',
        quantity: 5,         // exactly at threshold → low stock
        lowStockThreshold: 5,
        costPrice: 6.0,
        sellingPrice: 12.99,
      },
      {
        organizationId: acme.id,
        name: 'Safety Goggles',
        sku: 'SAF-006',
        description: 'ANSI Z87.1 rated clear lens goggles',
        quantity: 18,
        costPrice: 3.5,
        sellingPrice: 7.99,
      },
    ],
  })

  // ─── Org 2: Blue Nile Electronics ───────────────────────────────────────
  const bluenile = await prisma.organization.create({
    data: {
      name: 'Blue Nile Electronics',
      defaultLowStockThreshold: 10,
    },
  })

  const bnHash = await bcrypt.hash('password123', 12)
  await prisma.user.createMany({
    data: [
      { email: 'carol@bluenile.com', passwordHash: bnHash, organizationId: bluenile.id },
      { email: 'dave@bluenile.com',  passwordHash: bnHash, organizationId: bluenile.id },
    ],
  })

  // Note: same SKUs as Acme — this is ALLOWED (org-scoped unique constraint)
  await prisma.product.createMany({
    data: [
      {
        organizationId: bluenile.id,
        name: 'USB-C Hub 7-Port',
        sku: 'HMR-001',    // same SKU as Acme's HMR-001 — intentional cross-org test
        description: '7-in-1 USB-C hub with HDMI 4K',
        quantity: 6,
        costPrice: 18.0,
        sellingPrice: 39.99,
      },
      {
        organizationId: bluenile.id,
        name: 'Mechanical Keyboard',
        sku: 'KB-TKL-01',
        description: 'TKL mechanical keyboard, Cherry MX Blue',
        quantity: 4,         // below threshold of 10 → low stock
        costPrice: 55.0,
        sellingPrice: 109.99,
      },
      {
        organizationId: bluenile.id,
        name: 'Wireless Mouse',
        sku: 'MS-WL-02',
        description: '2.4GHz wireless mouse, 1600 DPI',
        quantity: 23,
        costPrice: 12.0,
        sellingPrice: 29.99,
      },
      {
        organizationId: bluenile.id,
        name: '27in Monitor',
        sku: 'MON-27-03',
        description: '27" IPS 1440p monitor, 144Hz',
        quantity: 2,         // below threshold → low stock
        costPrice: 220.0,
        sellingPrice: 379.99,
        lowStockThreshold: 3,
      },
      {
        organizationId: bluenile.id,
        name: 'HDMI Cable 2m',
        sku: 'CBL-HDMI-04',
        description: 'HDMI 2.1 cable, 2 meters',
        quantity: 50,
        costPrice: 3.5,
        sellingPrice: 9.99,
      },
      {
        organizationId: bluenile.id,
        name: 'Webcam 1080p',
        sku: 'CAM-1080-05',
        description: 'Full HD USB webcam with built-in mic',
        quantity: 8,         // below threshold of 10 → low stock
        costPrice: 28.0,
        sellingPrice: 59.99,
      },
    ],
  })

  console.log('✅ Seed complete.')
  console.log('')
  console.log('Demo credentials:')
  console.log('  Acme Hardware      → alice@acme.com / password123')
  console.log('  Blue Nile Elec.    → carol@bluenile.com / password123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
