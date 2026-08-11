import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { updateMe } from "./user.controller.js";

export const userRouter = Router();

userRouter.patch("/me", requireAuth, updateMe);
