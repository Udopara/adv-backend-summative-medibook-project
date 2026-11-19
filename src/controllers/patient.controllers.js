import PatientModel from "../models/patient.model.js";
import { AppError } from "../libs/appError.js";

const validatePatient = (body) => {
  const { patient_name, patient_email, patient_phone } = body || {};
  if (!patient_name || !patient_email || !patient_phone) {
    throw new AppError(
      "patient_name, patient_email and patient_phone are required",
      400,
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient_email)) {
    throw new AppError("Invalid email format", 400);
  }
};

export const getPatients = async (req, res) => {
  const patients = await PatientModel.findAll();
  res.status(200).json(patients);
};

export const getPatientById = async (req, res) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) throw new AppError("No patient found", 404);
  res.status(200).json(patient);
};

export const createPatient = async (req, res) => {
  validatePatient(req.body);
  const patient = await PatientModel.create(req.body);
  res.status(201).json(patient);
};

export const updatePatient = async (req, res) => {
  validatePatient(req.body);
  const patient = await PatientModel.update(req.params.id, req.body);
  if (!patient) throw new AppError("No patient found", 404);
  res.status(200).json(patient);
};

export const deletePatient = async (req, res) => {
  const deleted = await PatientModel.delete(req.params.id);
  if (!deleted) throw new AppError("No patient found", 404);
  res.status(204).send();
};
