import type { User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { updateProfileSchema } from "./user.schemas.js";
import { needsProfile, updateProfile } from "./user.service.js";

function toProfile(user: User) {
  return {
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname,
    emergencyPhone: user.emergencyPhone,
    requiresProfile: needsProfile(user),
  };
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await updateProfile(req.auth!.userId, input);
    res.status(200).json(toProfile(user));
  } catch (err) {
    next(err);
  }
}
