import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Create default preferences
  const preferences = ["Chicken", "Veg", "Salad", "Red Rice"];

  for (const name of preferences) {
    await prisma.preference.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Created preferences:", preferences.join(", "));

  // Create a test admin user
  const adminEmail = "admin@test.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Test Admin",
      role: "ADMIN",
    },
  });

  console.log("✅ Created admin user:", adminEmail);

  // Create a test employee user
  const employeeEmail = "employee@test.com";
  await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {},
    create: {
      email: employeeEmail,
      name: "Test Employee",
      role: "EMPLOYEE",
    },
  });

  console.log("✅ Created employee user:", employeeEmail);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
