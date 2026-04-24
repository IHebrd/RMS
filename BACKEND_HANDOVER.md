# Backend Handover

## 1. Project Summary

This backend is the API for **RMS (Reclamation Management System)**.

Its job is to manage the full lifecycle of a reclamation:

1. A `user` creates a reclamation against one or more organizations.
2. A `responsable` inside the organization reviews it and moves it forward.
3. The `responsable` creates one or more `tasks` for `employer` users.
4. The `employer` executes the task, uploads proof, and can message about the work.
5. The `responsable` validates or rejects the proof and can distribute payment.
6. An `admin` manages the platform, organizations, roles, and global reporting.

This is a role-based Express API backed by PostgreSQL and file uploads.

## 2. Technology Stack

### Runtime and framework

- Node.js `>=18`
- Express `4.x`
- `express-async-errors` for async exception bubbling

### Database

- PostgreSQL
- `pg` / `pg-pool`
- Mostly raw SQL wrapped in model classes

### Authentication and security

- JWT via `jsonwebtoken`
- Password hashing via `bcryptjs`
- `helmet`
- `cors`
- `express-rate-limit`
- custom auth and role middleware

### Files and media

- `multer` for avatar and proof uploads
- local filesystem storage under `uploads/`

### Email

- `nodemailer`
- `handlebars` templates support in config/email.js
- email logging via `emails_notifications`

### Validation and misc

- `joi`
- `morgan`
- `compression`
- `winston` is installed but the code mainly uses console/file logging directly

## 3. Backend Entry Point

- Main entry: `server.js`
- Main route mount: `/api`
- Public health endpoints:
  - `/health`
  - `/api/info`
  - `/api/health`

At startup the server:

1. Loads env vars.
2. Connects to PostgreSQL.
3. Initializes the email transporter.
4. Applies security, compression, CORS, logging, and rate limiting middleware.
5. Serves `/uploads` as static files.

## 4. High-Level Architecture

The backend is organized in a classic layered style:

- `routes/`
  - declares API endpoints and role restrictions
- `controllers/`
  - handles request/response flow and business logic
- `models/`
  - custom SQL-based data access classes
- `services/`
  - reusable business helpers such as status, payments, email, references, balances
- `middleware/`
  - auth, uploads, validation, error handling
- `config/`
  - database, SMTP, multer
- `sql/`
  - schema and seed files

Important architecture note:

- `models/index.js` looks like an ORM association file with `belongsTo` / `hasMany`.
- The actual models are plain classes using SQL queries.
- The codebase mostly **does not use an ORM runtime**. The real source of truth is:
  - the SQL schema,
  - the model query methods,
  - the controllers.

## 5. Folder Guide

### Core folders

- `config/database.js`
  - PostgreSQL pool, query helper, transactions, DB stats
- `config/email.js`
  - SMTP transporter and Handlebars email template loading
- `controllers/`
  - all role-specific business logic
- `middleware/authMiddleware.js`
  - JWT verification and role authorization
- `middleware/errorMiddleware.js`
  - centralized error formatting and logging
- `middleware/uploadMiddleware.js`
  - avatar/proof upload configuration
- `models/`
  - SQL classes for each entity
- `services/`
  - status transitions, payment logic, email sending, balance management
- `sql/schema.sql`
  - enums, tables, and DB structure
- `sql/seed.sql`
  - demo/test data

## 6. Domain Actors

### 6.1 Admin

Responsibilities:

- manage organizations
- manage responsables
- manage admins
- inspect all reclamations, tasks, payments, proofs, and messages
- view global dashboards and stats

Main API namespace:

- `/api/admin`
- `/api/reclamations`
- `/api/tasks`
- `/api/payments`
- `/api/proofs`
- `/api/messages`
- `/api/dashboard/admin`

### 6.2 Responsable

Responsibilities:

- see reclamations linked to their organization
- update organization-side reclamation status
- create and manage employees
- create, update, and validate tasks
- validate proofs uploaded by employees
- distribute payment
- view payment history and team performance

