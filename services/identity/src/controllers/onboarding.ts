import { AuthenticatedUser, RegisterOrganizationRequestBody } from "@konnected/types";
import { FastifyReply, FastifyRequest } from "fastify";
//import { registerOrganizationSchema } from "../schemas/onboarding";
import bcrypt from "bcryptjs";
import { db } from "@konnected/database";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "@konnected/libs";

export const registerOrganization = async (
  req: FastifyRequest<{ Body: RegisterOrganizationRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { organizationName, organizationSlug, adminEmail, adminPassword, adminName } = req.body;

    // 1. Validate organization slug uniqueness
    const finalSlug = organizationSlug || organizationName.toLowerCase().replace(/\s+/g, "-");
    const existingTenant = await db.tenant.findUnique({ where: { slug: finalSlug } });
    if (existingTenant) {
      return reply.status(400).send({
        message: "Organization slug already exists. Please choose a different name or slug.",
      });
    }

    // 2. Create the new Tenant
    const newTenant = await db.tenant.create({
      data: {
        name: organizationName,
        slug: finalSlug,
        isActive: true,
      },
    });

    // 3. Create default roles for the new tenant
    const adminRole = await db.role.create({
      data: {
        name: "admin",
        description: "Administrator for this organization",
        tenantId: newTenant.id,
      },
    });
    const userRole = await db.role.create({
      data: {
        name: "user",
        description: "Standard user for this organization",
        tenantId: newTenant.id,
      },
    });
    // You might create other default roles/permissions here

    // 4. Create the initial admin user for the new tenant
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        tenantId: newTenant.id,
        emailVerified: true, // Auto-verify initial admin
        isActive: true,
      },
    });

    // 5. Assign the admin role to the initial admin user
    await db.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    // 6. Generate and return tokens for immediate login
    const authenticatedUser: AuthenticatedUser = {
      id: adminUser.id,
      email: adminUser.email,
      roles: ["admin"], // Directly assign 'admin' role for JWT
      tenantId: newTenant.id,
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
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    reply.status(201).send({
      message: "Organization registered successfully. Admin user created.",
      tenantId: newTenant.id,
      adminUserId: adminUser.id,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      return reply.status(400).send({ message: "Organization slug already exists." });
    }
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return reply.status(400).send({ message: "Organization name already exists." });
    }
    req.log.error("Error during organization registration:", error.message);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};
