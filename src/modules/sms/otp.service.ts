import { randomUUID } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../lib/api-error.js";
import { generateOtpCode, sha256Hex } from "../../lib/crypto.js";
import {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "./otp.constants.js";
import { normalizePhoneE164 } from "./phone.js";
import { getSmsProvider } from "./sms-provider.js";

function hashOtp(challengeId: string, code: string): string {
  return sha256Hex(`${challengeId}:${code}`);
}

export async function requestOtp(
  rawPhone: string,
  requestIp: string | null,
): Promise<{ challengeId: string }> {
  const phone = normalizePhoneE164(rawPhone);
  if (!phone) {
    throw new ApiError(400, "Phone number must be in E.164 format, e.g. +15551234567");
  }

  const now = new Date();

  const requestsInLastHour = await prisma.otpChallenge.count({
    where: { phone, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
  });
  if (requestsInLastHour >= OTP_MAX_REQUESTS_PER_HOUR) {
    throw new ApiError(429, "Too many OTP requests for this phone number — try again later");
  }

  const recentChallenge = await prisma.otpChallenge.findFirst({
    where: {
      phone,
      createdAt: { gte: new Date(now.getTime() - OTP_RESEND_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentChallenge) {
    throw new ApiError(429, "Please wait before requesting another code");
  }

  const challengeId = randomUUID();
  const code = generateOtpCode();

  await prisma.otpChallenge.create({
    data: {
      id: challengeId,
      phone,
      codeHash: hashOtp(challengeId, code),
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000),
      maxAttempts: OTP_MAX_ATTEMPTS,
      requestIp,
    },
  });

  await getSmsProvider().sendOtp(phone, code);

  return { challengeId };
}

/** Returns the verified, normalized phone number on success. */
export async function verifyOtp(challengeId: string, code: string): Promise<string> {
  const challenge = await prisma.otpChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) {
    throw new ApiError(404, "OTP challenge not found");
  }
  if (challenge.consumedAt) {
    throw new ApiError(400, "This code has already been used");
  }
  if (challenge.expiresAt < new Date()) {
    throw new ApiError(400, "This code has expired");
  }
  if (challenge.attemptCount >= challenge.maxAttempts) {
    throw new ApiError(429, "Too many incorrect attempts for this code");
  }

  await prisma.otpChallenge.update({
    where: { id: challengeId },
    data: { attemptCount: { increment: 1 } },
  });

  if (hashOtp(challengeId, code) !== challenge.codeHash) {
    throw new ApiError(401, "Incorrect code");
  }

  await prisma.otpChallenge.update({
    where: { id: challengeId },
    data: { consumedAt: new Date() },
  });

  return challenge.phone;
}
