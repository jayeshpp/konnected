import { buildJsonSchemas } from "fastify-zod";
import z from "zod";

export const registerInvitedUserSchema = z.object({
  invitationToken: z.string().min(1, "Invitation token is required."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  name: z.string().optional(), // Optional, can be pre-filled from invitation
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(1, "Password is required."),
});

export const userDto = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  roles: z.array(z.string()),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userDto.extend({
    id: z.string().cuid(),
  }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters long."),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required."),
});

export const authSchemas = {
  registerInvitedUserSchema,
  loginSchema,
  loginResponseSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
};

export type UserDTO = z.infer<typeof userDto>;
export type RegisterInvitedUser = z.infer<typeof registerInvitedUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;
