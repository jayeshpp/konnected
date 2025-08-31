import { z } from "zod";
import { baseEnvSchema } from "./base";

export const emailEnvSchema = baseEnvSchema.extend({
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMPT_PORT: z.preprocess((val) => Number(val), z.number().int().positive()).default(587),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
});

export type EmailEnv = z.infer<typeof emailEnvSchema>;
