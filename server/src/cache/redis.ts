import { createClient } from "redis";
import { requireEnv } from "../env.ts";

const host = requireEnv("REDIS_HOST");
const port = Number(requireEnv("REDIS_PORT"));

export const redis = createClient({
  socket: {
    host: host,
    port: port,
  },
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});
