import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";

export function createPrismaClient() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required before creating PrismaClient.");
  }

  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
    ...(env.databaseSsl ? { ssl: true } : {}),
  });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}
