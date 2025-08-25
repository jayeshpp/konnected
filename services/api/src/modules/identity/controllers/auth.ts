import { db } from "@konnected/database";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  verifyRefreshToken,
} from "@konnected/libs";
import { AuthenticatedUser, LoginRequestBody, RefreshTokenRequestBody } from "@konnected/types";
import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";

// POST /api/v1/auth/login
export const login = async (
  req: FastifyRequest<{ Body: LoginRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenantId as string;

    const user = await db.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId,
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ message: "Invalid credentials." });
    }

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
      tenantId: user.tenantId,
    };

    const accessToken = req.server.jwt.sign(authenticatedUser, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = req.server.jwt.sign(authenticatedUser, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    req.log.error("Error during login:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

// POST /api/v1/auth/refresh-token
export const refreshToken = async (
  req: FastifyRequest<{ Body: RefreshTokenRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { refreshToken } = req.body;
    const tenantId = req.tenantId as string;

    const decoded = await verifyRefreshToken(req, refreshToken);

    if (!decoded || !decoded.id || decoded.tenantId !== tenantId) {
      return reply.status(401).send({ message: "Invalid or expired refresh token." });
    }

    const storedToken = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (
      !storedToken ||
      storedToken.expiresAt < new Date() ||
      storedToken.user.tenantId !== tenantId
    ) {
      if (storedToken) {
        await db.refreshToken.delete({ where: { id: storedToken.id } });
      }
      return reply.status(401).send({ message: "Invalid or expired refresh token." });
    }

    if (storedToken.userId !== decoded.id) {
      return reply.status(401).send({ message: "Refresh token mismatch." });
    }

    await db.refreshToken.delete({ where: { id: storedToken.id } });

    const userRoles = storedToken.user.roles.map((ur) => ur.role.name);
    const authenticatedUser: AuthenticatedUser = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      roles: userRoles,
      tenantId: storedToken.user.tenantId,
    };

    const newAccessToken = req.server.jwt.sign(authenticatedUser, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const newRefreshToken = req.server.jwt.sign(authenticatedUser, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

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
    req.log.error("Error during token refresh:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

// POST /api/v1/auth/logout
export const logout = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenantId as string;

    if (!userId) {
      return reply.status(401).send({ message: "Unauthorized." });
    }

    await db.refreshToken.deleteMany({
      where: {
        userId: userId,
        user: {
          tenantId: tenantId,
        },
      },
    });

    reply.send({ message: "Logged out successfully." });
  } catch (error) {
    req.log.error("Error during logout:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

// GET /api/v1/auth/me
export const getMyProfile = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenantId as string;

    if (!req.user || !userId) {
      return reply.status(401).send({ message: "Unauthorized." });
    }

    const user = await db.user.findUnique({
      where: {
        id: userId,
        tenantId: tenantId,
      },
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
      tenantId: tenantId,
    });
  } catch (error) {
    req.log.error("Error fetching user profile:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};
