import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { getEventByCode, join, postLocationBatch } from "./event.controller.js";

export const eventRouter = Router();

// Unauthenticated: the transmitter looks this up right after a QR scan / code entry,
// before the rider has necessarily signed in yet (see transmiter/REQUIREMENTS.md).
eventRouter.get("/by-code/:code", getEventByCode);

eventRouter.post("/join", requireAuth, join);
eventRouter.post("/:eventId/locations/batch", requireAuth, postLocationBatch);
