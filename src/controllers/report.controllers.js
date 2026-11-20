import DoctorModel from "../models/doctor.model.js";
import AppointmentModel from "../models/appointment.model.js";
import { AppError } from "../libs/appError.js";

export const getDoctorsReport = async (req, res) => {
  const report = await DoctorModel.report();
  res.status(200).json(report);
};

export const getBusyDaysReport = async (req, res) => {
  const threshold =
    req.query.threshold !== undefined ? Number(req.query.threshold) : 80;

  if (Number.isNaN(threshold) || threshold < 0 || threshold > 100) {
    throw new AppError("threshold must be a number between 0 and 100", 400);
  }

  const busyDays = await AppointmentModel.busyDays(threshold);
  res.status(200).json(busyDays);
};
