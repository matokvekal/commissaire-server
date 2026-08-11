import type { Event, EventParticipant } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../lib/api-error.js";

export async function findActiveEventByCode(code: string): Promise<Event | null> {
  return prisma.event.findFirst({ where: { code, isActive: true } });
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
  userId: string,
  eventCode: string,
  bib: string | undefined,
): Promise<{ event: Event; participant: EventParticipant }> {
  const event = await findActiveEventByCode(eventCode);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.requiresBib && !bib) {
    throw new ApiError(400, "This event requires a bib number");
  }

  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: event.id, userId } },
    create: { eventId: event.id, userId, bib },
    update: { bib: bib ?? undefined, leftAt: null },
  });

  return { event, participant };
}

export async function findParticipantForUser(
  participantId: string,
  userId: string,
): Promise<EventParticipant | null> {
  return prisma.eventParticipant.findFirst({ where: { id: participantId, userId } });
}

export async function saveLocationBatch(
  participantId: string,
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
  return result.count;
}
