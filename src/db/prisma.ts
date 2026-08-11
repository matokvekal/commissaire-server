import { PrismaClient } from "@prisma/client";

// PrismaClient only opens a connection on first query, so importing this
// module (and booting the server) never requires DATABASE_URL to be set.
export const prisma = new PrismaClient();
