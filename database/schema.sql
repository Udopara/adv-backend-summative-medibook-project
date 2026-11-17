CREATE DATABASE IF NOT EXISTS clinic_appointments;

USE clinic_appointments;

CREATE TABLE IF NOT EXISTS Patient (
    patient_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    patient_name    VARCHAR(120) NOT NULL,
    patient_email   VARCHAR(254) NOT NULL,
    patient_phone   VARCHAR(30) NOT NULL,

    CONSTRAINT pk_patient PRIMARY KEY (patient_id),
    CONSTRAINT uq_patient_email UNIQUE (patient_email),
    CONSTRAINT uq_patient_phone UNIQUE (patient_phone)
);

CREATE TABLE IF NOT EXISTS Doctor (
    doctor_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    doctor_name        VARCHAR(120) NOT NULL,
    speciality         VARCHAR(100) NOT NULL,
    consultation_fee   DECIMAL(10, 2) NOT NULL,

    CONSTRAINT pk_doctor PRIMARY KEY (doctor_id),
    CONSTRAINT chk_doctor_consultation_fee CHECK (consultation_fee >= 0)
);

CREATE TABLE IF NOT EXISTS Appointment (
    appt_ref        VARCHAR(20) NOT NULL,
    room            VARCHAR(20) NOT NULL,
    appt_datetime   DATETIME NOT NULL,
    amount_paid     DECIMAL(10, 2) NOT NULL,
    booked_on       DATETIME NOT NULL,
    patient_id      INT UNSIGNED NOT NULL,
    doctor_id       INT UNSIGNED NOT NULL,

    CONSTRAINT pk_appointment PRIMARY KEY (appt_ref),
    CONSTRAINT chk_appointment_amount_paid CHECK (amount_paid >= 0),

    CONSTRAINT uq_doctor_appointment_datetime
        UNIQUE (doctor_id, appt_datetime),

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient (patient_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES Doctor (doctor_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
