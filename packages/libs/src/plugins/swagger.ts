import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

interface SwaggerOptions {
  title: string;
  description?: string;
  version?: string;
}

export async function setupSwagger(app: FastifyInstance, options: SwaggerOptions) {
  const { title, description = "", version = "1.0.0" } = options;
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title,
        description,
        version,
      },
      tags: [
        { name: "Onboarding", description: "Onboarding related end-points" },
        { name: "User", description: "User related end-points" },
        { name: "Role", description: "Role related end-points" },
        { name: "Permission", description: "Permission related end-points" },
        { name: "Auth", description: "Auth related end-points" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT", // Optional, for display
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      servers: [
        {
          url: "http://localhost:5001/api/v1",
          description: "Local dev server",
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: "/docs/api",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}
