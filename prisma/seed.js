// Simple seed to create a few sample CreatorProfiles for matching.
// Usage: pnpm prisma:generate && pnpm prisma:migrate && pnpm db:seed

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const samples = [
    { experienceId: "exp_alpha", title: "Alpha Club", tags: ["crypto","education","signals"], audienceSize: 12000 },
    { experienceId: "exp_build", title: "Build Guild", tags: ["builders","startup","education"], audienceSize: 9000 },
    { experienceId: "exp_focus", title: "Focus Hub", tags: ["productivity","ai","education"], audienceSize: 7000 },
    { experienceId: "exp_quant", title: "Quant Edge", tags: ["quant","crypto","education"], audienceSize: 15000 },
  ];
  for (const s of samples) {
    await prisma.creatorProfile.upsert({
      where: { experienceId: s.experienceId },
      create: { ...s, tags: s.tags },
      update: { title: s.title, tags: s.tags, audienceSize: s.audienceSize },
    });
  }
  console.log("Seeded sample CreatorProfiles");
}

main().finally(() => prisma.$disconnect());

