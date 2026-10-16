# Database schema

- **User** — normalized unique email, bcrypt-hashed password (`select: false`), role (`SUPER_ADMIN`, `RECEPTIONIST`, `DOCTOR`), active flag, optional refresh token.
- **Doctor** — unique linked doctor user, department, specialization, weekly availability sessions and breaks.
- **Patient** — unique generated patient ID and mobile number, name, contact, age, gender, synthetic medical history, clinical notes referencing a doctor and appointment.
- **Appointment** — patient, doctor, booking user, date, start/end slot, department, purpose, status, and clinician notes. A compound unique index prevents concurrent double booking.
- **AuditLog** — actor ID/role, action, entity, entity ID, and limited non-secret details.

The app uses a MongoDB URI supplied through `MONGO_URI` (or `MONGODB_URI`). Tests do not drop or modify any database. The demo seed only upserts the specified demo accounts and doctor profile; production seeding is refused.

Clinical data is not encrypted at the application layer, and this schema has not been reviewed for any regulatory compliance. Use synthetic records only.
