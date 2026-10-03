import rateLimit from "express-rate-limit";

const bypass = (req: any) =>
  Boolean(process.env.TEST_BYPASS_SECRET) &&
  req.headers["x-test-bypass"] === process.env.TEST_BYPASS_SECRET;

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: bypass,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errors: [],
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: bypass,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later",
    errors: [],
  },
});