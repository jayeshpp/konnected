import Fastify from "fastify";
//import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import onboardingRoutes from "./routes/onboarding";
import { authMiddleware, tenantIdentifierMiddleware } from "@konnected/middlewares";
import fastifyJwt from "@fastify/jwt";
import { config } from "@konnected/config";
import { onboardingSchemas } from "./schemas/onboarding";
import { adminSchemas } from "./schemas/admin";
import { setupSwagger } from "@konnected/libs";

const app = Fastify({ logger: true });

setupSwagger(app, {
  title: "Identity Service API",
  description: "API docs for Identity Service",
  version: "1.0.0",
});

app.addHook("preHandler", (req, reply, done) => {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  done();
});

// Register all schemas at the top level
for (const schema of [...adminSchemas, ...onboardingSchemas]) {
  app.addSchema(schema);
}

app.register(async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: {
      private: config.ACCESS_TOKEN_SECRET,
      public: config.ACCESS_TOKEN_SECRET,
    },
  });

  fastify.decorate("authenticate", authMiddleware());
  fastify.decorate("authorize", authMiddleware);

  fastify.register(
    async (tenantScopedFastify) => {
      tenantScopedFastify.addHook("preHandler", tenantIdentifierMiddleware);
      //tenantScopedFastify.register(authRoutes, { prefix: "/api/v1/auth" });
      tenantScopedFastify.register(adminRoutes, { prefix: "/api/v1/admin" });
    },
    { prefix: "/api/v1" },
  );
});
app.register(onboardingRoutes, { prefix: "/api/v1/onboarding" });

const start = async () => {
  try {
    await app.listen({ port: config.PORT_IDENTITY, host: "0.0.0.0" });
    app.log.info(`🚀 Identity service listening on port ${config.PORT_IDENTITY}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
