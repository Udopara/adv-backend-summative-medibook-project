import { Worker } from "bullmq";
import * as AppointmentWaitlist from "../services/appointment-waitlist.service.js";
import { redisConnection } from "../config/redis.js";
import AppointmentModel from "../models/appointment.model.js";
import { notificationQueue } from "../libs/queue.js";
import Logger from "../libs/logger.js";

export const waitlistWorker = new Worker(
  "appointment-waitlist",
  async (job) => {

    const { doctor_id, freed_datetime, room } = job.data;
    console.log(`[Waitlist Worker] Processing waitlist for doctor ${doctor_id}...`);

    const appointmentData =
      await AppointmentWaitlist.getNextAppointmentFromWaitlist(doctor_id);

    if (!appointmentData) {
      console.log(`[Waitlist Worker] No patients waiting for doctor ${doctor_id}`);
      return null;
    }

    const slotToBook = freed_datetime
      ? new Date(freed_datetime)
      : new Date(appointmentData.apptDate);

    const roomToUse = room || appointmentData.room;

    try {
      const bookedAppt = await AppointmentModel.book({
        patient_id: appointmentData.patient_id,
        doctor_id: appointmentData.doctor_id,
        room: roomToUse,
        apptDate: slotToBook,
      });

      await AppointmentWaitlist.removeNextAppointmentFromWaitlist(doctor_id);

      await Logger.logBooking({ appointmentRef: bookedAppt.appt_ref });

      await notificationQueue.add("send-notification", {
        appt_ref: bookedAppt.appt_ref,
      });

      console.log(
        `[Waitlist Worker] Successfully promoted patient ${appointmentData.patient_id} into freed slot ${bookedAppt.appt_datetime} (${bookedAppt.appt_ref})`,
      );

      return bookedAppt;
    } catch (error) {
      console.error(
        `[Waitlist Worker] Failed to book waitlisted patient ${appointmentData.patient_id}:`,
        error.message,
      );
      throw error;
    }
  },
  { connection: redisConnection },
);

waitlistWorker.on("completed", (job) => {
  console.log(`[Waitlist Worker] Job ${job.id} completed successfully.`);
});

waitlistWorker.on("failed", (job, err) => {
  console.error(`[Waitlist Worker] Job ${job?.id} failed:`, err.message);
});
