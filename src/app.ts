import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { apiLimiter } from "./middlewares/rateLimiter";
import v1Routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // SSLCommerz posts form-encoded callbacks
app.use(cookieParser());
app.use(apiLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "CivicDesk API is running", data: {} });
});

app.use("/api/v1", v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
