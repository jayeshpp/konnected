import { z } from "zod";

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "stage", "production"]).default("development"),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
