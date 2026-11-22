import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const waitlistQueue = new Queue("appointment-waitlist", {
  connection: redisConnection,
});

export const notificationQueue = new Queue("notification-list", {
  connection: redisConnection,
});
