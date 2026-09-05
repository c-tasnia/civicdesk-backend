import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/apiResponse";
import { getOrSetCache, invalidateCacheByPrefix } from "../../utils/cache";
import { catchAsync } from "../../utils/catchAsync";

const CACHE_PREFIX = "departments:";

export const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await prisma.department.create({ data: req.body });
  await invalidateCacheByPrefix(CACHE_PREFIX);
  sendSuccess(res, department, "Department created successfully", 201);
});

export const listDepartments = catchAsync(async (req: Request, res: Response) => {
  const departments = await getOrSetCache(`${CACHE_PREFIX}list`, () =>
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    })
  );
  sendSuccess(res, departments);
});

export const getDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await prisma.department.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });
  if (!department) throw new AppError("Department not found", 404);
  sendSuccess(res, department);
});

export const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await prisma.department.update({
    where: { id: req.params.id },
    data: req.body,
  });
  await invalidateCacheByPrefix(CACHE_PREFIX);
  sendSuccess(res, department, "Department updated successfully");
});

export const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  await prisma.department.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  await invalidateCacheByPrefix(CACHE_PREFIX);
  sendSuccess(res, null, "Department deleted successfully");
});
