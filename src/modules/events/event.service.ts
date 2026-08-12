import type { Event, EventParticipant } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../lib/api-error.js";
import { logger } from "../../lib/logger.js";
import { datePrefix, letterSuffix } from "./event-code.js";

export async function findActiveEventByCode(code: string): Promise<Event | null> {
  return prisma.event.findFirst({ where: { code, isActive: true } });
}

/**
 * Next event code for `now`: today's date (DDMMYYYY) plus the first unused letter suffix
 * (A, B, ... Z, AA, AB, ...) among events already created today.
 */
export async function generateEventCode(now = new Date()): Promise<string> {
  const prefix = datePrefix(now);
  const todaysEvents = await prisma.event.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });
  const usedSuffixes = new Set(todaysEvents.map((e) => e.code.slice(prefix.length).toUpperCase()));

  let index = 0;
  while (usedSuffixes.has(letterSuffix(index))) {
    index++;
  }
  return `${prefix}${letterSuffix(index)}`;
}

export function toEventConfig(event: Event) {
  return {
    eventId: event.id,
    name: event.name,
    type: event.type,
    requiresBib: event.requiresBib,
  };
}

/**
 * Idempotent: re-joining the same event returns the rider's existing participant row
 * (e.g. bib updated) rather than erroring, since the app may retry after a network drop.
 */
export async function joinEvent(
  userId: number,
  eventCode: string,
  bib: string | undefined,
): Promise<{ event: Event; participant: EventParticipant }> {
  const event = await findActiveEventByCode(eventCode);
  if (!event) {
    logger.warn({ eventCode, userId }, "joinEvent: event not found");
    throw new ApiError(404, "Event not found");
  }

  if (event.requiresBib && !bib) {
    logger.warn({ eventId: event.id, userId }, "joinEvent: missing required bib");
    throw new ApiError(400, "This event requires a bib number");
  }

  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: event.id, userId } },
    create: { eventId: event.id, userId, bib },
    update: { bib: bib ?? undefined, leftAt: null },
  });
  logger.info(
    { eventId: event.id, userId, participantId: participant.id },
    "user joined event",
  );

  return { event, participant };
}

export async function findParticipantForUser(
  participantId: number,
  userId: number,
): Promise<EventParticipant | null> {
  return prisma.eventParticipant.findFirst({ where: { id: participantId, userId } });
}

export async function saveLocationBatch(
  participantId: number,
  points: Array<{
    lat: number;
    lng: number;
    accuracy?: number;
    recordedAt: Date;
    emergency: boolean;
  }>,
): Promise<number> {
  const result = await prisma.locationPoint.createMany({
    data: points.map((point) => ({ participantId, ...point })),
  });
  logger.info({ participantId, saved: result.count }, "location batch saved");
  return result.count;
}
