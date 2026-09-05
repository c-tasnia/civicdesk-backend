import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import type { AuthPayload } from "../../middlewares/auth";
import { AppError } from "../../utils/AppError";

const signAccessToken = (payload: AuthPayload) =>
  jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as jwt.SignOptions);

const issueRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.jwt.refreshExpiresInDays);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
};

export const registerUser = async (input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hashed = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      phone: input.phone,
      role: "CITIZEN",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user || !user.password) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await prisma.user.findFirst({ where: { id: stored.userId, deletedAt: null } });
  if (!user) throw new AppError("User no longer exists", 401);

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  return { accessToken };
};

export const logoutUser = async (token: string) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

/**
 * Google OAuth (GCP Social Login).
 * Exchanges an authorization code for tokens, fetches the Google profile,
 * and finds-or-creates a local user for it.
 */
export const loginWithGoogle = async (profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}) => {
  let user = await prisma.user.findUnique({ where: { email: profile.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        provider: "GOOGLE",
        providerId: profile.googleId,
        isVerified: true,
        role: "CITIZEN",
      },
    });
  } else if (user.provider !== "GOOGLE") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { provider: "GOOGLE", providerId: profile.googleId },
    });
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};
