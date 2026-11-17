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

  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM Doctor WHERE doctor_id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }
}

export default DoctorModel;
