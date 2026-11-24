# Final Assessment — Backend Development

**Weight:** 30% of final grade
**Duration:** 2 weeks
**Mode:** Individual project
**Stack (mandatory):** Node.js, Express.js, MySQL (with parameterized queries only), Redis

---

## Scenario — "MediBook" Clinic Appointment System

A community clinic wants a backend service for booking doctor appointments. Doctors see patients in fixed 30-minute slots during working hours (09:00–17:00), each doctor can handle at most **12 appointments per day**, and the clinic administrator needs reports. You will design the database, build the API, and handle the operational concerns (background jobs, logging, testing).

**Entity limit:** Your database must contain **exactly 3 entities**:

| Entity | Purpose |
|---|---|
| `patients` | People who book appointments |
| `doctors` | Doctors with a specialty, consultation fee, and room |
| `appointments` | A patient's booking with a doctor at a specific date/time (links the other two) |

You may add columns as needed, but no additional tables (lookup/locale JSON files don't count).

---

## Part A — Database Design & Normalization

The clinic currently tracks everything in this single spreadsheet:

| appt_ref | patient_name | patient_email | patient_phone | doctor_name | specialty | consultation_fee | room | appt_datetime | amount_paid | booked_on |
|---|---|---|---|---|---|---|---|---|---|---|
| AP-001 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:00 | 150.00 | 2026-07-01 |
| AP-002 | Kojo Owusu | kojo@mail.com | 0555-333-444 | Dr. Boateng | Dermatology | 150.00 | R-12 | 2026-08-10 09:30 | 120.00 | 2026-07-02 |
| AP-003 | Ama Mensah | ama@mail.com | 0244-111-222 | Dr. Adjei | Paediatrics | 100.00 | R-03 | 2026-08-15 10:00 | 100.00 | 2026-07-03 |

Study the spreadsheet, then produce a **database schema diagram** of your design in fully normalized form (up to 3NF). The diagram must show **everything**:

- all 3 entities with every column and its MySQL data type,
- primary keys and foreign keys, clearly marked,
- the relationships between the entities and their cardinality (1:N, etc.),
- every constraint that enforces a business rule (`NOT NULL`, `UNIQUE`, `CHECK`) — in particular, it must be visible from the diagram that *a doctor cannot have two appointments at the same date/time*.

Use any tool you like (dbdiagram.io, draw.io) and include it in your repository as `schema-diagram` (image or PDF).

## Part B — Database Implementation & Project Setup

1. **Table creation.** Translate your Part A diagram into a MySQL DDL script, `database/schema.sql`, that creates the database and the 3 tables — data types, primary keys, foreign keys, and every constraint shown on the diagram. The script must run cleanly on a fresh MySQL server. Also provide `database/seed.sql` with realistic sample data: at least 3 patients, 3 doctors (including one with no appointments), and 8 appointments (including one doctor-day at or near the 12-slot daily cap).

2. **Project structure.** Set up the Express project in a **models / controllers / routes** structure:

```
├── database/          schema.sql and seed.sql (Part B.1)
└── src/
    ├── models/        all application SQL lives here — nowhere else
    ├── controllers/   business logic; calls model functions, never the DB directly
    └── routes/        maps URLs and HTTP methods to controllers
```

Every SQL statement in the application must use **parameterized queries** (`?` placeholders via `mysql2`). SQL found in a controller or route file loses marks. **Do not use any ORM for this assignment.**

## Part C — Controllers & Endpoints

Implement endpoints for the operations below. **Designing the API is part of the assessment**: you choose the URL paths, the HTTP methods, and how the endpoints are grouped into controllers and routes — your choices should follow REST conventions and will be marked. The business rules listed are **requirements** — *how* you satisfy them is your design decision, and you will be asked to defend it at the viva.

1. **Basic CRUD** — standard **C**reate, **R**ead (one and all), **U**pdate, and **D**elete operations for patients and for doctors, with sensible validation. (Appointments get their create/delete behaviour from the two operations below — no separate CRUD needed there.)

2. **Book an appointment**. Rules that must always hold:
   - Appointments can only be booked in the future, within working hours (09:00–17:00), on a 30-minute slot boundary.
   - A doctor never exceeds 12 appointments in a day.
   - Two patients can never hold the same doctor slot — even when both requests arrive at the same instant.

3. **Cancel an appointment**. Rules:
   - The refund is computed by the server from the notice given: more than 48 hours → 100%; 24–48 hours → 50%; less than 24 hours → 0%. The response states the refund amount.
   - The cancellation and its refund record succeed or fail together.
   - A cancelled slot becomes bookable by another patient, while the cancellation record is kept for refund history.
   - A cancellation notifies the waitlist (Part E).

4. **Doctor statistics** — for a given doctor: revenue collected, upcoming appointment count, appointments per day for the next 7 days, and utilization % against the 12-slot daily cap.

Operations 5 and 6 are where your **advanced SQL** is assessed: the results must be produced by the SQL in your models (joins, aggregates, etc) — not fetched raw and computed in JavaScript.

5. **Doctors report** — every doctor's total appointments and revenue collected, including doctors with zero appointments.
6. **Busy days report** — every (doctor, date) where more than 80% of the 12-slot daily capacity is booked.

### General requirements (all endpoints)

Input validation with meaningful `400` messages; correct status codes (`201`, `404`, `409`, `422`); a central error-handling middleware.

## Part D — Node.js `fs` Module

**Audit log:** every successful booking and cancellation must be appended as a JSON line to `logs/audit.log` using the `fs` module (async, non-blocking — no `*Sync` calls inside request handlers). The logger must create the `logs/` directory on first run if it doesn't exist, and a logging failure must **not** fail the user's request.

## Part E — Queues & Redis

1. **Waitlist queue:** when the requested slot (or the doctor's whole day) is fully booked, offer the patient a waitlist spot — push them onto a queue (Redis list, or Bull/BullMQ). When a cancellation frees a slot, a **worker process** (separate from the web server) pops the first waitlisted patient and books them in. Think through: what happens if the promoted booking itself fails? The patient must not simply vanish from both the queue and the appointments table.
2. **Notification jobs:** every confirmed appointment enqueues a "confirmation SMS/email" job; the worker processes it by writing the message to the audit log (no real sending needed).

## Part F — Unit Testing

Using Jest, write **at least 6 meaningful unit tests**:

- The refund calculator from Part C.3 — cover all three tiers **and both boundaries** (exactly 24 hours, exactly 48 hours). Boundary behaviour must match your documented policy.
- One validation function of your choice — e.g., the slot-alignment/working-hours check — including at least one edge case (17:00 exactly? 09:15? a malformed date?).

Tests must not require a live MySQL or Redis connection — that's the point of extracting pure functions. `npm test` must run them.

## Part G — i18n & l10n: Course Feedback Page

Create a **simple HTML page** (served by your Express app at `GET /feedback`) containing a short course-feedback form with **exactly 5 essay questions** (each answered in a `<textarea>`):

1. Which topic in this course did you find most challenging, and why?
2. Describe one concept you understood only after the practical assignments. What made it click?
3. How has your approach to designing databases or APIs changed since the start of the trimester?
4. What would you improve about how this course was taught or assessed?
5. How do you plan to apply what you learned in this course going forward?

**i18n/l10n requirement (keep it simple):** the page title, instructions, and all 5 questions must be loaded from locale files (e.g., `locales/en.json` and `locales/fr.json` — English plus one other language of your choice). Visiting `/feedback?lang=fr` shows the translated page; the default is English, and an unsupported `lang` value must fall back to English rather than crash. Display today's date on the page formatted for the active locale (e.g., using `Intl.DateTimeFormat`).

---

## Submission Requirements

- Git repository (with meaningful commit history — a single "final commit" will be questioned) containing:
  - `schema-diagram` (image or PDF), `schema.sql`, and `seed.sql` (as specified in Part B)
  - Application source, worker process, tests, locale files
  - `README.md` with: setup steps, `.env.example`, and the short written justifications requested in Parts C, D, and E
- The app must start with `npm install && npm start` (plus documented MySQL/Redis setup) and tests with `npm test`.
- A short **viva/demo (10 minutes)** walkthrough.

**Automatic penalties:** SQL injection vector anywhere in the app (−15), secrets committed to the repo (−5), app does not start per README instructions (−10), work the student cannot explain in the video (or at a follow-up viva if called) | Academic integrity referral; affected criteria re-scored at Developing or below |


---

## Project Documentation & Implementation Details

### Video Demo Walkthrough
- **10-minute Video Demo Walkthrough:** [Video Link](https://youtu.be/BOFssyO80DU) *(Click here to watch the full project and code walkthrough)*

---

### Setup & Installation Guide

#### 1. Prerequisites
- **Node.js**: v20.x or higher
- **MySQL Server**: v8.0 or higher
- **Redis Server**: v6.x or higher

#### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd adv-backend-summative-medibook-project
npm install
```

#### 3. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Open `.env` and configure your credentials:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=clinic_appointments

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### 4. Database Setup & Seeding
Ensure your MySQL server is running, then load the schema and seed data:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
*Note: `schema.sql` creates the database `clinic_appointments` and the 3 normalized entities (`Patient`, `Doctor`, `Appointment`) with all constraints and generated columns. `seed.sql` populates sample patients, doctors, and appointments (including a doctor near the 12-slot daily cap and a doctor with zero appointments).*

#### 5. Running the Application
Start the services in two separate terminal windows:

**Terminal 1 — Web API Server:**
```bash
npm start
# Or for auto-reloading during development:
# npm run dev
```
The server will start listening at `http://localhost:3000`.

**Terminal 2 — Background Queue Worker Process:**
```bash
npm run worker
```
The BullMQ worker process will start listening to the waitlist promotion and email notification queues.

#### 6. Running Unit Tests
Unit tests are implemented using Jest and test pure domain functions in isolation without requiring live MySQL or Redis connections:
```bash
npm test
```

---

### Written Architectural Justifications

### Part C — Controllers, Endpoints & Database Architecture

#### 1. RESTful Routing & Architecture
- **Resource Orientation:** Routes are partitioned cleanly into dedicated modules (`/patient`, `/doctor`, `/appointment`, and `/report`).
- **Separation of Concerns:** Controllers handle input validation and HTTP responses, delegating all database operations strictly to Models. Neither controllers nor route handlers contain raw SQL statements.
- **Central Error Handling:** The application leverages Express 5's automatic rejection forwarding. Custom operational errors are thrown via `AppError(message, statusCode)` and handled by a central error middleware (`src/middleware/errorHandler.js`). Database errors (such as duplicate entries and foreign key constraints) and malformed JSON payloads are mapped to HTTP `400`, `404`, `409`, or `422` with consistent JSON error structures.

#### 2. The 3-Entity Limit & The Active Slot Pattern
The project brief strictly specifies: *"exactly 3 entities: patients, doctors, appointments... no additional tables"*.
- **The Challenge:** When an appointment is cancelled, the doctor's time slot must become immediately re-bookable by another patient, while the original record must be preserved for financial and refund auditing. A standard `UNIQUE (doctor_id, appt_datetime)` constraint would block any subsequent booking attempts.
- **The Solution:** We implemented the **Generated Column Pattern**:
  ```sql
  active_slot DATETIME AS (IF(status = 'booked', appt_datetime, NULL)) STORED,
  CONSTRAINT uq_doctor_active_slot UNIQUE (doctor_id, active_slot)
  ```
  In MySQL, a `UNIQUE` constraint permits multiple `NULL` values. When an appointment is booked, `active_slot` stores `appt_datetime`. When cancelled, its status updates to `'cancelled'`, making `active_slot` automatically evaluate to `NULL`. This immediately releases the slot for other patients while keeping full cancellation and refund history in the same table without creating extra tables.

#### 3. Concurrency Control & The 12-Slot Daily Cap
- **Race Condition Prevention:** To prevent simultaneous requests from bypassing the 12-appointment daily limit, booking runs inside an explicit MySQL transaction:
  ```sql
  SELECT consultation_fee FROM Doctor WHERE doctor_id = ? FOR UPDATE;
  ```
  The `FOR UPDATE` clause places an exclusive row-level lock on the Doctor record. Concurrent booking requests for the same doctor are serialized (queued one after another). The current day's bookings are counted (`COUNT(*) WHERE status = 'booked'`), and if the cap is reached, the transaction rolls back before inserting.
- **Double-Booking Guarantee:** The `uq_doctor_active_slot` constraint serves as the final, immutable database engine barrier preventing two patients from ever securing the same slot at the exact same millisecond.

#### 4. Tiered Refund Business Rules
Cancellation notice is calculated on the server against the scheduled `appt_datetime`:
- `> 48 hours`: 100% refund
- `24 to 48 hours`: 50% refund (including boundaries at exactly 48.0h and 24.0h)
- `< 24 hours`: 0% refund
Both status transition and refund recording occur in a single atomic transaction.

#### 5. Advanced SQL Queries (Models)
- **Doctors Report (`DoctorModel.report`):**
  Uses a `LEFT JOIN` between `Doctor` and `Appointment` combined with `COUNT(CASE WHEN a.status = 'booked' THEN 1 END)` and `COALESCE(SUM(...), 0.00)` to include all doctors, specifically retaining doctors with zero appointments.
- **Busy Days Report (`AppointmentModel.busyDays`):**
  Uses `JOIN Doctor`, `GROUP BY d.doctor_id, DATE(a.appt_datetime)`, and `HAVING COUNT(a.appt_ref) > ?` to dynamically identify days exceeding 80% utilization (more than 9.6 slots, i.e., 10+ bookings).

---

### Part D — Node.js `fs` Module & Audit Logging

- **Non-Blocking Asynchronous I/O:** Every successful booking and cancellation appends a structured JSON line entry to `logs/audit.log` using `node:fs/promises` (`appendFile` and `mkdir`). Synchronous (`*Sync`) methods are strictly avoided.
- **Automatic Directory Creation:** `mkdir(dirname(filePath), { recursive: true })` ensures the `logs/` directory is created on first write without crashing.
- **Failure Isolation:** Audit logging operations are isolated within error-handling boundaries so that an unexpected file system error never fails the user's primary HTTP request or transaction.

---

### Part E — Queues, Redis & Background Workers

#### 1. Waitlist Queue Architecture
- **Queue Structure:** Fully booked slots or doctor-days push patients onto a FIFO queue (`waitlist:<doctor_id>` in Redis).
- **Event-Driven Promotion:** When an appointment is cancelled, the web server pushes a lightweight event job to BullMQ (`appointment-waitlist`).
- **Resilient Worker Design (Failure Recovery):**
  The assessment asks: *"What happens if the promoted booking itself fails? The patient must not simply vanish from both the queue and the appointments table."*
  - The worker uses a **peek-before-delete** pattern:
    1. It reads the head of the waitlist (`lindex 0`) without removing the record.
    2. It attempts to book the patient into MySQL using `AppointmentModel.book()`.
    3. **Only upon a successful database commit** does it execute `removeNextAppointmentFromWaitlist()` (`lpop`).
    4. If the database insertion fails (e.g. database timeout or lock conflict), the patient is **never deleted from Redis** and remains at the front of the queue, ensuring no data loss.

#### 2. Notification Background Jobs
- When an appointment is confirmed, a `send-notification` job is pushed to the BullMQ `notification-list` queue.
- The background worker processes the job asynchronously by joining appointment and patient data, generating a personalized confirmation message, and writing it directly to `logs/audit.log` via the `Logger` service.
- Both workers are unified under `src/workers/index.js` and managed via `npm run worker`.

---

### Part F & G — Testing and Internationalization Overview
- **Unit Testing (Part F):** 11 tests covering all three refund tiers, exact boundaries (24h, 48h), working hours boundaries (17:00, 09:15), and malformed dates. Run with `npm test`.
- **Multilingual Support (Part G):** Fully localized course feedback page (`/feedback`) supporting English (`en`), French (`fr`), and Igbo (`ig`) with `Intl.DateTimeFormat` date localization and safe fallback to English.
