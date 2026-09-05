import type { Request, Response } from "express";
import { uploadBufferToCloudinary } from "../../config/cloudinary";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";
import * as service from "./complaint.service";

export const createComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaint = await service.createComplaint(req.user!.id, req.body);
  sendSuccess(res, complaint, "Complaint filed successfully", 201);
});

export const listComplaints = catchAsync(async (req: Request, res: Response) => {
  const result = await service.listComplaints(req.user!, req.query as never);
  sendSuccess(res, result.items, "Complaints fetched successfully", 200);
});

export const searchComplaints = catchAsync(async (req: Request, res: Response) => {
  const keyword = (req.query.q as string) ?? "";
  const items = await service.searchComplaints(req.user!, keyword);
  sendSuccess(res, items);
});

export const getComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaint = await service.getComplaintById(req.params.id, req.user!);
  sendSuccess(res, complaint);
});

export const assignComplaint = catchAsync(async (req: Request, res: Response) => {
  const complaint = await service.assignComplaint(req.params.id, req.body.staffId, req.user!.id);
  sendSuccess(res, complaint, "Complaint assigned successfully");
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const complaint = await service.updateComplaintStatus(
    req.params.id,
    req.user!,
    req.body.status,
    req.body.note
  );
  sendSuccess(res, complaint, "Complaint status updated successfully");
});

export const deleteComplaint = catchAsync(async (req: Request, res: Response) => {
  await service.softDeleteComplaint(req.params.id);
  sendSuccess(res, null, "Complaint deleted successfully");
});

export const uploadAttachment = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const { url, publicId } = await uploadBufferToCloudinary(req.file.buffer, "civicdesk/complaints");
  const attachment = await service.addAttachment(req.params.id, url, publicId);
  sendSuccess(res, attachment, "Attachment uploaded successfully", 201);
});
