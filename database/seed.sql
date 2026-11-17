-- database/seed.sql
-- Sample data for clinic_appointments.
-- Doctor 1 has 11 appointments on 2026-12-01: near a 12-slot daily cap.
-- Doctor 3 intentionally has no appointments.

USE clinic_appointments;

START TRANSACTION;

INSERT INTO Patient
    (patient_id, patient_name, patient_email, patient_phone)
VALUES
    (1, 'Amara Nwosu', 'amara.nwosu@example.com', '+250788100101'),
    (2, 'Daniel Okafor','daniel.okafor@example.com','+250788100102'),
    (3, 'Grace Mensah', 'grace.mensah@example.com', '+250788100103'),
    (4, 'Chinedu Eze', 'chinedu.eze@example.com', '+250788100104');

INSERT INTO Doctor
    (doctor_id, doctor_name, speciality, consultation_fee)
VALUES
    (1, 'Dr. Aline Mukamana', 'General Practice', 25000.00),
    (2, 'Dr. Samuel Kato', 'Cardiology', 40000.00),
    (3, 'Dr. Imani Niyonzima','Dermatology', 35000.00);

INSERT INTO Appointment
    (appt_ref, room, appt_datetime, amount_paid, booked_on, patient_id, doctor_id)
VALUES
    -- Eleven distinct slots for Doctor 1 on the same day (12-slot cap).
    ('APT-2026-001', 'Room 1', '2026-12-01 08:00:00', 25000.00, '2026-11-20 09:00:00', 1, 1),
    ('APT-2026-002', 'Room 1', '2026-12-01 09:00:00', 25000.00, '2026-11-20 09:15:00', 2, 1),
    ('APT-2026-003', 'Room 1', '2026-12-01 10:00:00', 15000.00, '2026-11-20 09:30:00', 3, 1),
    ('APT-2026-004', 'Room 1', '2026-12-01 11:00:00', 25000.00, '2026-11-20 09:45:00', 4, 1),
    ('APT-2026-005', 'Room 1', '2026-12-01 12:00:00', 25000.00, '2026-11-20 10:00:00', 1, 1),
    ('APT-2026-006', 'Room 1', '2026-12-01 13:00:00', 25000.00, '2026-11-20 10:15:00', 2, 1),
    ('APT-2026-007', 'Room 1', '2026-12-01 14:00:00', 25000.00, '2026-11-20 10:30:00', 3, 1),
    ('APT-2026-008', 'Room 1', '2026-12-01 15:00:00', 25000.00, '2026-11-20 10:45:00', 4, 1),
    ('APT-2026-009', 'Room 1', '2026-12-01 16:00:00', 25000.00, '2026-11-20 11:00:00', 1, 1),
    ('APT-2026-010', 'Room 1', '2026-12-01 17:00:00', 25000.00, '2026-11-20 11:15:00', 2, 1),
    ('APT-2026-011', 'Room 1', '2026-12-01 18:00:00', 25000.00, '2026-11-20 11:30:00', 3, 1),

    -- Doctor 2 has appointments on a different day.
    ('APT-2026-012', 'Room 2', '2026-12-02 09:30:00', 40000.00, '2026-11-21 08:30:00', 4, 2),
    ('APT-2026-013', 'Room 2', '2026-12-02 11:00:00', 20000.00, '2026-11-21 08:45:00', 1, 2);

COMMIT;
