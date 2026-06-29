import { createPrismaClient } from "./prisma.service.js";

type PrismaLike = ReturnType<typeof createPrismaClient>;

let prisma: PrismaLike | null = null;

function db() {
  if (!prisma) prisma = createPrismaClient();
  return prisma;
}

// Stores legacy module state in PostgreSQL while the API keeps the current
// frontend-friendly response contracts. These keys can later be migrated into
// fully relational tables without changing the frontend endpoints.
export async function readState<T>(key: string): Promise<T | null> {
  const row = await db().systemSetting.findUnique({ where: { key } });
  return row?.value as T | null;
}

export async function writeState<T>(key: string, value: T): Promise<T> {
  await db().systemSetting.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  });
  return value;
}

export function persistState<T>(key: string, value: T) {
  writeState(key, value).catch((error) => {
    console.error(`Failed to persist ${key} to PostgreSQL`, error);
  });
}
