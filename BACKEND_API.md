# Backend API — CareConnect Nurse

This is the API contract between the CareConnect Nurse mobile app and the backend. Every endpoint listed here is consumed by code in [data/](data/); the mobile mocks in [data/mock/](data/mock/) mirror the response shapes one-for-one.

---

## Table of contents

1. [Conventions](#1-conventions)
2. [Authentication & profile](#2-authentication--profile)
3. [Permissions / rules](#3-permissions--rules)
4. [Dashboard](#4-dashboard)
5. [Patients](#5-patients)
6. [Lab results](#6-lab-results)
7. [Scheduler / appointments](#7-scheduler--appointments)
8. [Visits — read & status transitions](#8-visits--read--status-transitions)
9. [Visit forms — write](#9-visit-forms--write)
10. [Reference data — embedded in Visit response](#10-reference-data--embedded-in-visit-response)
11. [Endpoint summary](#11-endpoint-summary)

---

## 1. Conventions

### Base URL & headers
| Header | Value |
|---|---|
| `Authorization` | `Bearer <accessToken>` (from login or verify-face) |
| `Accept-Language` | `en` or `ar` |
| `X-Lang` | mirrors `Accept-Language` |

Base URL is configurable; default in dev is `https://staging.goconnect.com` ([constants/env.ts](constants/env.ts)). Request timeout: 15 s.

### Response envelope

**Success.** All success responses are wrapped:
```json
{ "data": <payload> }
```
The mobile client unwraps `.data` automatically.

**Error.** All error responses return:
```json
{ "message": "Human-readable error" }
```
The client surfaces `message` to the user.

| Status | Meaning |
|---|---|
| `200` / `201` | Success with body. |
| `204` | Success, no body. |
| `400` | Validation error / bad payload. |
| `401` | Missing or expired access token — app signs the user out. |
| `403` | Authenticated but lacks the required permission rule. |
| `404` | Resource not found. |
| `409` | Conflict. |
| `422` | Semantic validation. |
| `500` | Server error. |

### Image uploads (multipart/form-data)

Endpoints that carry images (signatures, photos, PDFs) use `multipart/form-data` instead of JSON. The convention is identical everywhere:

- One text field named **`data`** — JSON-stringified non-image payload.
- One file field per image, named after what it is (`patient_signature`, `nurse_signature`, `attachment`, …).
- File fields are **all optional**. The `data` field is mandatory.

The backend should **store each uploaded image** (e.g. on S3) and return the public URL inside the `Visit` response. Signatures the app receives back are URLs, not base64.

The three endpoints that use this pattern:

| Endpoint | File parts |
|---|---|
| §9.1.15 Post-Treatment | `patient_signature`, `nurse_signature` |
| §9.5 Referral | `attachment` |
| §9.6 Refusal | `witness_signature`, `relative_signature`, `doctor_signature`, `interpreter_signature` |

All other endpoints use `application/json`.

### Visit single-source-of-truth

`GET /visits/{id}` returns the full visit, including every nested form (flow sheet, all progress notes, refusals, referrals, SARI screenings, signatures, etc.). **Every mutation that touches a visit returns the updated `Visit` object** — the mobile app re-renders directly from the response, no extra round-trip.

---

## 2. Authentication & profile

Source: [data/auth_repository.ts](data/auth_repository.ts), [data/models/auth.ts](data/models/auth.ts).

### 2.1 Login
`POST /auth/login`

Sign in with username + password. The app stores `accessToken` in `AsyncStorage`.

**Request**
```json
{ "username": "string", "password": "string" }
```

**Response**
```json
{
  "data": {
    "accessToken": "string",
    "user": {
      "id": "string",
      "name": "string",
      "role": "string",
      "hospital": "string | null",
      "email": "string",
      "phone": "string | null",
      "face_token": "string | null",
      "department": "string | null",
      "employeeId": "string",
      "avatarUrl": "string | null"
    }
  }
}
```

### 2.2 Get current user
`GET /me`

Restore session on app launch.

**Request** — none.

**Response**
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "role": "string",
    "hospital": "string | null",
    "email": "string",
    "phone": "string | null",
    "face_token": "string | null",
    "department": "string | null",
    "employeeId": "string",
    "avatarUrl": "string | null"
  }
}
```

### 2.3 Update profile
`PATCH /me`

**Request**
```json
{ "name": "string", "phone": "string" }
```

**Response** — same shape as §2.2 (the updated `User`):
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "role": "string",
    "hospital": "string | null",
    "email": "string",
    "phone": "string | null",
    "face_token": "string | null",
    "department": "string | null",
    "employeeId": "string",
    "avatarUrl": "string | null"
  }
}
```

### 2.4 Register
`POST /auth/register`

**Request**
```json
{
  "registerCode": "string",
  "phone": "string",
  "fullName": "string",
  "email": "string"
}
```

**Response** — `204`. (The flow continues to OTP verification.)

### 2.5 Verify OTP
`POST /auth/verify-otp`

**Request**
```json
{
  "purpose": "register | reset_password",
  "identifier": "string (email or phone)",
  "otp": "string"
}
```

**Response**
```json
{ "data": { "resetToken": "string (only when purpose=reset_password)" } }
```

### 2.6 Forgot password
`POST /auth/forgot-password`

Sends a reset OTP to the email.

**Request**
```json
{ "email": "string" }
```

**Response** — `204`.

### 2.7 Reset password
`POST /auth/reset-password`

Uses the `resetToken` returned by §2.5.

**Request**
```json
{
  "email": "string",
  "resetToken": "string",
  "newPassword": "string"
}
```

**Response** — `204`.

### 2.8 Change password
`POST /auth/change-password`

**Request**
```json
{ "currentPassword": "string", "newPassword": "string" }
```

**Response** — `204`.

### 2.9 Logout
`POST /auth/logout`

**Request / Response** — none. The client clears the stored token regardless of HTTP outcome.

### 2.10 Delete account
`POST /auth/delete-account`

**Request**
```json
{ "password": "string", "confirmation": "DELETE" }
```

**Response** — `204`.

### 2.11 Register device for push  *(profile sync)*
`POST /me/device-token`

Sync the device's FCM token + platform with the user. Called automatically (a) on app launch after `GET /me` succeeds, and (b) right after a successful login or verify-face.

**Request**
```json
{
  "fcm_token": "string | null",
  "device_type": "ios | android"
}
```
- `fcm_token` is `null` when no token yet (permission denied or not provisioned). Treat `null` as a clear-token signal.

**Response** — `204`.

### 2.12 Verify face *(biometric login)*
`POST /auth/verify-face`

Authenticate with a previously-issued `face_token` (returned by §2.1, kept in OS secure storage on the device). Called after the user passes the device biometric prompt on the login screen.

**Request**
```json
{ "face_token": "string" }
```

**Response** — same shape as §2.1 (a fresh `accessToken` and the full user). `face_token` MAY be rotated on each successful verify; the mobile client persists whatever value comes back.

```json
{
  "data": {
    "accessToken": "string",
    "user": {
      "id": "string",
      "name": "string",
      "role": "string",
      "hospital": "string | null",
      "email": "string",
      "phone": "string | null",
      "face_token": "string | null",
      "department": "string | null",
      "employeeId": "string",
      "avatarUrl": "string | null"
    }
  }
}
```

`401` if the token is invalid or revoked → the app clears its stored `face_token` and falls back to username/password.

---

## 3. Permissions / rules

Source: [data/rules_repository.ts](data/rules_repository.ts), [data/models/rules.ts](data/models/rules.ts).

### 3.1 Get rules
`GET /me/rules`

Action-level permission list for the authenticated user. The app calls this on launch (during the splash screen) and after every successful login or verify-face, then caches the result in `AppContext` so every screen can call `can("edit_profile")` synchronously.

**Request** — none.

**Response**
```json
{
  "data": {
    "rules": [
      "view_dashboard", "edit_profile", "view_patients",
      "submit_flow_sheet_pre_treatment_vitals", "..."
    ]
  }
}
```

### 3.2 Semantics

- `rules` is a flat array of action keys.
- A key in the array → the action is **enabled** in the UI.
- A key NOT in the array (or unknown) → the action is **disabled** (button hidden / API call short-circuited).
- The backend MUST recognise every key in §3.3 below. Adding new keys is forward-compatible (the app ignores ones it doesn't understand).

### 3.3 Canonical action catalogue

The mobile app currently checks **52 keys**. Source of truth: [data/models/rules.ts](data/models/rules.ts).

| Group | Keys |
|---|---|
| **Dashboard / shell** | `view_dashboard`, `view_notifications` |
| **Profile / account** | `view_profile`, `edit_profile`, `change_avatar`, `change_password`, `delete_account`, `logout` |
| **App settings** | `toggle_biometric`, `toggle_push_notifications`, `toggle_email_notifications`, `change_language`, `change_theme` |
| **Patients** | `view_patients`, `view_patient_detail`, `view_patient_alerts`, `view_patient_care_team`, `call_patient`, `navigate_to_patient_address` |
| **Lab results** | `view_lab_results`, `view_lab_order_pdf`, `view_lab_result_pdf` |
| **Schedule / appointments** | `view_schedule`, `view_appointment_detail`, `confirm_appointment`, `check_in_patient` |
| **Visits (read)** | `view_visits`, `view_visit_detail`, `start_visit`, `end_visit` |
| **Visit forms (write)** | `submit_flow_sheet_outside_dialysis`, `submit_flow_sheet_pre_treatment_vitals`, `submit_flow_sheet_machines`, `submit_flow_sheet_pain_assessment`, `submit_flow_sheet_fall_risk`, `submit_flow_sheet_nursing_actions`, `submit_flow_sheet_dialysis_parameters`, `submit_flow_sheet_alarms_test`, `submit_flow_sheet_intake_output`, `submit_flow_sheet_car`, `submit_flow_sheet_access`, `submit_flow_sheet_dialysate`, `submit_flow_sheet_anticoagulation`, `submit_flow_sheet_medications`, `submit_flow_sheet_post_treatment`, `submit_nursing_progress_note`, `submit_doctor_progress_note`, `submit_social_worker_progress_note`, `submit_referral`, `submit_refusal`, `submit_sari_screening`, `submit_inventory_usage` |

### 3.4 Errors
- `401` → token invalid/expired → app signs the user out.
- Any other failure → app keeps the previously-cached rules (so a flaky network does not silently lock out the user).

---

## 4. Dashboard

### 4.1 Dashboard stats
`GET /dashboard/stats`

KPI cards on the home screen.

**Request** — none.

**Response**
```json
{
  "data": {
    "totalPatients": 0,
    "todayVisits": 0,
    "pendingSchedules": 0,
    "completedVisits": 0
  }
}
```

---

## 5. Patients

Source: [data/patient_repository.ts](data/patient_repository.ts), [data/models/patient.ts](data/models/patient.ts).

### 5.1 List patients
`GET /patients`

**Request** — none.

**Response**
```json
{
  "data": [
    {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "string",
      "dob": "YYYY-MM-DD",
      "gender": "male | female",
      "phone": "string",
      "email": "string",
      "address": "string",
      "location": "string",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active | inactive",
      "lastVisit": "YYYY-MM-DD",
      "diagnosis": "string",
      "avatarUrl": "string | null",
      "careTeam": [
        { "name": "string", "role": "string", "phone": "string", "isPrimary": true }
      ]
    }
  ]
}
```

### 5.2 Patient detail
`GET /patients/{id}`

**Request** — none.

**Response** — single `Patient` (same shape as one element of §5.1).
```json
{
  "data": {
    "id": 1,
    "patientId": "P-2024-001",
    "mrn": "MRN-001",
    "name": "string",
    "dob": "YYYY-MM-DD",
    "gender": "male | female",
    "phone": "string",
    "email": "string",
    "address": "string",
    "location": "string",
    "bloodType": "A+",
    "codeStatus": "Full Code",
    "treatmentHoliday": false,
    "status": "active | inactive",
    "lastVisit": "YYYY-MM-DD",
    "diagnosis": "string",
    "avatarUrl": "string | null",
    "careTeam": [
      { "name": "string", "role": "string", "phone": "string", "isPrimary": true }
    ]
  }
}
```

### 5.3 Patient alerts
`GET /patients/{id}/alerts`

Allergies, isolation, contamination, and special instructions shown on the visit detail screen.

**Request** — none.

**Response**
```json
{
  "data": {
    "allergies": [{ "type": "drug", "value": "Penicillin" }],
    "contamination": ["MRSA"],
    "instructions": "string",
    "isolation": "Contact precautions"
  }
}
```

---

## 6. Lab results

Source: [data/labResult_repository.ts](data/labResult_repository.ts), [data/models/labResult.ts](data/models/labResult.ts).

### 6.1 Lab results for a patient
`GET /patients/{id}/lab-results`

**Request** — none.

**Response**
```json
{
  "data": [
    {
      "id": 139,
      "patientId": 1,
      "labCompany": "string",
      "addedBy": "string",
      "addedAt": "YYYY/MM/DD HH:mm AM/PM",
      "dueDate": "YYYY/MM/DD",
      "status": "pending | in_progress | result_ready | cancelled",
      "resultPdfUrl": "https://... | null",
      "labOrderPdfUrl": "https://... | null"
    }
  ]
}
```

---

## 7. Scheduler / appointments

Source: [data/scheduler_repository.ts](data/scheduler_repository.ts), [data/models/scheduler.ts](data/models/scheduler.ts).

### 7.1 List slots
`GET /scheduler/slots`

> *Optional query params expected later: `?date=YYYY-MM-DD&from=...&to=...`.*

**Request** — none.

**Response**
```json
{
  "data": [
    {
      "id": 1,
      "patientName": "string | null",
      "patientId": 1,
      "phone": "+966...",
      "address": "string",
      "time": "08:00",
      "endTime": "08:30",
      "type": "Follow-up | Consultation | Emergency | Break",
      "status": "confirmed | pending | cancelled | checked_in",
      "provider": "string",
      "instructions": "string",
      "visitDate": "YYYY/MM/DD",
      "procedureTime": "string",
      "visitTime": "08:00 AM",
      "hospital": "string",
      "insurance": "string",
      "doctorTime": "string",
      "careTeam": [
        { "name": "...", "role": "...", "phone": "...", "isPrimary": true }
      ]
    }
  ]
}
```

### 7.2 Slot detail
`GET /scheduler/slots/{id}`

**Request** — none.

**Response** — single `Slot` (same shape as one element of §7.1):
```json
{
  "data": {
    "id": 1,
    "patientName": "string | null",
    "patientId": 1,
    "phone": "+966...",
    "address": "string",
    "time": "08:00",
    "endTime": "08:30",
    "type": "Follow-up | Consultation | Emergency | Break",
    "status": "confirmed | pending | cancelled | checked_in",
    "provider": "string",
    "instructions": "string",
    "visitDate": "YYYY/MM/DD",
    "procedureTime": "string",
    "visitTime": "08:00 AM",
    "hospital": "string",
    "insurance": "string",
    "doctorTime": "string",
    "careTeam": [
      { "name": "...", "role": "...", "phone": "...", "isPrimary": true }
    ]
  }
}
```

### 7.3 Confirm appointment
`POST /scheduler/slots/{id}/confirm`

Transitions a slot from `pending` → `confirmed`. Rule: `confirm_appointment`.

**Request** — none.

**Response** — the updated `Slot` (same shape as §7.2). `status` will be `"confirmed"`:
```json
{
  "data": {
    "id": 1,
    "patientName": "string | null",
    "patientId": 1,
    "phone": "+966...",
    "address": "string",
    "time": "08:00",
    "endTime": "08:30",
    "type": "Follow-up | Consultation | Emergency | Break",
    "status": "confirmed",
    "provider": "string",
    "instructions": "string",
    "visitDate": "YYYY/MM/DD",
    "procedureTime": "string",
    "visitTime": "08:00 AM",
    "hospital": "string",
    "insurance": "string",
    "doctorTime": "string",
    "careTeam": [
      { "name": "...", "role": "...", "phone": "...", "isPrimary": true }
    ]
  }
}
```

### 7.4 Check in patient
`POST /scheduler/slots/{id}/check-in`

Transitions a slot from `confirmed` → `checked_in`. Rule: `check_in_patient`.

**Request** — none.

**Response** — the updated `Slot` (same shape as §7.2) with `status: "checked_in"`.

---

## 8. Visits — read & status transitions

Source: [data/visit_repository.ts](data/visit_repository.ts), [data/models/visit.ts](data/models/visit.ts).

### 8.1 List visits
`GET /visits`

**Request** — none.

**Response** — array of visits. Each element is the full `Visit` shape from §8.2.
```json
{ "data": [ { "...Visit..." }, { "...Visit..." } ] }
```

### 8.2 Visit detail *(single source of truth)*
`GET /visits/{id}`

The full Visit response. Every nested form is on this object — the app does not call separate endpoints for flow-sheet sections, progress notes, etc. on the read path.

**Request** — none.

**Response** — `{ "data": Visit }`. Full schema:

```jsonc
{
  "id": 1,
  "patientName": "string",
  "patientId": 1,
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "type": "string",
  "status": "completed | pending | confirmed | cancelled | in_progress | start_procedure | end_procedure",
  "provider": "string",
  "address": "string",
  "duration": 60,

  "careTeam": [{ "name": "...", "role": "...", "phone": "...", "isPrimary": true }],

  // ── Flow sheet snapshot (single home for everything captured during the visit). ──
  // Every field is optional — the flow sheet grows incrementally as the nurse
  // saves sections (§9.1). Backend should return only the fields that have
  // been populated so far; omit (or send null) the rest.
  "flowSheet": {
    "visitId": 1,
    "preTreatmentVitals": {
      "temperature": "string",
      "respiratoryRate": "string",
      "oxygenSaturation": "string",
      "bloodPressure": "string",
      "pulseRate": "string",
      "preWeight": "string",
      "dryWeight": "string",
      "ufGoal": "string",
      "rbs": "string"
    },
    "vitals": { "...same fields as §9.1.2 request..." },
    "bpSite": "string",
    "method": "string",
    "machine": "string",
    "pain": "string",
    "painDetails": { "...same fields as §9.1.4 request..." },
    "fallRisk": "string",
    "highFallRisk": false,
    "morseValues": { "a": 0, "b": 0, "c": 15, "d": 0, "e": 10, "f": 0 },
    "morseTotal": 25,
    "outsideDialysis": false,
    "alarmsTest": false,
    "nursingActions": [ /* §9.1.6 */ ],
    "dialysisParams": [ /* §9.1.7 */ ],
    "intake": "string",
    "output": "string",
    "car": { /* §9.1.10 */ },
    "dialysate": { /* §9.1.12 */ },
    "access": "string",
    "anticoagType": "string",
    "medAdmin": {
      "12": { "status": "yes", "timestamp": "ISO", "reason": "" },
      "13": { "status": "no",  "timestamp": "ISO", "reason": "Patient refused" }
    },
    "postTx": { /* §9.1.15 mobile post-tx fields */ },
    // Signatures stored remotely; backend exposes URLs only:
    "patientSignature": { "url": "https://.../signature.png", "signedAt": "ISO" },
    "nurseSignature":   { "url": "https://.../signature.png", "signedAt": "ISO" },
    "submittedAt": "ISO 8601 (only after Post-Treatment is saved)"
  },

  // ── All progress notes for this visit, grouped by author role. ──
  "progressNotes": {
    "nursing": [
      { "id": 1, "visitId": 1, "note": "...", "author": "...", "createdAt": "ISO" }
    ],
    "doctor": [
      { "id": 1, "visitId": 1, "note": "...", "vitalsSnapshot": { /* same as flowSheet.preTreatmentVitals */ },
        "isAddendum": false, "author": "...", "createdAt": "ISO" }
    ],
    "socialWorker": [
      { "id": 1, "visitId": 1, "note": "...", "location": "on_call | in_center",
        "author": "...", "createdAt": "ISO" }
    ]
  },

  "referrals": [
    {
      "id": 1, "visitId": 1,
      "referralDate": "YYYY-MM-DD",
      "primaryPhysician": "string",
      "referralBy": "string",
      "status": "Active | Completed | Cancelled",
      "referralType": "Outpatient | ...",
      "referralHospital": "string",
      "printOptions": { "monthlyMedicalReport": false, "systemMedicalReport": false,
                        "labResult": false, "last3FlowSheets": false },
      "referralReason": "string",
      "completionDate": "YYYY-MM-DD",
      "comments": "string",
      "attachmentUrl": "https://... | null",
      "attachmentName": "string | null",
      "createdAt": "ISO"
    }
  ],

  "refusals": [
    {
      "id": 1, "visitId": 1,
      "types": ["discontinuation", "refusal_consent"],
      "reason": "string",
      "risks": { "hyperkalemia": false, "cardiacArrest": false,
                 "pulmonaryEdema": false, "severeAcidosis": false, "others": "string" },
      "witness":     { "name": "...", "signed": true,  "signedAt": "ISO",
                        "signatureUrl": "https://.../signature.png", "address": "..." },
      "unableToSignReason": "string",
      "relative":    { "name": "...", "relationship": "Father|...|Other",
                        "signed": true, "signedAt": "ISO",
                        "signatureUrl": "https://.../signature.png" },
      "doctor":      { "name": "...", "signed": true, "signedAt": "ISO",
                        "signatureUrl": "https://.../signature.png" },
      "interpreter": { "name": "...", "signed": true, "signedAt": "ISO",
                        "signatureUrl": "https://.../signature.png" },
      "author": "...", "createdAt": "ISO"
    }
  ],

  "sariScreenings": [
    {
      "id": 1, "visitId": 1,
      "addressographPatientName": "string",
      "dateTime": "ISO",
      "sariFeatures": {...},
      "exposureCriteria": {...},
      "actions": {...},
      "author": "...", "createdAt": "ISO"
    }
  ],

  "medications": [
    {
      "id": 1, "drugName": "string", "form": "Tablet", "dosage": "500mg",
      "frequency": "BID", "route": "PO",
      "duration": "7", "durationPeriod": "days",
      "adminType": "scheduled", "instructions": "string"
    }
  ],

  "inventory": [
    { "id": 1, "name": "string", "itemNumber": "INV-001", "available": 25 }
  ]
}
```

### 8.3 Status transitions

Each transition returns the **full updated Visit** (same shape as §8.2) so the mobile cache stays consistent.

#### 8.3.1 Start visit
`POST /visits/{id}/start` — Rule: `start_visit`. Transitions `status` → `"in_progress"`.

**Request** — none.

**Response** — `{ "data": Visit }` with updated `status: "in_progress"`. See §8.2 for the full Visit schema.

#### 8.3.2 End visit
`POST /visits/{id}/end` — Rule: `end_visit`. Transitions `status` → `"completed"`.

**Request** — none.

**Response** — `{ "data": Visit }` with updated `status: "completed"`. See §8.2 for the full Visit schema.

#### 8.3.3 Save procedure times
`POST /visits/{id}/procedure-times` — Rule: `start_visit` (reused). Updates the manually-edited procedure start / end clock times; the visit's `status` is **not** changed.

**Request**
```json
{
  "startTime": "8:00 AM",
  "endTime":   "10:30 AM"
}
```
- Both fields are optional. Send only the ones the nurse edited; omit (or send `null`) the other.
- Format is the human-readable 12-hour clock string the nurse types in the form.

**Response** — `{ "data": Visit }`. See §8.2 for the full Visit schema.

---

## 9. Visit forms — write

All form submissions are scoped under a visit. **Every endpoint in this section responds with `{ "data": Visit }`** — the full updated Visit, same schema as §8.2. The mobile cache replaces its current Visit with the response, so partial updates (a single new note, a single saved section, etc.) must come back inside the full visit envelope. The app never reconstructs the visit from individual sub-resource responses.

> The Request bodies below are the **only** field-level documentation you need; for the Response shape, refer to §8.2 (it's huge — duplicating it on every endpoint would hurt readability).

### 9.1 Flow sheet — per-section

The flow sheet has 15 collapsible sections, each with its own Save button. Each Save posts to a section-specific endpoint and returns the updated Visit.

| # | Section | Method + Path | Rule |
|---|---|---|---|
| 9.1.1 | Outside Dialysis | `POST /visits/{id}/flow-sheet/outside-dialysis` | `submit_flow_sheet_outside_dialysis` |
| 9.1.2 | Pre-Treatment Vitals | `POST /visits/{id}/flow-sheet/pre-treatment-vitals` | `submit_flow_sheet_pre_treatment_vitals` |
| 9.1.3 | Machines | `POST /visits/{id}/flow-sheet/machines` | `submit_flow_sheet_machines` |
| 9.1.4 | Pain Assessment | `POST /visits/{id}/flow-sheet/pain-assessment` | `submit_flow_sheet_pain_assessment` |
| 9.1.5 | Fall Risk | `POST /visits/{id}/flow-sheet/fall-risk` | `submit_flow_sheet_fall_risk` |
| 9.1.6 | Nursing Action | `POST /visits/{id}/flow-sheet/nursing-actions` | `submit_flow_sheet_nursing_actions` |
| 9.1.7 | Dialysis Parameters | `POST /visits/{id}/flow-sheet/dialysis-parameters` | `submit_flow_sheet_dialysis_parameters` |
| 9.1.8 | Alarms Test | `POST /visits/{id}/flow-sheet/alarms-test` | `submit_flow_sheet_alarms_test` |
| 9.1.9 | Intake / Output | `POST /visits/{id}/flow-sheet/intake-output` | `submit_flow_sheet_intake_output` |
| 9.1.10 | CAR | `POST /visits/{id}/flow-sheet/car` | `submit_flow_sheet_car` |
| 9.1.11 | Access / Location | `POST /visits/{id}/flow-sheet/access` | `submit_flow_sheet_access` |
| 9.1.12 | Dialysate | `POST /visits/{id}/flow-sheet/dialysate` | `submit_flow_sheet_dialysate` |
| 9.1.13 | Anticoagulation | `POST /visits/{id}/flow-sheet/anticoagulation` | `submit_flow_sheet_anticoagulation` |
| 9.1.14 | Dialysis Medications | `POST /visits/{id}/flow-sheet/medications` | `submit_flow_sheet_medications` |
| 9.1.15 | Post Treatment | `POST /visits/{id}/flow-sheet/post-treatment` | `submit_flow_sheet_post_treatment` |

All 15 endpoints respond with `{ "data": Visit }` (the full updated Visit, schema in §8.2) on success, or `403` when the user lacks the matching rule. The Visit's `flowSheet` field will reflect the latest saved state for the section just submitted.

#### Request bodies (sections 9.1.1 – 9.1.14)

All 14 of these use `application/json` (only §9.1.15 below switches to multipart). Each request body has *only* the fields shown — extra fields are ignored.

```jsonc
// 9.1.1 Outside Dialysis
{ "outsideDialysis": true }

// 9.1.2 Pre-Treatment Vitals
{
  "vitals": {
    "height": "172", "preWeight": "80", "dryWeight": "78", "ufGoal": "2",
    "bpSystolic": "130", "bpDiastolic": "80",
    "temperature": "36.7", "spo2": "98", "hr": "78", "rr": "16", "rbs": "115"
  },
  "bpSite": "Right arm",
  "method": "Manual"
}

// 9.1.3 Machines
{ "machine": "Fresenius 4008S" }

// 9.1.4 Pain Assessment
{
  "pain": "3",
  "painDetails": {
    "toolUsed": "NRS", "location": "Lower back", "frequency": "Intermittent",
    "radiatingTo": "", "painType": "Dull", "occurs": "On movement",
    "ambulating": "Worse", "resting": "Better", "eating": "",
    "relievedBy": "Rest", "worsensBy": "Standing"
  }
}

// 9.1.5 Fall Risk
{
  "fallRisk": "Moderate",
  "highFallRisk": false,
  "morseValues": { "a": 0, "b": 0, "c": 15, "d": 0, "e": 10, "f": 0 },
  "morseTotal": 25
}

// 9.1.6 Nursing Action
{
  "nursingActions": [
    { "time": "08:30", "focus": "Hypotension", "action": "Saline bolus 250ml",
      "evaluation": "BP returned to 110/70", "name": "Sara" }
  ]
}

// 9.1.7 Dialysis Parameters
{
  "dialysisParams": [
    { "time": "09:00", "systolic": "120", "diastolic": "80", "site": "right",
      "pulse": "78", "dialysateRate": "500", "uf": "1.0", "bfr": "300",
      "dialysateVol": "120", "ufVol": "1.0", "venous": "180", "effluent": "200",
      "access": "AV fistula", "alarms": "none", "initials": "SJ" }
  ]
}

// 9.1.8 Alarms Test
{ "alarmsTest": true }

// 9.1.9 Intake / Output
{ "intake": "500ml", "output": "1500ml" }

// 9.1.10 CAR
{ "car": { "ffPercent": "20", "dialyzer": "F8HPS", "temp": "36.5" } }

// 9.1.11 Access / Location
{ "access": "Right arm AV fistula" }

// 9.1.12 Dialysate
{ "dialysate": { "na": "138", "hco3": "32", "k": "2", "glucose": "100" } }

// 9.1.13 Anticoagulation
{ "anticoagType": "Heparin" }

// 9.1.14 Dialysis Medications
{
  "medAdmin": {
    "12": { "status": "yes", "timestamp": "2026-04-26T09:14:00Z", "reason": "" },
    "13": { "status": "no",  "timestamp": "2026-04-26T09:15:00Z", "reason": "Patient refused" }
  }
}
// medAdmin keys are medication IDs. Each value is
// { status: "yes" | "no" | null, timestamp: ISO 8601, reason: string }.
```

#### Request body — 9.1.15 Post-Treatment *(multipart)*

`Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | text (JSON string) | yes | `{ "postTx": { ... } }` |
| `patient_signature` | file (`image/png`) | optional | Patient signature PNG. |
| `patient_signature_signed_at` | text (ISO) | optional | Sent only if the file is sent. |
| `nurse_signature` | file (`image/png`) | optional | Nurse witness signature PNG. |
| `nurse_signature_signed_at` | text (ISO) | optional | Sent only if the file is sent. |

`data` JSON example:
```json
{
  "postTx": {
    "postWeight": "78.2", "lastBp": "120/80", "lastPulse": "76",
    "condition": "Stable", "notes": "Tolerated well"
  }
}
```

The backend should persist the two PNG files (e.g. S3) and return the public URLs back inside `Visit.flowSheet.patientSignature.url` and `Visit.flowSheet.nurseSignature.url` on subsequent reads.

### 9.2 Nursing progress note
`POST /visits/{id}/nursing-progress-notes`
`Content-Type: application/json`

Rule: `submit_nursing_progress_note`. Appends a new entry to `Visit.progressNotes.nursing`.

**Request**
```json
{
  "note": "string"
}
```
- `note` — the free-text body of the note. Required, non-empty.

The backend fills in the new `id`, `author` (current user), and `createdAt`.

**Response** — `{ "data": Visit }`. The new note appears in `Visit.progressNotes.nursing`. See §8.2 for the full Visit schema.

### 9.3 Doctor progress note
`POST /visits/{id}/doctor-progress-notes`
`Content-Type: application/json`

Rule: `submit_doctor_progress_note`. Appends a new entry to `Visit.progressNotes.doctor`.

**Request**
```json
{
  "note": "string",
  "isAddendum": false,
  "parentNoteId": 12
}
```
- `note` — required, non-empty.
- `isAddendum` — `true` when this is an addendum to an earlier doctor note.
- `parentNoteId` — required when `isAddendum` is `true`; the id of the original note being amended.

The backend fills `id`, `author`, `createdAt`, and snapshots `Visit.flowSheet.preTreatmentVitals` into the new note's `vitalsSnapshot`.

**Response** — `{ "data": Visit }`. The new note appears in `Visit.progressNotes.doctor`. See §8.2 for the full Visit schema.

### 9.4 Social-worker progress note
`POST /visits/{id}/social-worker-progress-notes`
`Content-Type: application/json`

Rule: `submit_social_worker_progress_note`. Appends a new entry to `Visit.progressNotes.socialWorker`.

**Request**
```json
{
  "note": "string",
  "location": "on_call | in_center"
}
```
- `note` — required, non-empty.
- `location` — must be one of `"on_call"` or `"in_center"`.

The backend fills `id`, `author`, and `createdAt`.

**Response** — `{ "data": Visit }`. The new note appears in `Visit.progressNotes.socialWorker`. See §8.2 for the full Visit schema.

### 9.5 Referral *(multipart)*
`POST /visits/{id}/referrals`
`Content-Type: multipart/form-data`

Rule: `submit_referral`. Appends a new entry to `Visit.referrals`.

**Request — multipart fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | text (JSON string) | yes | All fields except the attachment — see schema below. |
| `attachment` | file (`image/*` or `application/pdf`) | optional | Photo / scan / PDF picked by the nurse. Backend stores it and exposes the public URL on the response. |

`data` JSON schema:
```json
{
  "referralDate": "YYYY-MM-DD",
  "referralType": "Outpatient | Inpatient | Emergency | Follow-up | Specialist Consult",
  "referralHospital": "string",
  "printOptions": {
    "monthlyMedicalReport": false,
    "systemMedicalReport": false,
    "labResult": false,
    "last3FlowSheets": false
  },
  "referralReason": "string",
  "completionDate": "YYYY-MM-DD",
  "comments": "string"
}
```
- All fields above are required (use empty string / `false` when the user didn't fill in).
- `referralType` must be one of the listed enum values.
- `printOptions` — booleans for which reports the nurse wants printed alongside the referral.

The backend fills in `id`, `primaryPhysician`, `referralBy`, `status` (typically `"Active"`), `createdAt`. If `attachment` is sent, it persists the file (e.g. on S3) and stores the URL.

**Response** — `{ "data": Visit }`. The new referral appears in `Visit.referrals` with `attachmentUrl` (public URL) and `attachmentName`. See §8.2 for the full Visit schema.

### 9.6 Refusal *(multipart)*
`POST /visits/{id}/refusals`
`Content-Type: multipart/form-data`

Rule: `submit_refusal`. Appends a new entry to `Visit.refusals`.

Up to four signatures captured as PNG. The remaining metadata rides on a single `data` JSON field.

**Request — multipart fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | text (JSON string) | yes | Non-image fields — see schema below. |
| `witness_signature` | file (`image/png`) | optional | PNG of the witness's signature. Send only when `witness.signed === true`. |
| `relative_signature` | file (`image/png`) | optional | PNG of the relative's signature. Send only when `relative.signed === true`. |
| `doctor_signature` | file (`image/png`) | optional | PNG of the doctor's signature. Send only when `doctor.signed === true`. |
| `interpreter_signature` | file (`image/png`) | optional | PNG of the interpreter's signature. Send only when `interpreter.signed === true`. |

`data` JSON schema:
```json
{
  "types": ["discontinuation", "refusal_consent"],
  "reason": "string",
  "risks": {
    "hyperkalemia": false,
    "cardiacArrest": false,
    "pulmonaryEdema": false,
    "severeAcidosis": false,
    "others": "string"
  },
  "witness": {
    "name": "string",
    "signed": true,
    "signedAt": "ISO 8601",
    "address": "string"
  },
  "unableToSignReason": "string",
  "relative": {
    "name": "string",
    "relationship": "Father | Mother | Spouse | Son | Daughter | Brother | Sister | Guardian | Other",
    "signed": true,
    "signedAt": "ISO 8601"
  },
  "doctor": {
    "name": "string",
    "signed": true,
    "signedAt": "ISO 8601"
  },
  "interpreter": {
    "name": "string",
    "signed": true,
    "signedAt": "ISO 8601"
  }
}
```

- `types` — at least one of `"discontinuation"`, `"refusal_consent"`. Both can be present.
- `risks.others` — free-text additional risks.
- `unableToSignReason` — used when the patient is unable to sign; otherwise empty string.
- `signed` and `signedAt` for each party are always in `data`. The PNG bytes ride as the matching `*_signature` multipart file part.

The backend fills `id`, `author`, `createdAt`, and stores each uploaded PNG (e.g. on S3). The persisted Refusal returned inside `Visit.refusals` carries `signatureUrl` per party (URL of the stored PNG) instead of `signatureData`.

**Response** — `{ "data": Visit }`. The new refusal appears in `Visit.refusals`. See §8.2 for the full Visit schema.

### 9.7 SARI screening
`POST /visits/{id}/sari-screenings`
`Content-Type: application/json`

Rule: `submit_sari_screening`. Appends a new entry to `Visit.sariScreenings`.

**Request**
```json
{
  "addressographPatientName": "string",
  "dateTime": "ISO 8601",
  "sariFeatures": {
    "fever": "yes | no | null",
    "coughOrBreathing": "yes | no | null",
    "radiographicEvidence": "yes | no | null"
  },
  "exposureCriteria": {
    "closeContactSari": "yes | no | null",
    "travelToPhacNotice": "yes | no | null",
    "recentExposurePotentialSource": "yes | no | null",
    "inconsistentWithOtherKnownCause": "yes | no | null"
  },
  "actions": {
    "thinkInfectionControl": "done | not_done | null",
    "tellMedicalHealthOfficer": "done | not_done | null",
    "tellInfectionControl": "done | not_done | null",
    "consultInfectiousDiseaseSpecialist": "done | not_done | null",
    "test": "done | not_done | null"
  }
}
```
- All `sariFeatures` / `exposureCriteria` fields use a 3-state value (`"yes"`, `"no"`, or `null` when the nurse hasn't answered).
- All `actions` fields use a 3-state value (`"done"`, `"not_done"`, or `null` when the nurse hasn't answered).
- `addressographPatientName` — name printed by the addressograph stamp (often equals the visit's `patientName`).
- `dateTime` — when the screening was performed.

The backend fills `id`, `author`, and `createdAt`.

**Response** — `{ "data": Visit }`. The new screening appears in `Visit.sariScreenings`. See §8.2 for the full Visit schema.

### 9.8 Inventory usage
`POST /visits/{id}/inventory-usage`
`Content-Type: application/json`

Rule: `submit_inventory_usage`. Records one inventory item consumed during this visit. The backend deducts the `quantity` from the patient's available stock (see §10).

**Request**
```json
{
  "itemId": 42,
  "quantity": 2,
  "notes": "string"
}
```
- `itemId` — the inventory item's id; matches `InventoryItem.id` from `Visit.inventory` (§10). Required.
- `quantity` — required. Must be `> 0` and `<= item.available`. Backend returns `422` otherwise.
- `notes` — optional free-text reason / context. Send empty string when not provided.

**Response** — `{ "data": Visit }`. `Visit.inventory[itemId].available` will be lower by `quantity`. See §8.2 for the full Visit schema.

---

## 10. Reference data — embedded in Visit response

There are **no standalone `/medications` or `/inventory` endpoints**. Both lists are part of the visit response (single source of truth):

```jsonc
// Inside Visit (§8.2)
{
  "medications": [
    {
      "id": 1, "drugName": "string", "form": "Tablet", "dosage": "500mg",
      "frequency": "BID", "route": "PO",
      "duration": "7", "durationPeriod": "days",
      "adminType": "scheduled", "instructions": "string"
    }
  ],
  "inventory": [
    { "id": 1, "name": "string", "itemNumber": "INV-001", "available": 25 }
  ]
}
```

`Visit.medications` is the catalogue the nurse picks from on the Dialysis Medications form (administered via §9.1.14). `Visit.inventory` is the patient's current stock (consumed via §9.8).

---

## 11. Endpoint summary

### Auth & profile
| # | Endpoint | Method |
|---|---|---|
| 2.1 | `/auth/login` | POST |
| 2.2 | `/me` | GET |
| 2.3 | `/me` | PATCH |
| 2.4 | `/auth/register` | POST |
| 2.5 | `/auth/verify-otp` | POST |
| 2.6 | `/auth/forgot-password` | POST |
| 2.7 | `/auth/reset-password` | POST |
| 2.8 | `/auth/change-password` | POST |
| 2.9 | `/auth/logout` | POST |
| 2.10 | `/auth/delete-account` | POST |
| 2.11 | `/me/device-token` | POST |
| 2.12 | `/auth/verify-face` | POST |

### Permissions, dashboard, patients, lab, scheduler
| # | Endpoint | Method |
|---|---|---|
| 3.1 | `/me/rules` | GET |
| 4.1 | `/dashboard/stats` | GET |
| 5.1 | `/patients` | GET |
| 5.2 | `/patients/{id}` | GET |
| 5.3 | `/patients/{id}/alerts` | GET |
| 6.1 | `/patients/{id}/lab-results` | GET |
| 7.1 | `/scheduler/slots` | GET |
| 7.2 | `/scheduler/slots/{id}` | GET |
| 7.3 | `/scheduler/slots/{id}/confirm` | POST |
| 7.4 | `/scheduler/slots/{id}/check-in` | POST |

### Visits — read & status
| # | Endpoint | Method |
|---|---|---|
| 8.1 | `/visits` | GET |
| 8.2 | `/visits/{id}` | GET |
| 8.3.1 | `/visits/{id}/start` | POST |
| 8.3.2 | `/visits/{id}/end` | POST |
| 8.3.3 | `/visits/{id}/procedure-times` | POST |

### Visit forms — write *(all return updated Visit)*
| # | Endpoint | Method | Body |
|---|---|---|---|
| 9.1.1 | `/visits/{id}/flow-sheet/outside-dialysis` | POST | JSON |
| 9.1.2 | `/visits/{id}/flow-sheet/pre-treatment-vitals` | POST | JSON |
| 9.1.3 | `/visits/{id}/flow-sheet/machines` | POST | JSON |
| 9.1.4 | `/visits/{id}/flow-sheet/pain-assessment` | POST | JSON |
| 9.1.5 | `/visits/{id}/flow-sheet/fall-risk` | POST | JSON |
| 9.1.6 | `/visits/{id}/flow-sheet/nursing-actions` | POST | JSON |
| 9.1.7 | `/visits/{id}/flow-sheet/dialysis-parameters` | POST | JSON |
| 9.1.8 | `/visits/{id}/flow-sheet/alarms-test` | POST | JSON |
| 9.1.9 | `/visits/{id}/flow-sheet/intake-output` | POST | JSON |
| 9.1.10 | `/visits/{id}/flow-sheet/car` | POST | JSON |
| 9.1.11 | `/visits/{id}/flow-sheet/access` | POST | JSON |
| 9.1.12 | `/visits/{id}/flow-sheet/dialysate` | POST | JSON |
| 9.1.13 | `/visits/{id}/flow-sheet/anticoagulation` | POST | JSON |
| 9.1.14 | `/visits/{id}/flow-sheet/medications` | POST | JSON |
| 9.1.15 | `/visits/{id}/flow-sheet/post-treatment` | POST | **multipart** |
| 9.2 | `/visits/{id}/nursing-progress-notes` | POST | JSON |
| 9.3 | `/visits/{id}/doctor-progress-notes` | POST | JSON |
| 9.4 | `/visits/{id}/social-worker-progress-notes` | POST | JSON |
| 9.5 | `/visits/{id}/referrals` | POST | **multipart** |
| 9.6 | `/visits/{id}/refusals` | POST | **multipart** |
| 9.7 | `/visits/{id}/sari-screenings` | POST | JSON |
| 9.8 | `/visits/{id}/inventory-usage` | POST | JSON |

> Reference data (medications + inventory) ride on the `GET /visits/{id}` response — no standalone endpoints. See §10.

**Total: 49 endpoints.**
