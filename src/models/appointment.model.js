import crypto from "node:crypto";
import pool from "../config/db.js";
import { AppError } from "../libs/appError.js";
import * as AppointmentWaitlist from "../services/appointment-waitlist.service.js";
import { waitlistQueue } from "../libs/queue.js";
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
        await conn.rollback();

        await AppointmentWaitlist.addAppointmentToWaitlist(doctor_id, {
          patient_id,
          doctor_id,
          room,
          apptDate: apptDate.toISOString(),
          requested_at: new Date().toISOString(),
        });

        return {
          status: "waitlisted",
          message: `Doctor is fully booked for this day (${DAILY_CAP} appointments). Patient added to waitlist.`,
          patient_id,
          doctor_id,
        };
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
        await AppointmentWaitlist.addAppointmentToWaitlist(doctor_id, {
          patient_id,
          doctor_id,
          room,
          apptDate: apptDate.toISOString(),
          requested_at: new Date().toISOString(),
        });

        return {
          status: "waitlisted",
          message: "This slot is already booked for the doctor. Patient added to waitlist.",
          patient_id,
          doctor_id,
        };
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
      try {
        await waitlistQueue.add("process-waitlist", {
          doctor_id: appt.doctor_id,
          freed_datetime: appt.appt_datetime,
          room: appt.room,
        });
      } catch (queueError) {
        console.error("Failed to notify waitlist queue:", queueError.message);
      }

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

  static async busyDays(thresholdPercent = 80) {
    const minSlots = (thresholdPercent * DAILY_CAP) / 100;

    const [rows] = await pool.execute(
      `SELECT 
         d.doctor_id,
         d.doctor_name,
         d.speciality,
         DATE_FORMAT(a.appt_datetime, '%Y-%m-%d') AS date,
         COUNT(a.appt_ref) AS appointments_count,
         ROUND((COUNT(a.appt_ref) / ${DAILY_CAP}) * 100, 2) AS utilization_percent
       FROM Appointment a
       JOIN Doctor d ON a.doctor_id = d.doctor_id
       WHERE a.status = 'booked'
       GROUP BY d.doctor_id, d.doctor_name, d.speciality, DATE(a.appt_datetime)
       HAVING COUNT(a.appt_ref) > ?
       ORDER BY DATE(a.appt_datetime) ASC, appointments_count DESC`,
      [minSlots],
    );

    return rows.map((row) => ({
      doctor_id: row.doctor_id,
      doctor_name: row.doctor_name,
      speciality: row.speciality,
      date: row.date,
      appointments_count: Number(row.appointments_count),
      utilization_percent: Number(row.utilization_percent),
    }));
  }
}

export default AppointmentModel;