Main API namespace:

- `/api/responsable`

### 6.3 Employer

Responsibilities:

- see assigned tasks
- start, complete, or fail tasks
- upload/delete proof files
- view wallet/balance
- edit profile/avatar
- exchange messages on task-related reclamation threads

Main API namespace:

- `/api/employer`

### 6.4 User

Responsibilities:

- register and log in
- create reclamations
- choose target organizations
- track reclamation progress
- cancel pending reclamations
- view detail/timeline/messages
- edit profile/avatar

Main API namespace:

- `/api/auth`
- `/api/user`

## 7. Core Business Entities

Defined in `sql/schema.sql`.

### Main enums

- `organization_type`: `public`, `private`, `association`
- `reclamation_type`: `electrique`, `numerique`, `securite`, `voirie`, `plomberie`, `autre`
- `urgency_level`: `normal`, `urgent`, `tres_urgent`
- `status_type`: `pending`, `in_progress`, `validated`, `failed`, `archived`
- `task_status_type`: `assigned`, `in_progress`, `completed`, `failed`
- `payment_status_type`: `pending`, `paid`
- `actor_type`: `admin`, `responsable`, `employer`, `user`

### Main tables

- `organizations`
- `admin`
- `responsable`
- `employer`
- `"user"`
- `reclamations`
- `reclamation_organizations`
- `tasks`
- `proofs`
- `payment_distributions`
- `payment_items`
- `emails_notifications`
- `status_history`
- `reclamation_messages`

### Relationship model

- A `user` creates many `reclamations`
- A `reclamation` can target multiple `organizations`
- That many-to-many link is stored in `reclamation_organizations`
- A `responsable` belongs to one organization
- An `employer` belongs to one organization
- A `task` belongs to one `reclamation_organization` and one `employer`
- A `proof` belongs to one `task`
- A `payment_distribution` belongs to one `reclamation_organization`
- A `payment_item` belongs to one distribution and usually one employer/task
- `status_history` tracks changes on reclamations, reclamation_organizations, and tasks
- `reclamation_messages` is the messaging thread layer

## 8. Authentication and Authorization

### JWT payload

Tokens carry:

- `id`
- `table`
- `role`

### Auth flow

- Login checks each actor table in sequence:
  - `admin`
  - `responsable`
  - `employer`
  - `user`
- Matching email + bcrypt password creates a JWT
- Middleware resolves the actor again from the correct model/table

### Auth middleware

`middleware/authMiddleware.js` provides:

- `protect`
  - requires `Authorization: Bearer <token>`
- `authorize(...roles)`
  - checks role membership
- `checkOrganizationAccess`
  - extra organization ownership check

### Session behavior

- token expiry default: `7d`
- inactive accounts are blocked
- unauthorized requests return structured JSON errors

## 9. Response and Error Conventions

### Common success shape

Most endpoints return:

```json
{
  "success": true,
  "data": {}
}
```

Sometimes they also include:

- `message`
- `pagination`

### Common error shape

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message"
  }
}
```

### Error handling

Centralized in `middleware/errorMiddleware.js`.

Handled error families:

- validation errors
- JWT errors
- PostgreSQL constraint errors
- Multer upload errors
- custom app errors

Errors are also logged to:

- console
- `logs/errors.log`

## 10. Upload and Media Behavior

Managed in `middleware/uploadMiddleware.js`.

### Avatar uploads

- stored in `uploads/avatars/`
- images only
- size limit: 5 MB

### Proof uploads

- stored in:
  - `uploads/proofs/images/`
  - `uploads/proofs/videos/`
- image and video supported
- size limit: 50 MB
- default maximum proofs per task: controlled by env, fallback `10`

### Public media access

The backend serves `uploads/` statically.

## 11. Email Behavior

There are two email layers:

- `config/email.js`
  - transporter + Handlebars template loading
- `services/emailService.js`
  - application-level send helpers and audit logging

Email is used for:

- welcome email
- account creation email
- reclamation creation confirmation
- status changes
- task assignment
- task completion/failure notification
- payment received

The app logs outbound email attempts to `emails_notifications`.

## 12. Status Workflow Rules

Implemented in `services/statusService.js`.

### Reclamation transitions

- `pending` -> `in_progress`, `archived`
- `in_progress` -> `validated`, `failed`, `pending`
- `validated` -> `archived`
- `failed` -> `pending`, `archived`

### Task transitions

- `assigned` -> `in_progress`, `failed`
- `in_progress` -> `completed`, `failed`, `assigned`
- `completed` -> no next state
- `failed` -> `assigned`

### Automatic parent updates

- when all tasks for a reclamation are completed, the parent reclamation may be auto-marked `validated`
- when all organization links are validated, the parent reclamation may also be auto-marked `validated`

## 13. API Catalog

Base URL in local development is typically:

`http://localhost:5000/api`

