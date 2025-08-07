import { identityEnvSchema } from "./schemas/identity";
import { jwtEnvSchema } from "./schemas/jwt";

export const configSchema = jwtEnvSchema.merge(identityEnvSchema);

export type AppConfig = typeof configSchema._type;
