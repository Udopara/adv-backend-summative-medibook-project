import pool from "../config/db.js";

class PatientModel {
  static async findAll() {
    const [rows] = await pool.execute("SELECT * FROM Patient");

    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM Patient WHERE patient_id = ?",
      [id],
    );

    return rows[0];
  }

  static async create({ patient_name, patient_email, patient_phone }) {
    const [result] = await pool.execute(
      "INSERT INTO Patient (patient_name, patient_email, patient_phone) VALUES (?, ?, ?)",
      [patient_name, patient_email, patient_phone],
    );

    return this.findById(result.insertId);
  }

  static async update(id, { patient_name, patient_email, patient_phone }) {
    const [result] = await pool.execute(
      "UPDATE Patient SET patient_name = ?, patient_email = ?, patient_phone = ? WHERE patient_id = ?",
      [patient_name, patient_email, patient_phone, id],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM Patient WHERE patient_id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }
}

export default PatientModel;
