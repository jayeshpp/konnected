import { z } from "zod";
import { baseEnvSchema } from "./base";

export const jwtEnvSchema = baseEnvSchema.extend({
  JWT_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  ACCESS_TOKEN_SECRET: z.string().min(10),
});

export type JwtEnv = z.infer<typeof jwtEnvSchema>;
