import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  getAppointmentByRef,
} from "../controllers/appointment.controllers.js";

const router = express.Router();

router.post("/", bookAppointment);
router.get("/:ref", getAppointmentByRef);
router.delete("/:ref", cancelAppointment);

export default router;
