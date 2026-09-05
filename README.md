# CivicDesk — City Complaint & Service Platform API

A backend for citizens to file complaints against city departments and apply for paid
municipal services, with staff handling and admin oversight.

## Roles
- **CITIZEN** — files complaints, applies for services, pays fees
- **STAFF** — handles complaints/requests for their assigned department
- **ADMIN** — manages departments, service types, users, and views platform-wide stats

## Stack
Node.js, TypeScript, Express, PostgreSQL + Prisma, Zod, JWT auth + Google OAuth,
Cloudinary (attachments), SSLCommerz (payments).

## Structure
```
src/
  config/       env, cloudinary
  lib/          prisma client singleton
  middlewares/  auth, rbac, validation, rate limiting, error handling
  modules/      auth, users, departments, complaints, serviceTypes,
                serviceRequests, payments, notifications, admin
  routes/       mounts all module routers under /api/v1
prisma/
  schema.prisma
  seed.ts
```

## Payment flow
`ServiceRequest` (PENDING_PAYMENT) → `/payments/initiate` opens an SSLCommerz session →
gateway redirects to success/fail/cancel → status independently re-verified via
SSLCommerz's validation API (never trusted from the redirect alone) → `ServiceRequest`
moves to PAID → staff processes it through PROCESSING → APPROVED/REJECTED → COMPLETED.
An IPN webhook (`/payments/webhook`) is the server-to-server source of truth.

## Complaint status flow
PENDING → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED (or → REJECTED at PENDING/ASSIGNED/IN_PROGRESS).
Every transition is written to `ComplaintActivity` for the audit trail and triggers a notification.
