import { prisma } from "../prisma/client.js";
import bcrypt from "bcrypt";

export async function createDefaultAdmin() {
  const adminEmail = "admin@system.com";

  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminExists) {
    console.log("✔ Admin já existe");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log("🔥 Admin criado automaticamente");
}