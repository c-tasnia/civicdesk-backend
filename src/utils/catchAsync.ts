import type { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const catchAsync = (fn: Handler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
