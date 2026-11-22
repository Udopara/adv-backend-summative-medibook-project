import AppointmentModel from "../models/appointment.model.js";
import { AppError } from "../libs/appError.js";
import { parseApptDatetime, validateSlot } from "../libs/appointmentRules.js";
import Logger from "../libs/logger.js";
import { notificationQueue } from "../libs/queue.js";

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

export const getAppointmentByRef = async (req, res) => {
  const appointment = await AppointmentModel.findByRef(req.params.ref);
  if (!appointment) throw new AppError("Appointment not found", 404);
  res.status(200).json(appointment);
};

export const bookAppointment = async (req, res) => {
  const { patient_id, doctor_id, room, appt_datetime } = req.body || {};

  if (!patient_id || !doctor_id || !room || !appt_datetime) {
    throw new AppError(
      "patient_id, doctor_id, room and appt_datetime are required",
      400,
    );
  }
  if (!isPositiveInt(patient_id) || !isPositiveInt(doctor_id)) {
    throw new AppError("patient_id and doctor_id must be positive integers", 400);
  }
  if (typeof room !== "string" || room.trim().length === 0 || room.length > 20) {
    throw new AppError("room must be a non-empty string of at most 20 characters", 400);
  }
  const apptDate = parseApptDatetime(appt_datetime);
  if (!apptDate) {
    throw new AppError(
      "appt_datetime must be a valid date in the format YYYY-MM-DD HH:mm",
      400,
    );
  }

  const slotError = validateSlot(apptDate);
  if (slotError) throw new AppError(slotError, 422);

  const appointment = await AppointmentModel.book({
    patient_id: Number(patient_id),
    doctor_id: Number(doctor_id),
    room: room.trim(),
    apptDate,
  });

  if (appointment.status === "waitlisted") {
    return res.status(200).json(appointment);
  }

  res.status(201).json(appointment);
  Logger.logBooking({ appointmentRef: appointment.appt_ref });

  notificationQueue.add("send-notification", {
    appt_ref: appointment.appt_ref
  });
};

export const cancelAppointment = async (req, res) => {
  const cancellation = await AppointmentModel.cancel(req.params.ref);

  res.status(200).json({
    message: `Appointment cancelled. Refund: ${cancellation.refund_amount.toFixed(2)} (${cancellation.refund_percent}%)`,
    ...cancellation,
  });

  Logger.logCancellation({appointmentRef: cancellation.appt_ref})
};

export const getBusyDaysReport = async (req, res) => {
  const threshold = req.query.threshold !== undefined ? Number(req.query.threshold) : 80;
  if (Number.isNaN(threshold) || threshold < 0 || threshold > 100) {
    throw new AppError("threshold must be a number between 0 and 100", 400);
  }

  const busyDays = await AppointmentModel.busyDays(threshold);
  res.status(200).json(busyDays);
};