### 13.1 Public and utility endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | server-level health |
| `GET` | `/api/info` | public API metadata |
| `GET` | `/api/health` | router-level health |

### 13.2 Auth endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/login` | public | actor login |
| `POST` | `/auth/register` | public | register a `user` only |
| `POST` | `/auth/logout` | protected | logout |
| `POST` | `/auth/refresh-token` | protected | refresh token pattern placeholder/current user refresh |
| `PUT` | `/auth/change-password` | protected | change current password |

### 13.3 User endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/user/organizations` | list available organizations |
| `GET` | `/user/profile` | get profile |
| `PUT` | `/user/profile` | update profile |
| `POST` | `/user/profile/avatar` | upload avatar |
| `POST` | `/user/reclamations` | create reclamation |
| `GET` | `/user/reclamations` | list own reclamations |
| `GET` | `/user/reclamations/:id` | reclamation detail |
| `GET` | `/user/reclamations/:id/tracking` | tracking/timeline |
| `PUT` | `/user/reclamations/:id/cancel` | cancel reclamation |
| `POST` | `/user/reclamations/:id/messages` | send message |
| `GET` | `/user/reclamations/:id/messages` | get thread messages |

### 13.4 Responsable endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/responsable/dashboard` | organization dashboard |
| `GET` | `/responsable/reclamations` | org reclamations |
| `GET` | `/responsable/reclamations/:id` | reclamation detail |
| `PUT` | `/responsable/reclamations/:id/status` | update status |
| `POST` | `/responsable/employees` | create employee |
| `POST` | `/responsable/employees/bulk` | bulk create employees |
| `GET` | `/responsable/employees` | list employees |
| `GET` | `/responsable/employees/:id` | employee detail |
| `PUT` | `/responsable/employees/:id` | update employee |
| `PUT` | `/responsable/employees/:id/deactivate` | deactivate employee |
| `PUT` | `/responsable/employees/:id/activate` | activate employee |
| `DELETE` | `/responsable/employees/:id` | delete employee |
| `POST` | `/responsable/tasks` | create task(s) |
| `GET` | `/responsable/tasks` | list tasks |
| `GET` | `/responsable/tasks/:id` | task detail |
| `PUT` | `/responsable/tasks/:id` | update task |
| `PUT` | `/responsable/tasks/:id/validate` | validate task result |
| `PUT` | `/responsable/tasks/:id/proofs/validate` | validate or reject proofs |
| `POST` | `/responsable/payments/distribute` | distribute payment |
| `GET` | `/responsable/payments/history` | payment history |

### 13.5 Employer endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/employer/dashboard` | dashboard |
| `GET` | `/employer/profile` | get profile |
| `PUT` | `/employer/profile` | update profile |
| `POST` | `/employer/profile/avatar` | upload avatar |
| `GET` | `/employer/tasks` | list assigned tasks |
| `GET` | `/employer/tasks/:id` | task detail |
| `PUT` | `/employer/tasks/:id/start` | start task |
| `PUT` | `/employer/tasks/:id/complete` | complete task |
| `PUT` | `/employer/tasks/:id/fail` | fail task |
| `POST` | `/employer/tasks/:id/proofs` | upload proofs |
| `DELETE` | `/employer/proofs/:id` | delete own proof |
| `GET` | `/employer/balance` | wallet/balance |
| `POST` | `/employer/tasks/:id/messages` | send message |
| `GET` | `/employer/tasks/:id/messages` | get messages |

