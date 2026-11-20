import express from "express";
import {
  getDoctors,
  getDoctorById,
  getDoctorStats,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctor.controllers.js";

const router = express.Router();

router.get("/", getDoctors);
router.get("/:id/stats", getDoctorStats);
router.get("/:id", getDoctorById);
router.post("/", createDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;
