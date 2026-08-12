import type { AuthProviderType, User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export async function findUserByIdentity(
  provider: AuthProviderType,
  providerUserId: string,
): Promise<User | null> {
  const identity = await prisma.authIdentity.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
  });
  if (!identity) return null;
  return prisma.user.findUnique({ where: { id: identity.userId } });
}

export function createUserWithIdentity(input: {
  provider: AuthProviderType;
  providerUserId: string;
  email: string | null;
  phone: string | null;
}): Promise<User> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { lastLoginAt: new Date() },
    });
    await tx.authIdentity.create({
      data: {
        userId: user.id,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email,
        phone: input.phone,
        lastUsedAt: new Date(),
      },
    });
    return user;
  });
}

export function touchLastLogin(userId: number): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export function touchIdentityLastUsed(provider: AuthProviderType, providerUserId: string) {
  return prisma.authIdentity.update({
    where: { provider_providerUserId: { provider, providerUserId } },
    data: { lastUsedAt: new Date() },
  });
}

/** True when required profile fields are missing. emergencyPhone is intentionally excluded. */
export function needsProfile(user: User): boolean {
  return !user.firstName || !user.lastName || !user.nickname;
}

export function updateProfile(
  userId: number,
  input: Partial<Pick<User, "firstName" | "lastName" | "nickname" | "emergencyPhone">>,
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data: input });
}

export function findUserById(userId: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}
