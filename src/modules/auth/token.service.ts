import type { User } from "@prisma/client";
import { signAccessToken } from "../../lib/jwt.js";
import { createSession, type SessionContext } from "./session.service.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function issueTokenPair(user: User, context: SessionContext): Promise<TokenPair> {
  const { session, refreshToken } = await createSession(user.id, context);
  const accessToken = await signAccessToken({ sub: user.id, role: user.role, sid: session.id });
  return { accessToken, refreshToken };
}
