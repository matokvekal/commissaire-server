import pino from "pino";
import { env } from "../config/env.js";

// Bearer tokens (Commissaire access/refresh, Google ID tokens) are never surfaced in structured
// logs, regardless of how they get attached to a log call. OTP codes are the one intentional
// exception outside production: MockSmsProvider logs the code so local/dev testing can read it
// (see SETUP.md) — that path is redacted too once NODE_ENV is "production".
const tokenRedactPaths = [
  "req.headers.authorization",
  "*.authorization",
  "*.idToken",
  "*.accessToken",
  "*.refreshToken",
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: env.NODE_ENV === "production" ? [...tokenRedactPaths, "*.otpCode"] : tokenRedactPaths,
    censor: "[redacted]",
  },
});
