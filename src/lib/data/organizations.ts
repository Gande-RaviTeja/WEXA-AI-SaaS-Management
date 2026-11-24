import { prisma } from '../prisma'

export async function getOrg(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
    },
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
