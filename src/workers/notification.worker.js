import { Worker } from "bullmq";
import * as AppointmentWaitlist from "../services/appointment-waitlist.service.js";
import { redisConnection } from "../config/redis.js";
import AppointmentModel from "../models/appointment.model.js";
import { sendConfirmationEmail } from "../services/email-notification.service.js";

export const notificationWorker = new Worker(
  "notification-list",
  async (job) => {

    const { appt_ref } = job.data;
    console.log(
      `[Notification Worker] Processing notification for appointment ${appt_ref}...`,
    );

    await sendConfirmationEmail(appt_ref);
  },
  { connection: redisConnection },
);

notificationWorker.on("completed", (job) => {
  console.log(`[Notification Worker] Job ${job.id} completed successfully.`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message);
});
