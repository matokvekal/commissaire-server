import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetFakePrisma } from "./support/fake-prisma.js";

const mocks = vi.hoisted(() => ({
  verifyGoogleIdToken: vi.fn(),
}));

vi.mock("../src/lib/google-auth.js", () => ({
  verifyGoogleIdToken: mocks.verifyGoogleIdToken,
  InvalidGoogleTokenError: class InvalidGoogleTokenError extends Error {},
}));

vi.mock("../src/db/prisma.js", async () => {
  const { fakePrisma } = await import("./support/fake-prisma.js");
  return { prisma: fakePrisma };
});

const { createApp } = await import("../src/app.js");

async function signIn(app: ReturnType<typeof createApp>) {
  mocks.verifyGoogleIdToken.mockResolvedValue({
    subject: "google-subject-1",
    email: "rider@example.com",
    emailVerified: true,
    name: "Rider One",
  });
  const res = await request(app).post("/api/v1/auth/google").send({ idToken: "good-token" });
  return res.body as { accessToken: string };
}

beforeEach(() => {
  resetFakePrisma();
  mocks.verifyGoogleIdToken.mockReset();
});

describe("PATCH /api/v1/users/me", () => {
  it("requires authentication", async () => {
    const app = createApp();
    const res = await request(app).patch("/api/v1/users/me").send({ firstName: "Ada" });
    expect(res.status).toBe(401);
  });

  it("starts with requiresProfile true and flips to false once fields are complete", async () => {
    const app = createApp();
    const { accessToken } = await signIn(app);

    const partial = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ firstName: "Ada" });
    expect(partial.status).toBe(200);
    expect(partial.body.requiresProfile).toBe(true);

    const complete = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lastName: "Lovelace", nickname: "Ada" });
    expect(complete.status).toBe(200);
    expect(complete.body.requiresProfile).toBe(false);
    expect(complete.body.firstName).toBe("Ada");
    expect(complete.body.lastName).toBe("Lovelace");
  });

  it("leaves emergencyPhone optional", async () => {
    const app = createApp();
    const { accessToken } = await signIn(app);

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ firstName: "Ada", lastName: "Lovelace", nickname: "Ada" });

    expect(res.status).toBe(200);
    expect(res.body.requiresProfile).toBe(false);
    expect(res.body.emergencyPhone).toBeNull();
  });
});
