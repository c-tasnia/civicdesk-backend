import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";
import * as service from "./serviceRequest.service";

export const createServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const request = await service.createServiceRequest(
    req.user!.id,
    req.body.serviceTypeId,
    req.body.note
  );
  sendSuccess(res, request, "Service request created — proceed to payment", 201);
});

export const listServiceRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await service.listServiceRequests(req.user!, req.query as never);
  sendSuccess(res, result.items);
});

export const getServiceRequest = catchAsync(async (req: Request, res: Response) => {
  const request = await service.getServiceRequestById(req.params.id, req.user!);
  sendSuccess(res, request);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const request = await service.updateServiceRequestStatus(
    req.params.id,
    req.body.status,
    req.user!.id
  );
  sendSuccess(res, request, "Service request status updated");
});
