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

  // Note: Users are now auto-created on first Azure AD login
  // To make a user an admin, update their role in the database:
  // UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@company.com';
  console.log("ℹ️  Users will be auto-created on first Azure AD login with EMPLOYEE role");
  console.log("ℹ️  To promote a user to admin, update their role in the database");
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
