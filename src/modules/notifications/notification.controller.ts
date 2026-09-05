import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";
import * as service from "./notification.service";

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  const items = await service.listMyNotifications(req.user!.id);
  sendSuccess(res, items);
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  await service.markAsRead(req.user!.id, req.params.id);
  sendSuccess(res, null, "Notification marked as read");
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  await service.markAllAsRead(req.user!.id);
  sendSuccess(res, null, "All notifications marked as read");
});