### 13.6 Admin-only management endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/admin/organizations` | create organization |
| `GET` | `/admin/organizations` | list organizations |
| `GET` | `/admin/organizations/:id` | organization detail |
| `PUT` | `/admin/organizations/:id` | update organization |
| `DELETE` | `/admin/organizations/:id` | delete organization |
| `POST` | `/admin/responsables` | create responsable |
| `GET` | `/admin/responsables` | list responsables |
| `PUT` | `/admin/responsables/:id` | update responsable |
| `DELETE` | `/admin/responsables/:id` | delete responsable |
| `POST` | `/admin/admins` | create admin |
| `GET` | `/admin/admins` | list admins |
| `PUT` | `/admin/admins/:id` | update admin |
| `DELETE` | `/admin/admins/:id` | delete admin |

### 13.7 Admin-wide operational endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/reclamations/stats` | public in code | reclamation stats |
| `GET` | `/reclamations` | admin | all reclamations |
| `GET` | `/reclamations/:id` | admin | reclamation detail |
| `DELETE` | `/reclamations/:id` | admin | delete reclamation |
| `GET` | `/tasks` | admin | all tasks |
| `GET` | `/tasks/:id` | admin | task detail |
| `DELETE` | `/tasks/:id` | admin | delete task |
| `GET` | `/payments/stats` | public in code | payment stats |
| `GET` | `/payments/distributions` | admin | all payment distributions |
| `GET` | `/payments/distributions/:id` | admin | distribution detail |
| `DELETE` | `/payments/distributions/:id` | admin | delete distribution |
| `GET` | `/proofs/stats` | public in code | proof stats |
| `GET` | `/proofs` | admin | all proofs |
| `GET` | `/proofs/:id` | admin | proof detail |
| `GET` | `/proofs/task/:taskId` | admin | proofs by task |
| `DELETE` | `/proofs/:id` | admin | delete proof |
| `GET` | `/messages` | admin | all messages |
| `GET` | `/messages/reclamation/:reclamationId` | admin | thread by reclamation |
| `DELETE` | `/messages/:id` | admin | delete message |

### 13.8 Dashboard and analytics endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/dashboard/stats` | public in code | global stats with optional filters |
| `GET` | `/dashboard/admin` | admin | admin dashboard |
| `GET` | `/dashboard/performance` | responsable | team performance |

## 14. Validation Rules

Validation exists mostly through `Joi` schemas in `validations/`.

### Auth validation

- login requires valid email + password length >= 6
- register requires:
  - email
  - password
  - confirm_password
  - first_name
  - last_name
  - optional Tunisian phone/CIN validation

### Reclamation validation

- title minimum length
- description minimum length
- valid `type`
- valid `urgency`
- at least one target organization
- amount limits
- optional lat/lng validation

Note:

- not every available validation file is visibly wired into all routes
- some controllers still do manual validation as a second line of defense

## 15. Example Actor Scenarios Based on the API

### Scenario A: User submits a reclamation

1. `POST /auth/register`
2. `POST /auth/login`
3. `GET /user/organizations`
4. `POST /user/reclamations`
5. `GET /user/reclamations`
6. `GET /user/reclamations/:id/tracking`
7. `GET /user/reclamations/:id/messages`

Expected outcome:

- reclamation is created
- a reference like `REC-2026-000001` is assigned
- `status_history` gets an initial entry
- confirmation email may be sent

### Scenario B: Responsable receives and processes a reclamation

1. `POST /auth/login`
2. `GET /responsable/reclamations`
3. `GET /responsable/reclamations/:id`
4. `PUT /responsable/reclamations/:id/status`
5. `POST /responsable/tasks`

