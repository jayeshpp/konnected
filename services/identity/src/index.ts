import Fastify from "fastify";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";

const app = Fastify({ logger: true });

// Register routes
app.register(authRoutes, { prefix: "/auth" });
app.register(adminRoutes, { prefix: "/admin" });

const start = async () => {
  try {
    await app.listen({ port: 5001, host: "0.0.0.0" });
    console.dir("🚀 Identity service listening on port 3001");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
