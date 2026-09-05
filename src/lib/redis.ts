import Redis from "ioredis";
import { env } from "../config/env";

let client: Redis | null = null;

if (env.redis.url) {
  client = new Redis(env.redis.url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("Redis connection error — caching disabled for this request:", err.message);
  });

  client.connect().catch((err) => {
    console.error("Failed to connect to Redis on startup — continuing without cache:", err.message);
  });
} else {
  console.warn("REDIS_URL not set — response caching is disabled (optional feature).");
}

export const redis = client;
