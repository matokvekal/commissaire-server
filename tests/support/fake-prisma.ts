import { randomUUID } from "node:crypto";

// A minimal in-memory stand-in for the slice of PrismaClient our services call. Real business
// logic (hashing, expiry, attempt counting, rotation, revocation) lives in the service files and
// runs for real against this store — only the DB itself is faked, not the logic under test.

type Role = "RIDER" | "COMMISSAIRE";
type AuthProviderType = "GOOGLE" | "SMS" | "EMAIL_PASSWORD";

interface UserRow {
  id: string;
  role: Role;
  isActive: boolean;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  emergencyPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

interface AuthIdentityRow {
  id: string;
  userId: string;
  provider: AuthProviderType;
  providerUserId: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
}

interface SessionRow {
  id: string;
  userId: string;
  refreshTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  deviceInfo: string | null;
  ipAddress: string | null;
}

interface OtpChallengeRow {
  id: string;
  phone: string;
  codeHash: string;
  attemptCount: number;
  maxAttempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  requestIp: string | null;
}

const users = new Map<string, UserRow>();
const identities = new Map<string, AuthIdentityRow>(); // key: `${provider}:${providerUserId}`
const sessions = new Map<string, SessionRow>();
const otpChallenges = new Map<string, OtpChallengeRow>();

function identityKey(provider: string, providerUserId: string) {
  return `${provider}:${providerUserId}`;
}

export const fakePrisma = {
  user: {
    async create({
      data,
    }: {
      data: Partial<UserRow> & { identities?: { create: Partial<AuthIdentityRow> } };
    }) {
      const id = randomUUID();
      const now = new Date();
      const user: UserRow = {
        id,
        role: data.role ?? "RIDER",
        isActive: data.isActive ?? true,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        nickname: data.nickname ?? null,
        emergencyPhone: data.emergencyPhone ?? null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: data.lastLoginAt ?? null,
      };
      users.set(id, user);

      if (data.identities?.create) {
        const idData = data.identities.create;
        const identity: AuthIdentityRow = {
          id: randomUUID(),
          userId: id,
          provider: idData.provider as AuthProviderType,
          providerUserId: idData.providerUserId as string,
          email: idData.email ?? null,
          phone: idData.phone ?? null,
          passwordHash: idData.passwordHash ?? null,
          verifiedAt: idData.verifiedAt ?? null,
          createdAt: now,
          updatedAt: now,
          lastUsedAt: idData.lastUsedAt ?? null,
        };
        identities.set(identityKey(identity.provider, identity.providerUserId), identity);
      }
      return user;
    },
    async update({ where, data }: { where: { id: string }; data: Partial<UserRow> }) {
      const user = users.get(where.id);
      if (!user) throw new Error("User not found");
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    },
    async findUnique({ where }: { where: { id: string } }) {
      return users.get(where.id) ?? null;
    },
    async findUniqueOrThrow({ where }: { where: { id: string } }) {
      const user = users.get(where.id);
      if (!user) throw new Error("User not found");
      return user;
    },
  },
  authIdentity: {
    async findUnique({
      where,
      include,
    }: {
      where: { provider_providerUserId: { provider: AuthProviderType; providerUserId: string } };
      include?: { user?: boolean };
    }) {
      const key = identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId,
      );
      const identity = identities.get(key);
      if (!identity) return null;
      if (include?.user) {
        return { ...identity, user: users.get(identity.userId) ?? null };
      }
      return identity;
    },
    async update({
      where,
      data,
    }: {
      where: { provider_providerUserId: { provider: AuthProviderType; providerUserId: string } };
      data: Partial<AuthIdentityRow>;
    }) {
      const key = identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId,
      );
      const identity = identities.get(key);
      if (!identity) throw new Error("Identity not found");
      Object.assign(identity, data, { updatedAt: new Date() });
      return identity;
    },
  },
  session: {
    async create({
      data,
    }: {
      data: Pick<SessionRow, "id" | "userId" | "refreshTokenHash" | "expiresAt"> &
        Partial<Pick<SessionRow, "lastUsedAt" | "deviceInfo" | "ipAddress">>;
    }) {
      const session: SessionRow = {
        id: data.id,
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        createdAt: new Date(),
        expiresAt: data.expiresAt,
        revokedAt: null,
        lastUsedAt: data.lastUsedAt ?? null,
        deviceInfo: data.deviceInfo ?? null,
        ipAddress: data.ipAddress ?? null,
      };
      sessions.set(session.id, session);
      return session;
    },
    async update({ where, data }: { where: { id: string }; data: Partial<SessionRow> }) {
      const session = sessions.get(where.id);
      if (!session) throw new Error("Session not found");
      Object.assign(session, data);
      return session;
    },
    async updateMany({
      where,
      data,
    }: {
      where: { id?: string; userId?: string; revokedAt?: null };
      data: Partial<SessionRow>;
    }) {
      const candidates =
        where.id !== undefined
          ? ([sessions.get(where.id)].filter(Boolean) as SessionRow[])
          : [...sessions.values()].filter((s) => s.userId === where.userId);
      let count = 0;
      for (const session of candidates) {
        if ("revokedAt" in where && where.revokedAt === null && session.revokedAt !== null) {
          continue;
        }
        Object.assign(session, data);
        count++;
      }
      return { count };
    },
    async findUnique({ where }: { where: { id?: string; refreshTokenHash?: string } }) {
      if (where.id !== undefined) return sessions.get(where.id) ?? null;
      if (where.refreshTokenHash !== undefined) {
        return (
          [...sessions.values()].find((s) => s.refreshTokenHash === where.refreshTokenHash) ?? null
        );
      }
      return null;
    },
  },
  otpChallenge: {
    async create({
      data,
    }: {
      data: Pick<OtpChallengeRow, "id" | "phone" | "codeHash" | "expiresAt"> &
        Partial<Pick<OtpChallengeRow, "maxAttempts" | "requestIp">>;
    }) {
      const challenge: OtpChallengeRow = {
        id: data.id,
        phone: data.phone,
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
        consumedAt: null,
        attemptCount: 0,
        maxAttempts: data.maxAttempts ?? 5,
        createdAt: new Date(),
        requestIp: data.requestIp ?? null,
      };
      otpChallenges.set(challenge.id, challenge);
      return challenge;
    },
    async update({
      where,
      data,
    }: {
      where: { id: string };
      data: { attemptCount?: { increment: number } } & Partial<Pick<OtpChallengeRow, "consumedAt">>;
    }) {
      const challenge = otpChallenges.get(where.id);
      if (!challenge) throw new Error("Challenge not found");
      if (data.attemptCount?.increment) {
        challenge.attemptCount += data.attemptCount.increment;
      }
      if ("consumedAt" in data) challenge.consumedAt = data.consumedAt ?? null;
      return challenge;
    },
    async findUnique({ where }: { where: { id: string } }) {
      return otpChallenges.get(where.id) ?? null;
    },
    async count({ where }: { where: { phone: string; createdAt: { gte: Date } } }) {
      return [...otpChallenges.values()].filter(
        (c) => c.phone === where.phone && c.createdAt >= where.createdAt.gte,
      ).length;
    },
    async findFirst({
      where,
    }: {
      where: { phone: string; createdAt: { gte: Date } };
      orderBy?: { createdAt: "asc" | "desc" };
    }) {
      const matches = [...otpChallenges.values()]
        .filter((c) => c.phone === where.phone && c.createdAt >= where.createdAt.gte)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return matches[0] ?? null;
    },
  },
};

export function resetFakePrisma() {
  users.clear();
  identities.clear();
  sessions.clear();
  otpChallenges.clear();
}
