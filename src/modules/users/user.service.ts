import type { AuthProviderType, User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export async function findUserByIdentity(
  provider: AuthProviderType,
  providerUserId: string,
): Promise<User | null> {
  const identity = await prisma.authIdentity.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
    include: { user: true },
  });
  return identity?.user ?? null;
}

export function createUserWithIdentity(input: {
  provider: AuthProviderType;
  providerUserId: string;
  email: string | null;
  phone: string | null;
}): Promise<User> {
  return prisma.user.create({
    data: {
      lastLoginAt: new Date(),
      identities: {
        create: {
          provider: input.provider,
          providerUserId: input.providerUserId,
          email: input.email,
          phone: input.phone,
          lastUsedAt: new Date(),
        },
      },
    },
  });
}

export function touchLastLogin(userId: string): Promise<User> {
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
  userId: string,
  input: Partial<Pick<User, "firstName" | "lastName" | "nickname" | "emergencyPhone">>,
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data: input });
}

export function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}
