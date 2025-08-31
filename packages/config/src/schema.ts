import { identityEnvSchema } from "./schemas/identity";
import { jwtEnvSchema } from "./schemas/jwt";
import { emailEnvSchema } from "./schemas/email";

export const configSchema = jwtEnvSchema.merge(identityEnvSchema).merge(emailEnvSchema);

export type AppConfig = typeof configSchema._type;
