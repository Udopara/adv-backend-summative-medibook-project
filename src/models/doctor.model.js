import pool from "../config/db.js";

class DoctorModel {
  static async findAll() {
    const [rows] = await pool.execute("SELECT * FROM Doctor");

    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM Doctor WHERE doctor_id = ?",
      [id],
    );

    return rows[0];
  }

  static async create({ doctor_name, speciality, consultation_fee }) {
    const [result] = await pool.execute(
      "INSERT INTO Doctor (doctor_name, speciality, consultation_fee) VALUES (?, ?, ?)",
      [doctor_name, speciality, consultation_fee],
    );

    return this.findById(result.insertId);
  }

  static async update(id, { doctor_name, speciality, consultation_fee }) {
    const [result] = await pool.execute(
      "UPDATE Doctor SET doctor_name = ?, speciality = ?, consultation_fee = ? WHERE doctor_id = ?",
      [doctor_name, speciality, consultation_fee, id],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async getStats(id) {
    const doctor = await this.findById(id);
    if (!doctor) return null;

    const [[stats]] = await pool.execute(
      `SELECT 
         COALESCE(SUM(
           CASE 
             WHEN status = 'booked' THEN amount_paid
             WHEN status = 'cancelled' THEN (amount_paid - COALESCE(refund_amount, 0))
             ELSE 0
           END
         ), 0) AS revenue_collected,
         COUNT(CASE WHEN status = 'booked' AND appt_datetime > NOW() THEN 1 END) AS upcoming_appointment_count
       FROM Appointment
       WHERE doctor_id = ?`,
      [id],
    );

    const [rows] = await pool.execute(
      `SELECT 
         DATE_FORMAT(appt_datetime, '%Y-%m-%d') AS date,
         COUNT(*) AS appointments_count
       FROM Appointment
       WHERE doctor_id = ?
         AND status = 'booked'
         AND DATE(appt_datetime) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(appt_datetime)`,
      [id],
    );

    const countsByDate = {};
    for (const row of rows) {
      countsByDate[row.date] = Number(row.appointments_count);
    }

    const pad = (n) => String(n).padStart(2, "0");
    const next7Days = [];
    let totalSevenDayAppointments = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const count = countsByDate[dateStr] || 0;
      const utilization = Number(((count / 12) * 100).toFixed(2));

      totalSevenDayAppointments += count;

      next7Days.push({
        date: dateStr,
        appointments_count: count,
        utilization_percent: utilization,
      });
    }

    const sevenDayUtilization = Number(
      ((totalSevenDayAppointments / (7 * 12)) * 100).toFixed(2),
    );

    return {
      doctor_id: doctor.doctor_id,
      doctor_name: doctor.doctor_name,
      speciality: doctor.speciality,
      revenue_collected: Number(stats.revenue_collected),
      upcoming_appointment_count: Number(stats.upcoming_appointment_count),
      next_7_days: next7Days,
      seven_day_total_appointments: totalSevenDayAppointments,
      seven_day_utilization_percent: sevenDayUtilization,
    };
  }

  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM Doctor WHERE doctor_id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  static async report() {
    const [rows] = await pool.execute(`
      SELECT 
        d.doctor_id,
        d.doctor_name,
        d.speciality,
        d.consultation_fee,
        COUNT(CASE WHEN a.status = 'booked' THEN 1 END) AS total_appointments,
        COALESCE(
          SUM(
            CASE 
              WHEN a.status = 'booked' THEN a.amount_paid 
              WHEN a.status = 'cancelled' THEN (a.amount_paid - COALESCE(a.refund_amount, 0)) 
              ELSE 0 
            END
          ), 
          0.00
        ) AS revenue_collected
      FROM Doctor d
      LEFT JOIN Appointment a 
        ON a.doctor_id = d.doctor_id
      GROUP BY d.doctor_id, d.doctor_name, d.speciality, d.consultation_fee
      ORDER BY total_appointments DESC, revenue_collected DESC, d.doctor_id ASC
    `);

    return rows.map((row) => ({
      doctor_id: row.doctor_id,
      doctor_name: row.doctor_name,
      speciality: row.speciality,
      consultation_fee: Number(row.consultation_fee),
      total_appointments: Number(row.total_appointments),
      revenue_collected: Number(row.revenue_collected),
    }));
  }
}

export default DoctorModel;
