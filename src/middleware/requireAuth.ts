import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

export interface AuthContext {
  userId: string;
  role: Role;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

/**
 * Verifies a Commissaire access token only (signature + expiry, no I/O). Google/SMS
 * verification never happens here — those only run at the provider auth endpoints.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.header("authorization"));
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const claims = await verifyAccessToken(token);
    req.auth = { userId: claims.sub, role: claims.role, sessionId: claims.sid };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
