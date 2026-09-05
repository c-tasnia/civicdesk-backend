import dotenv from "dotenv";

dotenv.config();

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshSecret: required("JWT_REFRESH_SECRET"),
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 30),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },

  redis: {
    url: process.env.REDIS_URL ?? "",
  },

  sslcommerz: {
    storeId: process.env.SSLCZ_STORE_ID ?? "",
    storePassword: process.env.SSLCZ_STORE_PASSWORD ?? "",
    isLive: process.env.SSLCZ_IS_LIVE === "true",
  },

  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  serverUrl: process.env.SERVER_URL ?? "http://localhost:5000",
};
