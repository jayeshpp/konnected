/* import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { db } from "@konnected/database";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  verifyRefreshToken,
} from "@konnected/libs";
import {
  RegisterRequestBody,
  LoginRequestBody,
  RefreshTokenRequestBody,
  AuthenticatedUser,
} from "@konnected/types";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

// --- Schemas for input validation ---
const registerSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(1, "Password is required."),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

const authRoutes: FastifyPluginAsync = async (app) => {
  // Register JWT plugin with secrets (defined in index.ts for global use)
  // This ensures app.jwt.sign and req.jwtVerify are available.

  // POST /api/v1/auth/register
  app.post<{ Body: RegisterRequestBody }>("/register", async (req, reply) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return reply.status(400).send({ errors: result.error.flatten((issue) => issue.message) });
      }
      const { email, password, name } = req.body;

      const tenantId = req.tenantId ?? "";

      // Check if user already exists
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({ message: "Email already registered." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await db.user.create({
        data: {
          email,
          passwordHash,
          name,
          tenantId,
          // emailVerified: false, // Default to false, requires verification flow
          // isActive: true, // Default to true
        },
      });

      // Assign a default 'user' role
      const defaultRole = await db.role.findUnique({ where: { name: "user" } });
      if (!defaultRole) {
        app.log.error("Default 'user' role not found. Please create it.");
        // You might want to create it here or throw a more specific error
        return reply.status(500).send({ message: "Default role not configured." });
      }

      await db.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
        },
      });

      // For registration, we typically don't return tokens immediately
      // unless auto-login after registration is desired.
      // As per API design, we return a message and userId.
      reply.status(201).send({
        message: "User registered successfully. Please verify your email.",
        userId: user.id,
      });

      // TODO: Implement email verification logic here (send email with token)
    } catch (error) {
      app.log.error("Error during registration:", error);
      reply.status(500).send({ message: "Internal Server Error." });
    }
  });

  // POST /api/v1/auth/login
  app.post<{ Body: LoginRequestBody }>(
    "/login",
    { schema: { body: zodToJsonSchema(loginSchema) } }, // Apply validation schema
    async (req, reply) => {
      try {
        const { email, password } = req.body;
        const tenantId = req.tenantId ?? "";

        const user = await db.user.findUnique({
          where: { email },
          include: {
            roles: {
              include: {
                role: true, // Include the Role details to get the name
              },
            },
          },
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return reply.status(401).send({ message: "Invalid credentials." });
        }

        // Check if user is active and email is verified (as per API design)
        if (!user.isActive) {
          return reply.status(403).send({ message: "Account is inactive." });
        }
        if (!user.emailVerified) {
          return reply.status(403).send({ message: "Please verify your email address." });
        }

        const userRoles = user.roles.map((ur) => ur.role.name);

        const authenticatedUser: AuthenticatedUser = {
          id: user.id,
          email: user.email,
          roles: userRoles,
          tenantId,
          // Add other properties if needed in JWT payload
        };

        // Generate Access Token (short-lived)
        const accessToken = app.jwt.sign(authenticatedUser, {
          expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        });

        // Generate Refresh Token (long-lived)
        const refreshToken = app.jwt.sign(authenticatedUser, {
          expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        });

        // Store refresh token in the database for invalidation
        await db.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
        });

        reply.send({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: userRoles,
          },
        });
      } catch (error) {
        app.log.error("Error during login:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // POST /api/v1/auth/refresh-token
  app.post<{ Body: RefreshTokenRequestBody }>(
    "/refresh-token",
    { schema: { body: zodToJsonSchema(refreshTokenSchema) } },
    async (req, reply) => {
      try {
        const { refreshToken } = req.body;
        const tenantId = req.tenantId ?? "";

        // Verify the refresh token
        const decoded = await verifyRefreshToken(app, refreshToken);

        if (!decoded || !decoded.id) {
          return reply.status(401).send({ message: "Invalid or expired refresh token." });
        }

        // Check if the refresh token exists in the database and is valid
        const storedToken = await db.refreshToken.findUnique({
          where: { token: refreshToken },
          include: { user: { include: { roles: { include: { role: true } } } } },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
          // Invalidate token if found but expired, or if not found
          if (storedToken) {
            await db.refreshToken.delete({ where: { id: storedToken.id } });
          }
          return reply.status(401).send({ message: "Invalid or expired refresh token." });
        }

        // Ensure the token belongs to the correct user
        if (storedToken.userId !== decoded.id) {
          return reply.status(401).send({ message: "Refresh token mismatch." });
        }

        // Revoke the old refresh token (optional but recommended for security)
        await db.refreshToken.delete({ where: { id: storedToken.id } });

        // Generate new access and refresh tokens
        const userRoles = storedToken.user.roles.map((ur) => ur.role.name);
        const authenticatedUser: AuthenticatedUser = {
          id: storedToken.user.id,
          email: storedToken.user.email,
          roles: userRoles,
          tenantId,
        };

        const newAccessToken = app.jwt.sign(authenticatedUser, {
          expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        });

        const newRefreshToken = app.jwt.sign(authenticatedUser, {
          expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        });

        // Store the new refresh token
        await db.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: storedToken.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        reply.send({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } catch (error) {
        app.log.error("Error during token refresh:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // POST /api/v1/auth/logout
  app.post(
    "/logout",
    { onRequest: [app.authenticate] }, // Require authentication
    async (req, reply) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return reply.status(401).send({ message: "Unauthorized." });
        }

        // Optionally, if a specific refresh token is sent in body, revoke only that one
        // For simplicity, we'll revoke all refresh tokens for the user here.
        // In a more complex setup, you might revoke specific tokens or use a blacklist.
        await db.refreshToken.deleteMany({
          where: { userId: userId },
        });

        reply.send({ message: "Logged out successfully." });
      } catch (error) {
        app.log.error("Error during logout:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // GET /api/v1/auth/me
  app.get(
    "/me",
    { onRequest: [app.authenticate] }, // Require authentication
    async (req, reply) => {
      try {
        // req.user is populated by the authentication middleware
        if (!req.user) {
          return reply.status(401).send({ message: "Unauthorized." });
        }

        // Fetch full user details from DB if needed, or just return from JWT payload
        const user = await db.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user) {
          return reply.status(404).send({ message: "User not found." });
        }

        reply.send({
          id: user.id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: user.roles.map((ur) => ur.role.name),
        });
      } catch (error) {
        app.log.error("Error fetching user profile:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // TODO: Implement /forgot-password, /reset-password, /resend-verification, /verify-email
};

export default authRoutes;
 */
