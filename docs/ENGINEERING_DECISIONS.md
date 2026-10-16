# Engineering decisions and limitations

- Use CommonJS on the Express service to match the existing server; use Vite ES modules on the React client.
- Keep one API prefix (`/api/v1`) and use Vite proxying locally; the nginx container proxies API and Socket.IO requests to the Compose backend.
- Server authorization rechecks active users on each protected request, validates request payloads with Joi, and restricts doctor records to assigned relationships.
- Demo seed is development-only and idempotent; it never drops collections. Test suite uses Supertest without a Mongo connection.
- Appointment availability uses the doctor's weekly schedule and a database uniqueness index as a concurrency guard.
- JWT secrets and database connection strings are environment-only. Demo passwords are only for local development.
- This is a learning/development foundation, not a validated clinical product. Before real use, add threat modeling, encryption/key management, regulatory review, secure session design, audit retention, migrations, backups, monitoring, and broader authorization tests.
