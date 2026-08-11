import { type LoginTicket, OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const client = new OAuth2Client();

export interface GoogleIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export class InvalidGoogleTokenError extends Error {
  constructor(message = "Invalid Google ID token") {
    super(message);
    this.name = "InvalidGoogleTokenError";
  }
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (env.GOOGLE_CLIENT_IDS.length === 0) {
    throw new InvalidGoogleTokenError("Server has no GOOGLE_CLIENT_IDS configured");
  }

  let ticket: LoginTicket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_IDS,
    });
  } catch {
    throw new InvalidGoogleTokenError();
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new InvalidGoogleTokenError("Google token payload is missing subject or email");
  }

  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified ?? false,
    name: payload.name ?? null,
  };
}
