import PatientModel from "../models/patient.model.js";
import { buildErrorMessage } from "../libs/utils.js";

const validatePatient = (body) => {
  const { patient_name, patient_email, patient_phone } = body || {};
  if (!patient_name || !patient_email || !patient_phone) {
    return "patient_name, patient_email and patient_phone are required";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient_email)) {
    return "Invalid email format";
  }
  return null;
};

const handleDbError = (res, error) => {
  if (error.code === "ER_DUP_ENTRY") {
    return res
      .status(409)
      .json(
        buildErrorMessage("A patient with that email or phone already exists"),
      );
  }
  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return res
      .status(409)
      .json(
        buildErrorMessage("Patient has related records and cannot be deleted"),
      );
  }
  res.status(500).json(buildErrorMessage("An error occured"));
};

export const getPatients = async (req, res) => {
  try {
    const patients = await PatientModel.findAll();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json(buildErrorMessage("An error occured"));
  }
};

export const getPatientById = async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await PatientModel.findById(id);
    if (!patient) {
      return res.status(404).json(buildErrorMessage("No patient found"));
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json(buildErrorMessage("An error occured"));
  }
};

export const createPatient = async (req, res) => {
  const validationError = validatePatient(req.body);
  if (validationError) {
    return res.status(400).json(buildErrorMessage(validationError));
  }
  try {
    const patient = await PatientModel.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const validationError = validatePatient(req.body);
  if (validationError) {
    return res.status(400).json(buildErrorMessage(validationError));
  }
  try {
    const patient = await PatientModel.update(id, req.body);
    if (!patient) {
      return res.status(404).json(buildErrorMessage("No patient found"));
    }
    res.status(200).json(patient);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deletePatient = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await PatientModel.delete(id);
    if (!deleted) {
      return res.status(404).json(buildErrorMessage("No patient found"));
    }
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
