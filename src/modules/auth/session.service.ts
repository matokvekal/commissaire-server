import type { Session } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { generateOpaqueToken, sha256Hex } from "../../lib/crypto.js";
import { parseDurationMs } from "../../lib/duration.js";
import { logger } from "../../lib/logger.js";

export interface SessionContext {
  deviceInfo: string | null;
  ipAddress: string | null;
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
}

export async function createSession(
  userId: number,
  context: SessionContext,
): Promise<{ session: Session; refreshToken: string }> {
  const refreshToken = generateOpaqueToken();
  const now = new Date();
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: sha256Hex(refreshToken),
      expiresAt: refreshTokenExpiry(),
      lastUsedAt: now,
      deviceInfo: context.deviceInfo,
      ipAddress: context.ipAddress,
    },
  });
  logger.info({ userId, sessionId: session.id }, "session created");
  return { session, refreshToken };
}

/** Rotates the refresh token in place on the same session row and returns the new token. */
export async function rotateSession(sessionId: number, context: SessionContext): Promise<string> {
  const refreshToken = generateOpaqueToken();
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      refreshTokenHash: sha256Hex(refreshToken),
      expiresAt: refreshTokenExpiry(),
      lastUsedAt: new Date(),
      deviceInfo: context.deviceInfo,
      ipAddress: context.ipAddress,
    },
  });
  logger.info({ sessionId }, "session rotated");
  return refreshToken;
}

/** Hashes the supplied raw refresh token and looks up the (still active) session it belongs to. */
export async function findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: sha256Hex(refreshToken) },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }
  return session;
}

export async function revokeSession(sessionId: number): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  logger.info({ sessionId }, "session revoked");
}

/** Revokes every active session for a user — used by logout-all. */
export async function revokeAllSessions(userId: number): Promise<void> {
  const { count } = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  logger.info({ userId, count }, "all sessions revoked");
}
