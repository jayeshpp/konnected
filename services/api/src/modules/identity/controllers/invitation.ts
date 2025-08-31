import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { AcceptInvitation, DeclineInvitation } from "@konnected/types";
import { db } from "@konnected/database";

export const acceptInvitation = async (
  req: FastifyRequest<{ Body: AcceptInvitation }>,
  reply: FastifyReply,
) => {
  const { token, password, name } = req.body;
  try {
    const invitation = await db.invitation.findUnique({ where: { token } });

    if (!invitation || invitation.status !== "PENDING") {
      return reply.status(400).send({ message: "Invalid or expired invitation." });
    }

    if (invitation.expiresAt < new Date()) {
      return reply.status(400).send({ message: "Invitation has expired." });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email_tenantId: { email: invitation.email, tenantId: invitation.tenantId } },
    });

    if (existingUser) {
      return reply.status(400).send({ message: "User already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await db.user.create({
      data: {
        email: invitation.email,
        tenantId: invitation.tenantId,
        passwordHash: hashedPassword,
        name: name || "",
        isActive: true,
        emailVerified: true,
      },
    });

    // Mark invitation accepted
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    return reply.status(200).send({
      message: "Invitation accepted successfully.",
      userId: newUser.id,
    });
  } catch (err) {
    req.log.error("Error accepting invitation:", err);
    return reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const declineInvitation = async (
  req: FastifyRequest<{ Body: DeclineInvitation }>,
  reply: FastifyReply,
) => {
  const { token } = req.body;
  try {
    const invitation = await db.invitation.findUnique({ where: { token } });

    if (!invitation || invitation.status !== "PENDING") {
      return reply.status(400).send({ message: "Invalid or expired invitation." });
    }

    if (invitation.expiresAt < new Date()) {
      return reply.status(400).send({ message: "Invitation has expired." });
    }

    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "CANCELLED" },
    });

    return reply.status(200).send({ message: "Invitation declined successfully." });
  } catch (err) {
    req.log.error("Error declining invitation:", err);
    return reply.status(500).send({ message: "Internal Server Error" });
  }
};
