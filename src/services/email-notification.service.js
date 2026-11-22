import pool from "../config/db.js";
import Logger from "../libs/logger.js";

export async function sendConfirmationEmail(ref) {
  const [rows] = await pool.execute(
    `
        SELECT pat.patient_email, pat.patient_name, app.appt_ref, doc.doctor_name, app.appt_datetime, app.room, app.amount_paid
        FROM Appointment as app 
        JOIN Doctor as doc
        ON app.doctor_id = doc.doctor_id
        JOIN Patient as pat
        ON app.patient_id = pat.patient_id
        WHERE appt_ref = ?
      `,
    [ref],
  );

  if (!rows || rows.length === 0) {
    return;
  }

  const {
    patient_email,
    patient_name,
    appt_datetime,
    appt_ref,
    doctor_name,
    room,
    amount_paid,
  } = rows[0];

  const msg = `CONFIRMATION_EMAIL to ${patient_email}: Hello ${patient_name}, your appointment (${appt_ref}) with Dr. ${doctor_name} is confirmed for ${appt_datetime} in ${room}. Amount paid: RWF${amount_paid}.`;

  await Logger.logNotification({ message: msg });
}
