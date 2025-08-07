import { z } from "zod";
import { baseEnvSchema } from "./base";

export const identityEnvSchema = baseEnvSchema.extend({
  PORT_IDENTITY: z.coerce.number().default(5001),
});

export type IdentityEnv = z.infer<typeof identityEnvSchema>;
