import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";

interface SwaggerOptions {
  title: string;
  description?: string;
  version?: string;
}

export async function setupSwagger(app: FastifyInstance, options: SwaggerOptions) {
  const { title, description = "", version = "1.0.0" } = options;
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title,
        description,
        version,
      },
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
    },
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: "/docs/api",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}
