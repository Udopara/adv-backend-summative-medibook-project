import express from "express";
import {
  getDoctorsReport,
  getBusyDaysReport,
} from "../controllers/report.controllers.js";

const router = express.Router();

router.get("/doctors", getDoctorsReport);
router.get("/busy-days", getBusyDaysReport);

export default router;
