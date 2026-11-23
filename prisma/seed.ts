import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seeding.");
    process.exit(1);
  }
  if (adminPassword.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  // Idempotent plans
  const plans = [
    { name: "Free", dailyVideos: 5, maxLengthSeconds: 4 * 60, watermark: true, teamSeats: 1, priceNgn: 0 },
    { name: "Starter", dailyVideos: 15, maxLengthSeconds: 7 * 60, watermark: false, teamSeats: 1, priceNgn: 5000 },
    { name: "Pro", dailyVideos: 40, maxLengthSeconds: 12 * 60, watermark: false, teamSeats: 1, priceNgn: 12000 },
    { name: "Business", dailyVideos: 100, maxLengthSeconds: 17 * 60, watermark: false, teamSeats: 5, priceNgn: 30000 },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }

  // Admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "admin" },
    create: {
      email: adminEmail,
      passwordHash,
      role: "admin",
      timezone: process.env.DEFAULT_TIMEZONE || "Africa/Lagos",
    },
  });

  // Admin settings
  await prisma.adminSettings.upsert({
    where: { key: "default" },
    update: {},
    create: {
      key: "default",
      bankName: "REPLACE_ME",
      accountName: "REPLACE_ME",
      accountNumber: "REPLACE_ME",
      supportEmail: "support@omnia.ai",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
