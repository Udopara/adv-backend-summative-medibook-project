import "dotenv/config";
import Redis from "ioredis";

export const redisConnection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
}

const redis = new Redis(redisConnection);

export default redis;
