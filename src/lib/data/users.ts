import { prisma } from '../prisma'

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      organizationId: true,
    },
  })
}

export async function createUserWithOrg(
  email: string,
  passwordHash: string,
  orgName: string,
) {
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: orgName },
    })
    const user = await tx.user.create({
      data: { email, passwordHash, organizationId: org.id },
      select: { id: true, email: true, organizationId: true },
    })
    return { user, org }
  })
}
