import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";

function shouldUseSsl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("sslmode") === "disable") return false;
    if (url.searchParams.has("sslmode")) return true;
    return !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return env.databaseSsl;
  }
}

export function createPrismaClient() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required before creating PrismaClient.");
  }

  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
    ...(env.databaseSsl || shouldUseSsl(env.databaseUrl) ? { ssl: true } : {}),
  });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}
