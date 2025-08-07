import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { configSchema } from "./schema";

const findMonorepoRoot = (startDir: string): string => {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return startDir;
};

// Find the monorepo root from the location of the running script
const monorepoRoot = findMonorepoRoot(__dirname);

// Load .env
const envFilePath = path.resolve(monorepoRoot, ".env");

dotenv.config({
  path: envFilePath,
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  process.exit(1);
}

export const config = result.data;
