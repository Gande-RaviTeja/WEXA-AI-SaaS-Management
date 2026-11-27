import { prisma } from '../prisma'

export async function getOrg(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
      createdAt: true,
    },
  })
}

export async function getOrgWithMembers(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
      createdAt: true,
      users: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          products: true,
          users: true,
        },
      },
    },
  })
}

export async function updateOrgName(organizationId: string, name: string) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: { name },
    select: { id: true, name: true, defaultLowStockThreshold: true },
  })
}

export async function updateOrgThreshold(
  organizationId: string,
  threshold: number,
) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: { defaultLowStockThreshold: threshold },
    select: { id: true, name: true, defaultLowStockThreshold: true },
  })
}
