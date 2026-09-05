import type { NotificationType, PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

export const notifyUser = async (
  client: Client,
  userId: string,
  input: { title: string; message: string; type: NotificationType }
) => {
  return client.notification.create({
    data: { userId, ...input },
  });
};

export const listMyNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

export const markAsRead = async (userId: string, id: string) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
