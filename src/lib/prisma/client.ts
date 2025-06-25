import { PrismaClient } from "./generated";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const debugMode = false;
const log: ("query" | "info" | "warn" | "error")[] = debugMode
  ? ["query", "info", "warn", "error"]
  : ["warn", "error"];

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
