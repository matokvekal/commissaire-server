import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ride = await prisma.event.upsert({
    where: { code: "74291" },
    create: {
      code: "74291",
      name: "Saturday Gravel Ride",
      type: "RIDE",
      requiresBib: false,
    },
    update: {},
  });

  const race = await prisma.event.upsert({
    where: { code: "10001" },
    create: {
      code: "10001",
      name: "Gravel Championship",
      type: "RACE",
      requiresBib: true,
    },
    update: {},
  });

  console.log("Seeded events:");
  console.log(` - ${ride.code}  ${ride.name} (RIDE, no bib)`);
  console.log(` - ${race.code}  ${race.name} (RACE, bib required)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
