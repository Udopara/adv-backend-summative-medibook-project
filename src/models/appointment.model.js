import crypto from "node:crypto";
import pool from "../config/db.js";
import { AppError } from "../libs/appError.js";
import {
  DAILY_CAP,
  computeRefundAmount,
  computeRefundPercent,
  toMysqlDatetime,
} from "../libs/appointmentRules.js";

const generateRef = () =>
  `APT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

class AppointmentModel {
  static async findByRef(ref) {
    const [rows] = await pool.execute(
      `SELECT appt_ref, room, appt_datetime, amount_paid, booked_on, patient_id,
              doctor_id, status, cancelled_on, refund_amount
       FROM Appointment WHERE appt_ref = ?`,
      [ref],
    );

    return rows[0];
  }

  static async book({ patient_id, doctor_id, room, apptDate }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [doctors] = await conn.execute(
        "SELECT consultation_fee FROM Doctor WHERE doctor_id = ? FOR UPDATE",
        [doctor_id],
      );
      if (doctors.length === 0) throw new AppError("Doctor not found", 404);

      const [patients] = await conn.execute(
        "SELECT patient_id FROM Patient WHERE patient_id = ?",
        [patient_id],
      );
      if (patients.length === 0) throw new AppError("Patient not found", 404);

      const apptDatetime = toMysqlDatetime(apptDate);

      const [[{ booked }]] = await conn.execute(
        `SELECT COUNT(*) AS booked FROM Appointment
         WHERE doctor_id = ? AND status = 'booked' AND DATE(appt_datetime) = DATE(?)`,
        [doctor_id, apptDatetime],
      );
      if (booked >= DAILY_CAP) {
        throw new AppError(
          `Doctor is fully booked for this day (${DAILY_CAP} appointments)`,
          409,
        );
      }

      const apptRef = generateRef();
      await conn.execute(
        `INSERT INTO Appointment
           (appt_ref, room, appt_datetime, amount_paid, booked_on, patient_id, doctor_id)
         VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [apptRef, room, apptDatetime, doctors[0].consultation_fee, patient_id, doctor_id],
      );

      await conn.commit();
      return this.findByRef(apptRef);
    } catch (error) {
      await conn.rollback();
      if (
        error.code === "ER_DUP_ENTRY" &&
        error.sqlMessage?.includes("uq_doctor_active_slot")
      ) {
        throw new AppError("This slot is already booked for the doctor", 409);
      }
      throw error;
    } finally {
      conn.release();
    }
  }

  static async cancel(ref, now = new Date()) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        "SELECT * FROM Appointment WHERE appt_ref = ? FOR UPDATE",
        [ref],
      );
      if (rows.length === 0) throw new AppError("Appointment not found", 404);

      const appt = rows[0];
      if (appt.status === "cancelled") {
        throw new AppError("Appointment is already cancelled", 409);
      }
      const apptDate = new Date(appt.appt_datetime);
      if (apptDate.getTime() <= now.getTime()) {
        throw new AppError("Past appointments cannot be cancelled", 422);
      }

      const refundPercent = computeRefundPercent(apptDate, now);
      const refundAmount = computeRefundAmount(appt.amount_paid, refundPercent);
      const cancelledOn = toMysqlDatetime(now);

      await conn.execute(
        `UPDATE Appointment
         SET status = 'cancelled', cancelled_on = ?, refund_amount = ?
         WHERE appt_ref = ?`,
        [cancelledOn, refundAmount, ref],
      );

      await conn.commit();

      return {
        appt_ref: appt.appt_ref,
        doctor_id: appt.doctor_id,
        patient_id: appt.patient_id,
        appt_datetime: appt.appt_datetime,
        amount_paid: Number(appt.amount_paid),
        refund_percent: refundPercent,
        refund_amount: refundAmount,
        cancelled_on: cancelledOn,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

export default AppointmentModel;