Expected outcome:

- organization-side status can move from `pending` to `in_progress`
- one or more tasks are assigned to employees
- employees receive email notifications if SMTP is configured

### Scenario C: Employer executes a task

1. `POST /auth/login`
2. `GET /employer/tasks`
3. `PUT /employer/tasks/:id/start`
4. `POST /employer/tasks/:id/proofs`
5. `PUT /employer/tasks/:id/complete`
6. `POST /employer/tasks/:id/messages`

Expected outcome:

- task status changes
- proof files are stored on disk
- status history is updated
- responsable may receive task completion notification

### Scenario D: Responsable validates proofs and pays employees

1. `GET /responsable/tasks/:id`
2. `PUT /responsable/tasks/:id/proofs/validate`
3. `POST /responsable/payments/distribute`
4. `GET /responsable/payments/history`

Expected outcome:

- task becomes `completed` or `failed`
- payment distribution is created
- payment items are created
- employee balance is affected
- payment email may be sent

### Scenario E: Admin audits the platform

1. `POST /auth/login`
2. `GET /dashboard/admin`
3. `GET /reclamations`
4. `GET /tasks`
5. `GET /payments/distributions`
6. `GET /proofs`
7. `GET /messages`

Expected outcome:

- admin sees cross-platform operational visibility
- data can be used for support, moderation, and reporting

## 16. Operational Notes

### Configuration

The backend depends on env values for:

- app mode and port
- DB connection
- JWT secrets
- SMTP credentials
- upload limits
- CORS origins
- rate limits

Do not commit real secrets in production.

### Running locally

Typical commands from `backend/`:

```bash
npm install
npm run dev
```

Available scripts:

- `npm start`
- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run format`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:reset`

### Seed data

`sql/seed.sql` provides demo data for all four actor categories plus organizations, reclamations, tasks, and messages.

## 17. Known Quirks and Risks

These are worth knowing before extending or deploying the backend.

### 17.1 Public analytics endpoints

The following are public in route code:

- `/dashboard/stats`
- `/reclamations/stats`
- `/payments/stats`
- `/proofs/stats`

If that is not intentional, they should be protected.

### 17.2 Placeholder route fallback pattern

Some route files wrap controller imports in `try/catch` and expose temporary `501 Not Implemented` handlers if imports fail.

That is convenient for boot resilience, but it can hide real wiring problems.

### 17.3 `models/index.js` is misleading

It looks like ORM association setup, but the real app is mostly raw SQL model classes.

### 17.4 Seed password hint appears stale

The seed file includes a password note, but the visible bcrypt hashes and comments should be treated carefully during onboarding/testing.

### 17.5 Mixed email infrastructure

There are two email setups:

- `config/email.js`
- `services/emailService.js`

This works, but it means email responsibilities are split across two places.

### 17.6 File storage is local

Uploads are stored on the local filesystem. For production:

- use persistent/shared storage
- secure file serving
- consider antivirus/content validation if required

### 17.7 Logging is simple

Logging is file-based and console-based. There is no centralized structured observability stack yet.

## 18. Suggested Onboarding Checklist for the Next Backend Owner

1. Verify DB schema matches all controller assumptions.
2. Verify seed credentials actually work in the target environment.
3. Review public stats endpoints and secure them if necessary.
4. Decide whether to keep the raw SQL model pattern or migrate to a formal ORM/query builder.
5. Consolidate email configuration into one clear layer.
6. Review upload storage strategy for production.
7. Add API documentation generation if external consumers will use the API.
8. Add more automated tests around auth, task lifecycle, and payment distribution.

## 19. Recommended Mental Model

The simplest way to understand this backend is:

- **Auth layer**
  - who is calling
- **Actor namespace**
  - what that role is allowed to do
- **Reclamation lifecycle**
  - complaint -> assignment -> execution -> proof -> validation -> payment
- **Cross-cutting systems**
  - files, email, status history, logging

If you keep those four layers in mind, the codebase becomes much easier to navigate.

