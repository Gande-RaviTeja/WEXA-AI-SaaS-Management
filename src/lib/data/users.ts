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

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      organizationId: true,
      createdAt: true,
    },
  })
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
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
