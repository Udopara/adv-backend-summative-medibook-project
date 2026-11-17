import DoctorModel from "../models/doctor.model.js";
import { buildErrorMessage } from "../libs/utils.js";

const validateDoctor = (body) => {
  const { doctor_name, speciality, consultation_fee } = body || {};
  if (!doctor_name || !speciality || consultation_fee === undefined) {
    return "doctor_name, speciality and consultation_fee are required";
  }
  const fee = Number(consultation_fee);
  if (consultation_fee === "" || Number.isNaN(fee) || fee < 0) {
    return "consultation_fee must be a non-negative number";
  }
  return null;
};

const handleDbError = (res, error) => {
  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return res
      .status(409)
      .json(buildErrorMessage("Doctor has related records and cannot be deleted"));
  }
  res.status(500).json(buildErrorMessage("An error occured"));
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await DoctorModel.findAll();
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json(buildErrorMessage("An error occured"));
  }
};

export const getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await DoctorModel.findById(id);
    if (!doctor) {
      return res.status(404).json(buildErrorMessage("No doctor found"));
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json(buildErrorMessage("An error occured"));
  }
};

export const createDoctor = async (req, res) => {
  const validationError = validateDoctor(req.body);
  if (validationError) {
    return res.status(400).json(buildErrorMessage(validationError));
  }
  try {
    const doctor = await DoctorModel.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const validationError = validateDoctor(req.body);
  if (validationError) {
    return res.status(400).json(buildErrorMessage(validationError));
  }
  try {
    const doctor = await DoctorModel.update(id, req.body);
    if (!doctor) {
      return res.status(404).json(buildErrorMessage("No doctor found"));
    }
    res.status(200).json(doctor);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await DoctorModel.delete(id);
    if (!deleted) {
      return res.status(404).json(buildErrorMessage("No doctor found"));
    }
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
