import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../utils/apiResponse";
import { getOrSetCache, invalidateCacheByPrefix } from "../../utils/cache";
import { catchAsync } from "../../utils/catchAsync";

const CACHE_PREFIX = "serviceTypes:";

export const createServiceType = catchAsync(async (req: Request, res: Response) => {
  const serviceType = await prisma.serviceType.create({ data: req.body });
  await invalidateCacheByPrefix(CACHE_PREFIX);
  sendSuccess(res, serviceType, "Service type created successfully", 201);
});

export const listServiceTypes = catchAsync(async (req: Request, res: Response) => {
  const { departmentId } = req.query;
  const cacheKey = `${CACHE_PREFIX}list:${departmentId ?? "all"}`;

  const serviceTypes = await getOrSetCache(cacheKey, () =>
    prisma.serviceType.findMany({
      where: { deletedAt: null, ...(departmentId ? { departmentId: String(departmentId) } : {}) },
      include: { department: { select: { id: true, name: true } } },
    })
  );
  sendSuccess(res, serviceTypes);
});

export const deleteServiceType = catchAsync(async (req: Request, res: Response) => {
  await prisma.serviceType.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  await invalidateCacheByPrefix(CACHE_PREFIX);
  sendSuccess(res, null, "Service type deleted successfully");
});
