import DoctorModel from "../models/doctor.model.js";
import { AppError } from "../libs/appError.js";

const validateDoctor = (body) => {
  const { doctor_name, speciality, consultation_fee } = body || {};
  if (!doctor_name || !speciality || consultation_fee === undefined) {
    throw new AppError(
      "doctor_name, speciality and consultation_fee are required",
      400,
    );
  }
  const fee = Number(consultation_fee);
  if (consultation_fee === "" || Number.isNaN(fee) || fee < 0) {
    throw new AppError("consultation_fee must be a non-negative number", 400);
  }
};

export const getDoctors = async (req, res) => {
  const doctors = await DoctorModel.findAll();
  res.status(200).json(doctors);
};

export const getDoctorById = async (req, res) => {
  const doctor = await DoctorModel.findById(req.params.id);
  if (!doctor) throw new AppError("No doctor found", 404);
  res.status(200).json(doctor);
};

export const getDoctorStats = async (req, res) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    throw new AppError("Doctor id must be a positive integer", 400);
  }
  const stats = await DoctorModel.getStats(numId);
  if (!stats) throw new AppError("No doctor found", 404);
  res.status(200).json(stats);
};

export const createDoctor = async (req, res) => {
  validateDoctor(req.body);
  const doctor = await DoctorModel.create(req.body);
  res.status(201).json(doctor);
};

export const updateDoctor = async (req, res) => {
  validateDoctor(req.body);
  const doctor = await DoctorModel.update(req.params.id, req.body);
  if (!doctor) throw new AppError("No doctor found", 404);
  res.status(200).json(doctor);
};

export const deleteDoctor = async (req, res) => {
  const deleted = await DoctorModel.delete(req.params.id);
  if (!deleted) throw new AppError("No doctor found", 404);
  res.status(204).send();
};
