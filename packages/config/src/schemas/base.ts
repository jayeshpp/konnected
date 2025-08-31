import { z } from "zod";

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "stage", "production"]).default("development"),
  DOMAIN_BASE_URL: z.string().default("http://localhost:3000"),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
