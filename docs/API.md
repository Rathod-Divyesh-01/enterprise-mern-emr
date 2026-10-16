# API reference

Base URL: `http://localhost:5000/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`. Responses use `{ success, data, message? }` unless an error is returned. Liveness check is `GET /health`.

## Authentication

- `POST /auth/login` — `{ email, password }`; returns access token, refresh token, and safe user fields.
- `POST /auth/refresh` — `{ refreshToken }`; returns a fresh access token.
- `POST /auth/logout` — authenticated; revokes the stored refresh token.

## Appointments and doctors

- `GET /doctors` — authenticated doctor directory.
- `POST /doctors` — Super Admin only; create a linked profile for an active DOCTOR account, including weekly sessions.
- `GET /slots?doctorId=<id>&date=YYYY-MM-DD` — authenticated availability.
- `GET /appointments` — authenticated and paginated; doctor role is restricted to their own schedule.
- `POST /appointments` — Super Admin/Receptionist; creates a patient if requested, verifies the slot against doctor schedule, and blocks duplicate reservations.
- `PUT /appointments/:id` — Super Admin/Receptionist update visit fields; assigned doctor may update notes or mark complete.
- `POST /appointments/:id/arrive` and `DELETE /appointments/:id` — Super Admin/Receptionist.

## Patients and users

- `GET /patients?search=<name|mobile|patientId>&page=1&limit=10` — authenticated; doctors receive only patients with an appointment relationship.
- `POST /patients` — Super Admin/Receptionist; validates registration fields.
- `GET /patients/:id` — authenticated; doctor authorization is checked against appointments.
- `POST /patients/:id/clinical-notes` — assigned doctor only; note must reference that doctor's appointment.
- `GET /users`, `POST /users`, `PATCH /users/:id` — Super Admin only.
- `GET /dashboard/stats` — authenticated role-aware system totals.

Validation errors are HTTP 400, unauthenticated requests 401, forbidden roles 403, missing resources 404, and duplicate slot/email/mobile conflicts 409. This starter is not a production API security assessment.
