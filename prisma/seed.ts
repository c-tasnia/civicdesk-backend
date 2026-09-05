import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("ADMIN_PASSWORD not set in .env — skipping admin account creation");
  }

  const departments = await Promise.all(
    [
      { name: "Roads & Infrastructure", description: "Potholes, streetlights, road damage" },
      { name: "Water Supply", description: "Water leaks, supply issues, quality complaints" },
      { name: "Sanitation", description: "Waste collection, drainage, cleanliness" },
    ].map((d) => prisma.department.upsert({ where: { name: d.name }, update: {}, create: d }))
  );

  if (adminPassword) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: "admin@civicdesk.dev" },
      update: {},
      create: {
        name: "System Admin",
        email: "admin@civicdesk.dev",
        password: hashed,
        role: "ADMIN",
        isVerified: true,
      },
    });
  }

  const staffPassword = await bcrypt.hash("staff12345", 12);
  await prisma.user.upsert({
    where: { email: "staff@civicdesk.dev" },
    update: {},
    create: {
      name: "Roads Dept. Staff",
      email: "staff@civicdesk.dev",
      password: staffPassword,
      role: "STAFF",
      departmentId: departments[0].id,
      isVerified: true,
    },
  });

  const citizenPassword = await bcrypt.hash("citizen12345", 12);
  await prisma.user.upsert({
    where: { email: "citizen@civicdesk.dev" },
    update: {},
    create: {
      name: "Demo Citizen",
      email: "citizen@civicdesk.dev",
      password: citizenPassword,
      role: "CITIZEN",
      isVerified: true,
    },
  });

  await prisma.serviceType.createMany({
    data: [
      { name: "Trade License Renewal", fee: 500, departmentId: departments[0].id },
      { name: "Water Connection Application", fee: 1200, departmentId: departments[1].id },
      { name: "Waste Collection Permit", fee: 300, departmentId: departments[2].id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
  console.log("Demo logins: staff@civicdesk.dev / staff12345, citizen@civicdesk.dev / citizen12345");
  console.log(adminPassword ? "Admin: admin@civicdesk.dev / <ADMIN_PASSWORD from .env>" : "Admin: not created (set ADMIN_PASSWORD in .env and re-run)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
