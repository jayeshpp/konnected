import { PrismaClient } from "./generated/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envFilePath = path.resolve(__dirname, ".env");

if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  console.warn(
    "⚠️ .env file not found at " + envFilePath + ". Falling back to environment variables.",
  );
}

// Instantiate the extended Prisma client to infer its type
const extendedPrisma = new PrismaClient().$extends(withAccelerate());
type ExtendedPrismaClient = typeof extendedPrisma;

// Use globalThis for broader environment compatibility
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ExtendedPrismaClient;
};

// Named export with global memoization
export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? extendedPrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const db = prisma;
