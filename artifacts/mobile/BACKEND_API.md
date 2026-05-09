# Backend API — CareConnect Nurse

This is the API contract between the CareConnect Nurse mobile app and the backend. Every endpoint listed here is consumed by code in [data/](data/); the mobile mocks in [data/mock/](data/mock/) mirror the response shapes one-for-one.

---

## Table of contents

1. [Conventions](#1-conventions)
2. [Authentication & profile](#2-authentication--profile)
3. [Permissions / rules](#3-permissions--rules)
4. [Home](#4-home)
5. [Patients](#5-patients)
6. [Lab results](#6-lab-results)
7. [Scheduler / appointments](#7-scheduler--appointments)
8. [Visits — read & status transitions](#8-visits--read--status-transitions)
9. [Visit forms — write](#9-visit-forms--write)
10. [Reference data — embedded in Visit response](#10-reference-data--embedded-in-visit-response)
11. [Help & support](#11-help--support)
12. [Endpoint summary](#12-endpoint-summary)

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

The mobile app currently checks **53 keys**. Source of truth: [data/models/rules.ts](data/models/rules.ts).

| Group | Keys |
|---|---|
| **Dashboard / shell** | `view_dashboard`, `view_notifications` |
| **Profile / account** | `view_profile`, `edit_profile`, `change_avatar`, `change_password`, `delete_account`, `logout` |
| **App settings** | `toggle_biometric`, `toggle_push_notifications`, `toggle_email_notifications`, `change_language`, `change_theme` |
| **Patients** | `view_patients`, `view_patient_detail`, `view_patient_care_team`, `call_patient`, `navigate_to_patient_address` |
| **Lab results** | `view_lab_results`, `view_lab_order_pdf`, `view_lab_result_pdf` |
| **Schedule / appointments** | `view_schedule`, `view_appointment_detail`, `confirm_appointment`, `check_in_patient` |
| **Visits (read)** | `view_visits`, `view_visit_detail`, `start_visit`, `end_visit` |
| **Visit forms (write)** | `submit_flow_sheet_outside_dialysis`, `submit_flow_sheet_pre_treatment_vitals`, `submit_flow_sheet_machines`, `submit_flow_sheet_pain_assessment`, `submit_flow_sheet_fall_risk`, `submit_flow_sheet_nursing_actions`, `submit_flow_sheet_dialysis_parameters`, `submit_flow_sheet_alarms_test`, `submit_flow_sheet_intake_output`, `submit_flow_sheet_car`, `submit_flow_sheet_access`, `submit_flow_sheet_dialysate`, `submit_flow_sheet_anticoagulation`, `submit_flow_sheet_medications`, `submit_flow_sheet_post_treatment`, `submit_nursing_progress_note`, `submit_doctor_progress_note`, `submit_social_worker_progress_note`, `submit_referral`, `submit_refusal`, `submit_sari_screening`, `submit_inventory_usage` |
| **Help & support** | `view_help_support`, `submit_support_message` |

### 3.4 Errors
- `401` → token invalid/expired → app signs the user out.
- Any other failure → app keeps the previously-cached rules (so a flaky network does not silently lock out the user).

---

## 4. Home

### 4.1 Home payload
`GET /home`

Single endpoint that powers the entire home screen — KPI stats, today's
visits, and the recent-patients carousel ride on one response so the screen
makes exactly one request on mount.

**Request** — none.

**Response**
```json
{
  "data": {
    "stats": {
      "totalPatients": 124,
      "todayVisits": 8,
      "pendingSchedules": 3,
      "completedVisits": 5
    },
    "todayVisits": [
      {
        "id": 142,
        "patientName": "Ahmed Al-Saud",
        "patientId": 1,
        "date": "2026-05-03",
        "time": "08:00",
        "type": "Hemodialysis",
        "status": "in_progress",
        "provider": "Dr. Sara Al-Otaibi",
        "address": "Riyadh Care Hospital — Bay 3",
        "duration": 240,
        "careTeam": [
          { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
        ],
        "patient": {
          "id": 1,
          "patientId": "P-2024-001",
          "mrn": "MRN-001",
          "name": "Ahmed Al-Saud",
          "dob": "1965-04-12",
          "gender": "male",
          "phone": "+966501234567",
          "email": "ahmed.alsaud@example.com",
          "address": "King Fahd Road, Riyadh",
          "location": "Center A — Bay 3",
          "bloodType": "A+",
          "codeStatus": "Full Code",
          "treatmentHoliday": false,
          "status": "active",
          "lastVisit": "2026-04-30",
          "diagnosis": "End-stage renal disease",
          "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
          "careTeam": [
            { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
          ]
        },
        "patientAlerts": null,
        "flowSheet": { "visitId": 142 },
        "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
        "referrals": [],
        "refusals": [],
        "sariScreenings": [],
        "medications": [],
        "inventory": []
      }
    ],
    "recentPatients": [
      {
        "id": 1,
        "patientId": "P-2024-001",
        "mrn": "MRN-001",
        "name": "Ahmed Al-Saud",
        "dob": "1965-04-12",
        "gender": "male",
        "phone": "+966501234567",
        "email": "ahmed.alsaud@example.com",
        "address": "King Fahd Road, Riyadh",
        "location": "Center A — Bay 3",
        "bloodType": "A+",
        "codeStatus": "Full Code",
        "treatmentHoliday": false,
        "status": "active",
        "lastVisit": "2026-04-30",
        "diagnosis": "End-stage renal disease",
        "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
        "careTeam": [
          { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
        ]
      }
    ]
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `stats.totalPatients` | number | Total patients assigned to the nurse. |
| `stats.todayVisits` | number | Count of visits scheduled for today. |
| `stats.pendingSchedules` | number | Count of slots with `status: "pending"`. |
| `stats.completedVisits` | number | Count of visits already completed today. |
| `todayVisits[]` | array | Up to N upcoming/today visits — each element is the full `Visit` shape (§8.2). |
| `recentPatients[]` | array | Up to N most recently seen patients — each element is the full `Patient` shape (§5.1). |

- `todayVisits` — the mobile app shows the first three on the home cards.
- `recentPatients` — the mobile app shows the first four.

The home screen does **not** call `/visits`, `/patients`, or any per-resource
endpoint on mount — everything it needs comes back here.

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

> Patient alerts (allergies, isolation, contamination, special instructions)
> are **not** a standalone endpoint — they ride on the Visit response under
> `Visit.patientAlerts` (§8.2). The visit detail screen renders the alerts
> card straight from there, no extra request.

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
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true },
        { "name": "Mona Al-Harbi",       "role": "Charge Nurse",  "phone": "+966504445566", "isPrimary": false }
      ],
      "patient": {
        "id": 1,
        "patientId": "P-2024-001",
        "mrn": "MRN-001",
        "name": "Ahmed Al-Saud",
        "dob": "1965-04-12",
        "gender": "male",
        "phone": "+966501234567",
        "email": "ahmed.alsaud@example.com",
        "address": "King Fahd Road, Riyadh",
        "location": "Center A — Bay 3",
        "bloodType": "A+",
        "codeStatus": "Full Code",
        "treatmentHoliday": false,
        "status": "active",
        "lastVisit": "2026-04-30",
        "diagnosis": "End-stage renal disease",
        "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
        "careTeam": [
          { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
        ]
      }
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | number | Slot id. |
| `patientName` | string \| null | `null` for non-patient slots (e.g. provider breaks). |
| `patientId` | number \| null | `null` for non-patient slots. |
| `phone` | string | Patient contact phone. |
| `address` | string | Patient address shown on the appointment card. |
| `time` | string | Slot start `"HH:mm"` (24h). |
| `endTime` | string | Slot end `"HH:mm"` (24h). |
| `type` | string | `"Follow-up" \| "Consultation" \| "Emergency" \| "Break"`. |
| `status` | string | `"confirmed" \| "pending" \| "cancelled" \| "checked_in"`. |
| `provider` | string | Provider name. |
| `instructions` | string | Free-text instructions for the appointment. |
| `visitDate` | string | `"YYYY/MM/DD"`. |
| `procedureTime` | string | Procedure duration label (e.g. `"30 min"`). |
| `visitTime` | string | 12-hour visit time label (e.g. `"08:00 AM"`). |
| `hospital` | string | Hospital / center name. |
| `insurance` | string | Insurance carrier. |
| `doctorTime` | string | Doctor consultation time label. |
| `careTeam[]` | array | Same shape as `Patient.careTeam` (§5.1). Empty array if not assigned. |
| `patient` | Patient \| null | Full embedded `Patient` record (§5.1) — `null` for non-patient slots. |

`patient` is the full embedded `Patient` record for this slot (`null` for
slots without a patient — e.g. provider breaks). The appointment detail
screen renders the patient hero card directly from this — no second
`/patients/{id}` round-trip.

### 7.2 Slot detail
`GET /scheduler/slots/{id}`

**Request** — none.

**Response** — single `Slot` (same shape as one element of §7.1):
```json
{
  "data": {
    "id": 1,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "phone": "+966501234567",
    "address": "King Fahd Road, Riyadh",
    "time": "08:00",
    "endTime": "08:30",
    "type": "Follow-up",
    "status": "confirmed",
    "provider": "Dr. Sara Al-Otaibi",
    "instructions": "Patient on warfarin — check INR before infusion.",
    "visitDate": "2026/05/03",
    "procedureTime": "30 min",
    "visitTime": "08:00 AM",
    "hospital": "Riyadh Care Hospital",
    "insurance": "Bupa Arabia",
    "doctorTime": "08:30 AM",
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    }
  }
}
```

### 7.3 Confirm appointment
`POST /scheduler/slots/{id}/confirm`

Transitions a slot from `pending` → `confirmed`. Rule: `confirm_appointment`.

**Request** — none.

**Response** — the updated `Slot`. The only field guaranteed to change is `status` (now `"confirmed"`); every other field is present and identical to the slot detail (§7.2).

```json
{
  "data": {
    "id": 1,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "phone": "+966501234567",
    "address": "King Fahd Road, Riyadh",
    "time": "08:00",
    "endTime": "08:30",
    "type": "Follow-up",
    "status": "confirmed",
    "provider": "Dr. Sara Al-Otaibi",
    "instructions": "Patient on warfarin — check INR before infusion.",
    "visitDate": "2026/05/03",
    "procedureTime": "30 min",
    "visitTime": "08:00 AM",
    "hospital": "Riyadh Care Hospital",
    "insurance": "Bupa Arabia",
    "doctorTime": "08:30 AM",
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    }
  }
}
```

### 7.4 Check in patient
`POST /scheduler/slots/{id}/check-in`

Transitions a slot from `confirmed` → `checked_in`. Rule: `check_in_patient`.

**Request** — none.

**Response** — the updated `Slot`. The only field guaranteed to change is `status` (now `"checked_in"`); every other field is present and identical to the slot detail (§7.2).

```json
{
  "data": {
    "id": 1,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "phone": "+966501234567",
    "address": "King Fahd Road, Riyadh",
    "time": "08:00",
    "endTime": "08:30",
    "type": "Follow-up",
    "status": "checked_in",
    "provider": "Dr. Sara Al-Otaibi",
    "instructions": "Patient on warfarin — check INR before infusion.",
    "visitDate": "2026/05/03",
    "procedureTime": "30 min",
    "visitTime": "08:00 AM",
    "hospital": "Riyadh Care Hospital",
    "insurance": "Bupa Arabia",
    "doctorTime": "08:30 AM",
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    }
  }
}
```

---

## 8. Visits — read & status transitions

Source: [data/visit_repository.ts](data/visit_repository.ts), [data/models/visit.ts](data/models/visit.ts).

### 8.1 List visits
`GET /visits`

**Request** — none.

**Response** — array of visits. Each element carries every top-level field of the full Visit; the list endpoint is not a slim summary. Example with a single element fully populated:

```json
{
  "data": [
    {
      "id": 142,
      "patientName": "Ahmed Al-Saud",
      "patientId": 1,
      "date": "2026-05-03",
      "time": "08:00",
      "type": "Hemodialysis",
      "status": "in_progress",
      "provider": "Dr. Sara Al-Otaibi",
      "address": "Riyadh Care Hospital — Bay 3",
      "duration": 240,
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true },
        { "name": "Mona Al-Harbi",       "role": "Charge Nurse",  "phone": "+966504445566", "isPrimary": false }
      ],
      "patient": {
        "id": 1,
        "patientId": "P-2024-001",
        "mrn": "MRN-001",
        "name": "Ahmed Al-Saud",
        "dob": "1965-04-12",
        "gender": "male",
        "phone": "+966501234567",
        "email": "ahmed.alsaud@example.com",
        "address": "King Fahd Road, Riyadh",
        "location": "Center A — Bay 3",
        "bloodType": "A+",
        "codeStatus": "Full Code",
        "treatmentHoliday": false,
        "status": "active",
        "lastVisit": "2026-04-30",
        "diagnosis": "End-stage renal disease",
        "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
        "careTeam": [
          { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
        ]
      },
      "patientAlerts": {
        "allergies": [
          { "type": "drug", "value": "Penicillin" },
          { "type": "food", "value": "Peanuts" }
        ],
        "contamination": ["MRSA"],
        "instructions": "Reverse isolation. Limit visitors.",
        "isolation": "Contact precautions"
      },
      "flowSheet": {
        "visitId": 142,
        "preTreatmentVitals": {
          "temperature": "36.7",
          "respiratoryRate": "16",
          "oxygenSaturation": "98",
          "bloodPressure": "130/80",
          "pulseRate": "78",
          "preWeight": "80",
          "dryWeight": "78",
          "ufGoal": "2",
          "rbs": "115"
        },
        "vitals": {
          "height": "172",
          "preWeight": "80",
          "dryWeight": "78",
          "ufGoal": "2",
          "bpSystolic": "130",
          "bpDiastolic": "80",
          "temperature": "36.7",
          "spo2": "98",
          "hr": "78",
          "rr": "16",
          "rbs": "115"
        },
        "bpSite": "Right arm",
        "method": "Manual",
        "machine": "Fresenius 4008S",
        "pain": "3",
        "painDetails": {
          "toolUsed": "NRS",
          "location": "Lower back",
          "frequency": "Intermittent",
          "radiatingTo": "",
          "painType": "Dull",
          "occurs": "On movement",
          "ambulating": "Worse",
          "resting": "Better",
          "eating": "",
          "relievedBy": "Rest",
          "worsensBy": "Standing"
        },
        "fallRisk": "Moderate",
        "highFallRisk": false,
        "morseValues": { "a": 0, "b": 0, "c": 15, "d": 0, "e": 10, "f": 0 },
        "morseTotal": 25,
        "outsideDialysis": false,
        "alarmsTest": true,
        "nursingActions": [
          {
            "time": "08:30",
            "focus": "Hypotension",
            "action": "Saline bolus 250ml",
            "evaluation": "BP returned to 110/70",
            "name": "Sara"
          }
        ],
        "dialysisParams": [
          {
            "time": "09:00",
            "systolic": "120",
            "diastolic": "80",
            "site": "right",
            "pulse": "78",
            "dialysateRate": "500",
            "uf": "1.0",
            "bfr": "300",
            "dialysateVol": "120",
            "ufVol": "1.0",
            "venous": "180",
            "effluent": "200",
            "access": "AV fistula",
            "alarms": "none",
            "initials": "SJ"
          }
        ],
        "intake": "500ml",
        "output": "1500ml",
        "car": { "ffPercent": "20", "dialyzer": "F8HPS", "temp": "36.5" },
        "access": "Right arm AV fistula",
        "dialysate": { "na": "138", "hco3": "32", "k": "2", "glucose": "100" },
        "anticoagType": "Heparin",
        "medAdmin": {
          "12": { "status": "yes", "timestamp": "2026-05-03T09:14:00Z", "reason": "" },
          "13": { "status": "no",  "timestamp": "2026-05-03T09:15:00Z", "reason": "Patient refused" }
        },
        "postTx": {
          "postWeight": "78.2",
          "lastBp": "120/80",
          "lastPulse": "76",
          "condition": "Stable",
          "notes": "Tolerated well"
        },
        "patientSignature": { "url": "https://cdn.goconnect.com/signatures/142-patient.png", "signedAt": "2026-05-03T11:55:00Z" },
        "nurseSignature":   { "url": "https://cdn.goconnect.com/signatures/142-nurse.png",   "signedAt": "2026-05-03T11:56:00Z" },
        "submittedAt": "2026-05-03T11:56:00Z"
      },
      "progressNotes": {
        "nursing": [
          {
            "id": 1,
            "visitId": 142,
            "note": "Patient stable through first hour. No alarms.",
            "author": "Mona Al-Harbi (RN)",
            "createdAt": "2026-05-03T09:05:00Z"
          }
        ],
        "doctor": [
          {
            "id": 1,
            "visitId": 142,
            "note": "Continue current heparin dose.",
            "vitalsSnapshot": {
              "temperature": "36.7",
              "respiratoryRate": "16",
              "oxygenSaturation": "98",
              "bloodPressure": "130/80",
              "pulseRate": "78",
              "preWeight": "80",
              "dryWeight": "78",
              "ufGoal": "2",
              "rbs": "115"
            },
            "isAddendum": false,
            "parentNoteId": null,
            "author": "Dr. Sara Al-Otaibi",
            "createdAt": "2026-05-03T09:30:00Z"
          }
        ],
        "socialWorker": [
          {
            "id": 1,
            "visitId": 142,
            "note": "Patient asked about transport assistance — referred to coordinator.",
            "location": "in_center",
            "author": "Khaled Al-Mutairi (MSW)",
            "createdAt": "2026-05-03T10:10:00Z"
          }
        ]
      },
      "referrals": [
        {
          "id": 1,
          "visitId": 142,
          "referralDate": "2026-05-03",
          "primaryPhysician": "Dr. Sara Al-Otaibi",
          "referralBy": "Dr. Sara Al-Otaibi",
          "status": "Active",
          "referralType": "Outpatient",
          "referralHospital": "King Faisal Specialist Hospital",
          "printOptions": {
            "monthlyMedicalReport": true,
            "systemMedicalReport":  false,
            "labResult":            true,
            "last3FlowSheets":      false
          },
          "referralReason": "Cardiology consult — new arrhythmia.",
          "completionDate": "2026-05-10",
          "comments": "Please send report back to nephrology.",
          "attachmentUrl":  "https://cdn.goconnect.com/referrals/142-1.pdf",
          "attachmentName": "ECG_2026-05-03.pdf",
          "createdAt":      "2026-05-03T10:30:00Z"
        }
      ],
      "refusals": [
        {
          "id": 1,
          "visitId": 142,
          "types": ["discontinuation", "refusal_consent"],
          "reason": "Patient elected to end session early.",
          "risks": {
            "hyperkalemia":   true,
            "cardiacArrest":  false,
            "pulmonaryEdema": true,
            "severeAcidosis": false,
            "others":         "Volume overload"
          },
          "witness": {
            "name":         "Mona Al-Harbi",
            "signed":       true,
            "signedAt":     "2026-05-03T11:00:00Z",
            "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-witness.png",
            "address":      "Riyadh Care Hospital, Riyadh"
          },
          "unableToSignReason": "",
          "relative": {
            "name":         "Khalid Al-Saud",
            "relationship": "Son",
            "signed":       true,
            "signedAt":     "2026-05-03T11:01:00Z",
            "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-relative.png"
          },
          "doctor": {
            "name":         "Dr. Sara Al-Otaibi",
            "signed":       true,
            "signedAt":     "2026-05-03T11:02:00Z",
            "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-doctor.png"
          },
          "interpreter": {
            "name":         "",
            "signed":       false,
            "signedAt":     null,
            "signatureUrl": null
          },
          "author":    "Mona Al-Harbi (RN)",
          "createdAt": "2026-05-03T11:05:00Z"
        }
      ],
      "sariScreenings": [
        {
          "id": 1,
          "visitId": 142,
          "addressographPatientName": "Ahmed Al-Saud",
          "dateTime": "2026-05-03T08:15:00Z",
          "sariFeatures": {
            "fever":                "no",
            "coughOrBreathing":     "no",
            "radiographicEvidence": "no"
          },
          "exposureCriteria": {
            "closeContactSari":               "no",
            "travelToPhacNotice":             "no",
            "recentExposurePotentialSource":  "no",
            "inconsistentWithOtherKnownCause": "no"
          },
          "actions": {
            "thinkInfectionControl":             "done",
            "tellMedicalHealthOfficer":          "not_done",
            "tellInfectionControl":              "not_done",
            "consultInfectiousDiseaseSpecialist": "not_done",
            "test":                              "not_done"
          },
          "author":    "Mona Al-Harbi (RN)",
          "createdAt": "2026-05-03T08:18:00Z"
        }
      ],
      "medications": [
        {
          "id": 12,
          "drugName":       "Erythropoietin",
          "form":           "Injection",
          "dosage":         "4000 IU",
          "frequency":      "TIW",
          "route":          "SC",
          "duration":       "ongoing",
          "durationPeriod": "weeks",
          "adminType":      "scheduled",
          "instructions":   "Administer at end of dialysis."
        },
        {
          "id": 13,
          "drugName":       "Iron sucrose",
          "form":           "Injection",
          "dosage":         "100 mg",
          "frequency":      "weekly",
          "route":          "IV",
          "duration":       "4",
          "durationPeriod": "weeks",
          "adminType":      "scheduled",
          "instructions":   "Slow IV push over 5 min."
        }
      ],
      "inventory": [
        { "id": 1, "name": "Dialyzer F8HPS",       "itemNumber": "INV-001", "available": 25 },
        { "id": 2, "name": "Heparin 5000 IU vial", "itemNumber": "INV-002", "available": 40 }
      ]
    }
  ]
}
```

Every visit element of the array carries the full Visit shape shown above (it is not a slim summary). For the field-by-field reference, see §8.2.

### 8.2 Visit detail *(single source of truth)*
`GET /visits/{id}`

The full Visit response. Every nested form is on this object — the app does not call separate endpoints for flow-sheet sections, progress notes, etc. on the read path.

**Request** — none.

**Response** — `{ "data": Visit }`. Fully-populated example:

```jsonc
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,

    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist",  "phone": "+966501112233", "isPrimary": true },
      { "name": "Mona Al-Harbi",       "role": "Charge Nurse",  "phone": "+966504445566", "isPrimary": false }
    ],

    // ── Embedded patient record (single source of truth). The visit detail
    //    screen renders the patient hero card straight from this — no
    //    `/patients/{id}` round-trip. Same shape as §5.1. ──
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },

    // ── Allergies / isolation / contamination / special instructions for the
    //    patient. `null` when the patient has no alerts on file. ──
    "patientAlerts": {
      "allergies": [
        { "type": "drug", "value": "Penicillin" },
        { "type": "food", "value": "Peanuts" }
      ],
      "contamination": ["MRSA"],
      "instructions": "Reverse isolation. Limit visitors.",
      "isolation": "Contact precautions"
    },

    // ── Flow sheet snapshot (single home for everything captured during the visit). ──
    // Every field is optional — the flow sheet grows incrementally as the nurse
    // saves sections (§9.1). Backend should return only the fields that have
    // been populated so far; omit (or send null) the rest. The example below
    // shows every field fully populated.
    "flowSheet": {
      "visitId": 142,

      // Derived from `vitals` after Pre-Treatment Vitals is saved (§9.1.2).
      // Used as `vitalsSnapshot` on doctor progress notes.
      "preTreatmentVitals": {
        "temperature":      "36.7",
        "respiratoryRate":  "16",
        "oxygenSaturation": "98",
        "bloodPressure":    "130/80",
        "pulseRate":        "78",
        "preWeight":        "80",
        "dryWeight":        "78",
        "ufGoal":           "2",
        "rbs":              "115"
      },

      // Raw vitals as captured by the nurse — same shape as §9.1.2 request body.
      "vitals": {
        "height":       "172",
        "preWeight":    "80",
        "dryWeight":    "78",
        "ufGoal":       "2",
        "bpSystolic":   "130",
        "bpDiastolic":  "80",
        "temperature":  "36.7",
        "spo2":         "98",
        "hr":           "78",
        "rr":           "16",
        "rbs":          "115"
      },
      "bpSite": "Right arm",
      "method": "Manual",

      "machine": "Fresenius 4008S",

      "pain": "3",
      // Same shape as §9.1.4 request body.
      "painDetails": {
        "toolUsed":    "NRS",
        "location":    "Lower back",
        "frequency":   "Intermittent",
        "radiatingTo": "",
        "painType":    "Dull",
        "occurs":      "On movement",
        "ambulating":  "Worse",
        "resting":     "Better",
        "eating":      "",
        "relievedBy":  "Rest",
        "worsensBy":   "Standing"
      },

      "fallRisk": "Moderate",
      "highFallRisk": false,
      "morseValues": { "a": 0, "b": 0, "c": 15, "d": 0, "e": 10, "f": 0 },
      "morseTotal": 25,

      "outsideDialysis": false,
      "alarmsTest": true,

      // Same shape as §9.1.6 request body — replaced wholesale on each save.
      "nursingActions": [
        {
          "time":       "08:30",
          "focus":      "Hypotension",
          "action":     "Saline bolus 250ml",
          "evaluation": "BP returned to 110/70",
          "name":       "Sara"
        }
      ],

      // Same shape as §9.1.7 request body — replaced wholesale on each save.
      "dialysisParams": [
        {
          "time":          "09:00",
          "systolic":      "120",
          "diastolic":     "80",
          "site":          "right",
          "pulse":         "78",
          "dialysateRate": "500",
          "uf":            "1.0",
          "bfr":           "300",
          "dialysateVol":  "120",
          "ufVol":         "1.0",
          "venous":        "180",
          "effluent":      "200",
          "access":        "AV fistula",
          "alarms":        "none",
          "initials":      "SJ"
        }
      ],

      "intake":  "500ml",
      "output":  "1500ml",

      // Same shape as §9.1.10 request body.
      "car":       { "ffPercent": "20", "dialyzer": "F8HPS", "temp": "36.5" },
      "access":    "Right arm AV fistula",
      // Same shape as §9.1.12 request body.
      "dialysate": { "na": "138", "hco3": "32", "k": "2", "glucose": "100" },
      "anticoagType": "Heparin",

      // Map keyed by medication id (string). See §9.1.14.
      "medAdmin": {
        "12": { "status": "yes", "timestamp": "2026-05-03T09:14:00Z", "reason": "" },
        "13": { "status": "no",  "timestamp": "2026-05-03T09:15:00Z", "reason": "Patient refused" }
      },

      // Same shape as §9.1.15 `postTx` request body.
      "postTx": {
        "postWeight": "78.2",
        "lastBp":     "120/80",
        "lastPulse":  "76",
        "condition":  "Stable",
        "notes":      "Tolerated well"
      },

      // Signatures stored remotely; backend exposes URLs only.
      "patientSignature": { "url": "https://cdn.goconnect.com/signatures/142-patient.png", "signedAt": "2026-05-03T11:55:00Z" },
      "nurseSignature":   { "url": "https://cdn.goconnect.com/signatures/142-nurse.png",   "signedAt": "2026-05-03T11:56:00Z" },

      "submittedAt": "2026-05-03T11:56:00Z"
    },

    // ── All progress notes for this visit, grouped by author role. ──
    "progressNotes": {
      "nursing": [
        {
          "id": 1,
          "visitId": 142,
          "note": "Patient stable through first hour. No alarms.",
          "author": "Mona Al-Harbi (RN)",
          "createdAt": "2026-05-03T09:05:00Z"
        }
      ],
      "doctor": [
        {
          "id": 1,
          "visitId": 142,
          "note": "Continue current heparin dose.",
          "vitalsSnapshot": {
            "temperature":      "36.7",
            "respiratoryRate":  "16",
            "oxygenSaturation": "98",
            "bloodPressure":    "130/80",
            "pulseRate":        "78",
            "preWeight":        "80",
            "dryWeight":        "78",
            "ufGoal":           "2",
            "rbs":              "115"
          },
          "isAddendum": false,
          "parentNoteId": null,
          "author": "Dr. Sara Al-Otaibi",
          "createdAt": "2026-05-03T09:30:00Z"
        }
      ],
      "socialWorker": [
        {
          "id": 1,
          "visitId": 142,
          "note": "Patient asked about transport assistance — referred to coordinator.",
          "location": "in_center",
          "author": "Khaled Al-Mutairi (MSW)",
          "createdAt": "2026-05-03T10:10:00Z"
        }
      ]
    },

    "referrals": [
      {
        "id": 1,
        "visitId": 142,
        "referralDate": "2026-05-03",
        "primaryPhysician": "Dr. Sara Al-Otaibi",
        "referralBy": "Dr. Sara Al-Otaibi",
        "status": "Active",
        "referralType": "Outpatient",
        "referralHospital": "King Faisal Specialist Hospital",
        "printOptions": {
          "monthlyMedicalReport": true,
          "systemMedicalReport":  false,
          "labResult":            true,
          "last3FlowSheets":      false
        },
        "referralReason":  "Cardiology consult — new arrhythmia.",
        "completionDate":  "2026-05-10",
        "comments":        "Please send report back to nephrology.",
        "attachmentUrl":   "https://cdn.goconnect.com/referrals/142-1.pdf",
        "attachmentName":  "ECG_2026-05-03.pdf",
        "createdAt":       "2026-05-03T10:30:00Z"
      }
    ],

    "refusals": [
      {
        "id": 1,
        "visitId": 142,
        "types": ["discontinuation", "refusal_consent"],
        "reason": "Patient elected to end session early.",
        "risks": {
          "hyperkalemia":   true,
          "cardiacArrest":  false,
          "pulmonaryEdema": true,
          "severeAcidosis": false,
          "others":         "Volume overload"
        },
        "witness": {
          "name":         "Mona Al-Harbi",
          "signed":       true,
          "signedAt":     "2026-05-03T11:00:00Z",
          "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-witness.png",
          "address":      "Riyadh Care Hospital, Riyadh"
        },
        "unableToSignReason": "",
        "relative": {
          "name":         "Khalid Al-Saud",
          "relationship": "Son",
          "signed":       true,
          "signedAt":     "2026-05-03T11:01:00Z",
          "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-relative.png"
        },
        "doctor": {
          "name":         "Dr. Sara Al-Otaibi",
          "signed":       true,
          "signedAt":     "2026-05-03T11:02:00Z",
          "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-doctor.png"
        },
        "interpreter": {
          "name":         "",
          "signed":       false,
          "signedAt":     null,
          "signatureUrl": null
        },
        "author": "Mona Al-Harbi (RN)",
        "createdAt": "2026-05-03T11:05:00Z"
      }
    ],

    "sariScreenings": [
      {
        "id": 1,
        "visitId": 142,
        "addressographPatientName": "Ahmed Al-Saud",
        "dateTime": "2026-05-03T08:15:00Z",
        "sariFeatures": {
          "fever":                "no",
          "coughOrBreathing":     "no",
          "radiographicEvidence": "no"
        },
        "exposureCriteria": {
          "closeContactSari":               "no",
          "travelToPhacNotice":             "no",
          "recentExposurePotentialSource":  "no",
          "inconsistentWithOtherKnownCause": "no"
        },
        "actions": {
          "thinkInfectionControl":             "done",
          "tellMedicalHealthOfficer":          "not_done",
          "tellInfectionControl":              "not_done",
          "consultInfectiousDiseaseSpecialist": "not_done",
          "test":                              "not_done"
        },
        "author":    "Mona Al-Harbi (RN)",
        "createdAt": "2026-05-03T08:18:00Z"
      }
    ],

    "medications": [
      {
        "id": 12,
        "drugName":       "Erythropoietin",
        "form":           "Injection",
        "dosage":         "4000 IU",
        "frequency":      "TIW",
        "route":          "SC",
        "duration":       "ongoing",
        "durationPeriod": "weeks",
        "adminType":      "scheduled",
        "instructions":   "Administer at end of dialysis."
      },
      {
        "id": 13,
        "drugName":       "Iron sucrose",
        "form":           "Injection",
        "dosage":         "100 mg",
        "frequency":      "weekly",
        "route":          "IV",
        "duration":       "4",
        "durationPeriod": "weeks",
        "adminType":      "scheduled",
        "instructions":   "Slow IV push over 5 min."
      }
    ],

    "inventory": [
      { "id": 1, "name": "Dialyzer F8HPS",       "itemNumber": "INV-001", "available": 25 },
      { "id": 2, "name": "Heparin 5000 IU vial", "itemNumber": "INV-002", "available": 40 }
    ]
  }
}
```

#### Visit field reference

| Field | Type | Notes |
|---|---|---|
| `id` | number | Visit id. |
| `patientName` | string | Convenience copy of `patient.name`. |
| `patientId` | number | FK to `Patient.id`. |
| `date` | string | `"YYYY-MM-DD"`. |
| `time` | string | `"HH:mm"` (24h). |
| `type` | string | Visit type label (e.g. `"Hemodialysis"`, `"Follow-up"`). |
| `status` | string | One of `"completed"`, `"pending"`, `"confirmed"`, `"cancelled"`, `"in_progress"`, `"start_procedure"`, `"end_procedure"`. |
| `provider` | string | Provider name. |
| `address` | string | Visit location string. |
| `duration` | number | Planned duration (minutes). |
| `careTeam[]` | array | Same shape as `Patient.careTeam`. |
| `patient` | Patient | Full embedded patient record (§5.1). |
| `patientAlerts` | object \| null | Allergies / contamination / isolation / instructions. `null` when no alerts on file. |
| `patientAlerts.allergies[]` | array | `{ "type": "drug" \| "food" \| "environment" \| ..., "value": "..." }`. |
| `patientAlerts.contamination[]` | string[] | Pathogen tags (e.g. `"MRSA"`, `"VRE"`). |
| `patientAlerts.instructions` | string | Free-text. |
| `patientAlerts.isolation` | string \| null | Isolation type (e.g. `"Contact precautions"`). |
| `flowSheet` | object | See §9.1 sections — every field optional, populated incrementally. |
| `progressNotes.nursing[]` | array | See §9.2. |
| `progressNotes.doctor[]` | array | See §9.3. `vitalsSnapshot` mirrors `flowSheet.preTreatmentVitals` at write time. `parentNoteId` is `null` unless `isAddendum` is `true`. |
| `progressNotes.socialWorker[]` | array | See §9.4. `location` ∈ `{"on_call", "in_center"}`. |
| `referrals[]` | array | See §9.5. `attachmentUrl` / `attachmentName` are `null` when no file uploaded. |
| `refusals[]` | array | See §9.6. Per-party `signatureUrl` is `null` when `signed === false`. |
| `sariScreenings[]` | array | See §9.7. Each tri-state value is `"yes"`/`"no"`/`null` (features/exposure) or `"done"`/`"not_done"`/`null` (actions). |
| `medications[]` | array | Catalogue used by §9.1.14 — see §10 for shape. |
| `inventory[]` | array | Patient stock used by §9.8 — see §10 for shape. |

### 8.3 Status transitions

Each transition returns the **full updated Visit** so the mobile cache stays consistent. Every field of the Visit object is present in the response — the only field guaranteed to change between calls is `status` (and, for the Post-Treatment save, `flowSheet.submittedAt`).

#### 8.3.1 Start visit
`POST /visits/{id}/start` — Rule: `start_visit`. Transitions `status` → `"in_progress"`.

**Request** — none.

**Response** — the full updated Visit with `status: "in_progress"`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true },
      { "name": "Mona Al-Harbi",       "role": "Charge Nurse",  "phone": "+966504445566", "isPrimary": false }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [
        { "type": "drug", "value": "Penicillin" }
      ],
      "contamination": ["MRSA"],
      "instructions": "Reverse isolation. Limit visitors.",
      "isolation": "Contact precautions"
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [
      {
        "id": 12,
        "drugName":       "Erythropoietin",
        "form":           "Injection",
        "dosage":         "4000 IU",
        "frequency":      "TIW",
        "route":          "SC",
        "duration":       "ongoing",
        "durationPeriod": "weeks",
        "adminType":      "scheduled",
        "instructions":   "Administer at end of dialysis."
      }
    ],
    "inventory": [
      { "id": 1, "name": "Dialyzer F8HPS",       "itemNumber": "INV-001", "available": 25 },
      { "id": 2, "name": "Heparin 5000 IU vial", "itemNumber": "INV-002", "available": 40 }
    ]
  }
}
```

#### 8.3.2 End visit
`POST /visits/{id}/end` — Rule: `end_visit`. Transitions `status` → `"completed"`.

**Request** — none.

**Response** — the full updated Visit with `status: "completed"`. By the time End is called, the flow-sheet sections, progress notes, etc. that were saved during the session are all present in the response.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "completed",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true },
      { "name": "Mona Al-Harbi",       "role": "Charge Nurse",  "phone": "+966504445566", "isPrimary": false }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [
        { "type": "drug", "value": "Penicillin" }
      ],
      "contamination": ["MRSA"],
      "instructions": "Reverse isolation. Limit visitors.",
      "isolation": "Contact precautions"
    },
    "flowSheet": {
      "visitId": 142,
      "preTreatmentVitals": {
        "temperature": "36.7", "respiratoryRate": "16", "oxygenSaturation": "98",
        "bloodPressure": "130/80", "pulseRate": "78",
        "preWeight": "80", "dryWeight": "78", "ufGoal": "2", "rbs": "115"
      },
      "vitals": {
        "height": "172", "preWeight": "80", "dryWeight": "78", "ufGoal": "2",
        "bpSystolic": "130", "bpDiastolic": "80",
        "temperature": "36.7", "spo2": "98", "hr": "78", "rr": "16", "rbs": "115"
      },
      "bpSite": "Right arm",
      "method": "Manual",
      "machine": "Fresenius 4008S",
      "pain": "3",
      "painDetails": {
        "toolUsed": "NRS", "location": "Lower back", "frequency": "Intermittent",
        "radiatingTo": "", "painType": "Dull", "occurs": "On movement",
        "ambulating": "Worse", "resting": "Better", "eating": "",
        "relievedBy": "Rest", "worsensBy": "Standing"
      },
      "fallRisk": "Moderate",
      "highFallRisk": false,
      "morseValues": { "a": 0, "b": 0, "c": 15, "d": 0, "e": 10, "f": 0 },
      "morseTotal": 25,
      "outsideDialysis": false,
      "alarmsTest": true,
      "nursingActions": [
        { "time": "08:30", "focus": "Hypotension", "action": "Saline bolus 250ml",
          "evaluation": "BP returned to 110/70", "name": "Sara" }
      ],
      "dialysisParams": [
        { "time": "09:00", "systolic": "120", "diastolic": "80", "site": "right",
          "pulse": "78", "dialysateRate": "500", "uf": "1.0", "bfr": "300",
          "dialysateVol": "120", "ufVol": "1.0", "venous": "180", "effluent": "200",
          "access": "AV fistula", "alarms": "none", "initials": "SJ" }
      ],
      "intake": "500ml",
      "output": "1500ml",
      "car":       { "ffPercent": "20", "dialyzer": "F8HPS", "temp": "36.5" },
      "access":    "Right arm AV fistula",
      "dialysate": { "na": "138", "hco3": "32", "k": "2", "glucose": "100" },
      "anticoagType": "Heparin",
      "medAdmin": {
        "12": { "status": "yes", "timestamp": "2026-05-03T09:14:00Z", "reason": "" },
        "13": { "status": "no",  "timestamp": "2026-05-03T09:15:00Z", "reason": "Patient refused" }
      },
      "postTx": {
        "postWeight": "78.2", "lastBp": "120/80", "lastPulse": "76",
        "condition": "Stable", "notes": "Tolerated well"
      },
      "patientSignature": { "url": "https://cdn.goconnect.com/signatures/142-patient.png", "signedAt": "2026-05-03T11:55:00Z" },
      "nurseSignature":   { "url": "https://cdn.goconnect.com/signatures/142-nurse.png",   "signedAt": "2026-05-03T11:56:00Z" },
      "submittedAt": "2026-05-03T11:56:00Z"
    },
    "progressNotes": {
      "nursing": [
        { "id": 1, "visitId": 142, "note": "Patient stable through first hour. No alarms.",
          "author": "Mona Al-Harbi (RN)", "createdAt": "2026-05-03T09:05:00Z" }
      ],
      "doctor": [
        {
          "id": 1, "visitId": 142, "note": "Continue current heparin dose.",
          "vitalsSnapshot": {
            "temperature": "36.7", "respiratoryRate": "16", "oxygenSaturation": "98",
            "bloodPressure": "130/80", "pulseRate": "78",
            "preWeight": "80", "dryWeight": "78", "ufGoal": "2", "rbs": "115"
          },
          "isAddendum": false, "parentNoteId": null,
          "author": "Dr. Sara Al-Otaibi", "createdAt": "2026-05-03T09:30:00Z"
        }
      ],
      "socialWorker": [
        { "id": 1, "visitId": 142, "note": "Patient asked about transport assistance — referred to coordinator.",
          "location": "in_center", "author": "Khaled Al-Mutairi (MSW)", "createdAt": "2026-05-03T10:10:00Z" }
      ]
    },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [
      {
        "id": 12, "drugName": "Erythropoietin", "form": "Injection",
        "dosage": "4000 IU", "frequency": "TIW", "route": "SC",
        "duration": "ongoing", "durationPeriod": "weeks",
        "adminType": "scheduled", "instructions": "Administer at end of dialysis."
      },
      {
        "id": 13, "drugName": "Iron sucrose", "form": "Injection",
        "dosage": "100 mg", "frequency": "weekly", "route": "IV",
        "duration": "4", "durationPeriod": "weeks",
        "adminType": "scheduled", "instructions": "Slow IV push over 5 min."
      }
    ],
    "inventory": [
      { "id": 1, "name": "Dialyzer F8HPS",       "itemNumber": "INV-001", "available": 25 },
      { "id": 2, "name": "Heparin 5000 IU vial", "itemNumber": "INV-002", "available": 40 }
    ]
  }
}
```

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

**Response** — the full updated Visit. The `status` is unchanged from before the call (typically `"in_progress"`); the procedure-times fields land on the visit (the mobile cache replaces the visit object wholesale).

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [],
      "contamination": [],
      "instructions": "",
      "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [],
    "inventory": []
  }
}
```

---

## 9. Visit forms — write

All form submissions are scoped under a visit. **Every endpoint in this section responds with `{ "data": Visit }`** — the full updated Visit, with every top-level field present. The mobile cache replaces its current Visit with the response, so partial updates (a single new note, a single saved section, etc.) must come back inside the full visit envelope. The app never reconstructs the visit from individual sub-resource responses.

Each endpoint below shows its Request body and a complete Response example (the full Visit object, with the newly-saved entry highlighted by being the populated one in an otherwise empty list). Fields not relevant to the call still appear — empty arrays for unrelated forms, `{ "visitId": N }` for a flow-sheet that hasn't been touched, etc. — so the wire shape on every successful save is identical to the visit-detail shape (§8.2).

### 9.1 Flow sheet — single unified endpoint

`POST /visits/{visitId}/forms/flowsheet`

The flow sheet is a 15-section per-visit form. All sections post to the **same endpoint**. The section is identified by the top-level key inside the JSON body. The mobile app sends one key per save; the backend upserts only that section and leaves all others intact. Response is always the full updated Visit.

#### Section → body key → rule mapping

| # | Section | Body key | Content-Type | Rule |
|---|---|---|---|---|
| 9.1.1 | Outside Dialysis | `outside_dialysis` | JSON | `submit_flow_sheet_outside_dialysis` |
| 9.1.2 | Pre-Treatment Vitals | `pre_treatment_vital` | JSON | `submit_flow_sheet_pre_treatment_vitals` |
| 9.1.3 | Machines | `machines` | JSON | `submit_flow_sheet_machines` |
| 9.1.4 | Pain Assessment | `pain_assessment` | JSON | `submit_flow_sheet_pain_assessment` |
| 9.1.5 | Fall Risk | `fall_risk_assessment` | JSON | `submit_flow_sheet_fall_risk` |
| 9.1.6 | Nursing Action | `nursing_action` | JSON | `submit_flow_sheet_nursing_actions` |
| 9.1.7 | Dialysis Parameters | `hemodialysis` | JSON | `submit_flow_sheet_dialysis_parameters` |
| 9.1.8 | Alarms Test | `alarms_test` | JSON | `submit_flow_sheet_alarms_test` |
| 9.1.9 | Intake / Output | `intake_output` | JSON | `submit_flow_sheet_intake_output` |
| 9.1.10 | CAR | `car` | JSON | `submit_flow_sheet_car` |
| 9.1.11 | Access / Location | `access` | JSON | `submit_flow_sheet_access` |
| 9.1.12 | Dialysate | `dialysate` | JSON | `submit_flow_sheet_dialysate` |
| 9.1.13 | Anticoagulation | `anticoagulation` | JSON | `submit_flow_sheet_anticoagulation` |
| 9.1.14 | Dialysis Medications | `dialysis_medications` | JSON | `submit_flow_sheet_medications` |
| 9.1.15 | Post Treatment | `post_assessment` | JSON or **multipart** | `submit_flow_sheet_post_treatment` |

#### Optional `signature` field on JSON sections (9.1.1–9.1.14)

Every JSON section accepts an optional top-level `signature` field carrying the nurse's chair-side signature for that section. Shape:

```json
"signature": {
  "dataUrl":  "data:image/png;base64,iVBORw0KGgo...",
  "signedAt": "2026-05-04T09:30:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `signature.dataUrl` | string | yes (when `signature` present) | PNG captured by the in-app signature pad, encoded as a base64 data URI. |
| `signature.signedAt` | string | yes (when `signature` present) | ISO 8601 timestamp of the moment the nurse pressed Save. |

Send `signature` only when the user signed; omit the field entirely otherwise. (Post-Treatment §9.1.15 uses a different mechanism — multipart file parts; see below.)

#### Backend behaviour

1. Parse the URL path to identify the section. The slug must be one of the 15 listed above; anything else returns `404`.
2. Look up the matching rule and enforce it against `GET /me/rules`. Return `403` when missing.
3. Parse the body (JSON for sections 1–14, `multipart/form-data` for section 15 with `data` text field as JSON).
4. Validate the section's payload (see per-section reference below). Return `422` on semantic errors (impossible values, missing required field), `400` on malformed JSON / wrong content-type for post-treatment.
5. Upsert the section's slice on `forms.flowsheet[0].value` — do **not** wipe other sections (saving Pain Assessment must not erase previously saved Vitals).
6. If this was the Post-Treatment save, also stamp `forms.flowsheet[0].value.post_assessment.submitted_at`.
7. Respond `200 { "data": Visit }` — the full updated Visit (schema §8.2).

#### Wire example (canonical)

Every section follows the same wire pattern — only the top-level key and payload differ. One worked example:

```http
POST /visits/142/forms/flowsheet HTTP/1.1
Host: api.goconnect.com
Authorization: Bearer <accessToken>
Accept-Language: en
X-Lang: en
Content-Type: application/json

{
  "pre_treatment_vital": {
    "vitals": {
      "height": "172", "preWeight": "80", "dryWeight": "78", "ufGoal": "2",
      "bpSystolic": "130", "bpDiastolic": "80",
      "temperature": "36.7", "spo2": "98", "hr": "78", "rr": "16", "rbs": "115"
    },
    "bpSite": "Right arm",
    "method": "Manual"
  }
}
```

Response (`200`) — the **full updated Visit**. Every top-level field is present; flow-sheet sub-fields are only populated for sections the nurse has saved so far. The wire response below shows the visit just after the Pre-Treatment Vitals save in the request above (no other flow-sheet section has been saved yet).

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true },
      { "name": "Mona Al-Harbi",       "role": "Charge Nurse",  "phone": "+966504445566", "isPrimary": false }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [
        { "type": "drug", "value": "Penicillin" }
      ],
      "contamination": ["MRSA"],
      "instructions": "Reverse isolation. Limit visitors.",
      "isolation": "Contact precautions"
    },
    "forms": {
      "flowsheet": [
        {
          "id": 1,
          "createdAt": "2026-05-03T08:10:00Z",
          "updatedAt": "2026-05-03T08:10:00Z",
          "createdBy": { "id": 12, "name": "Sara Al-Otaibi" },
          "updatedBy": { "id": 12, "name": "Sara Al-Otaibi" },
          "value": {
            "pre_treatment_vital": {
              "height": "172", "weight": "80", "weight_dry": "78", "uf_goal": "2",
              "bp_systolic": "130", "bp_diastolic": "80",
              "temp": "36.7", "spo2": "98", "pr_value": "78", "rr": "16", "rbs": "115",
              "bp_site": "Right arm", "temp_method": "Manual"
            }
          }
        }
      ]
    },
    "progressNotes":  { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals":      [],
    "refusals":       [],
    "sariScreenings": [],
    "medications": [
      {
        "id": 12, "drugName": "Erythropoietin", "form": "Injection",
        "dosage": "4000 IU", "frequency": "TIW", "route": "SC",
        "duration": "ongoing", "durationPeriod": "weeks",
        "adminType": "scheduled", "instructions": "Administer at end of dialysis."
      },
      {
        "id": 13, "drugName": "Iron sucrose", "form": "Injection",
        "dosage": "100 mg", "frequency": "weekly", "route": "IV",
        "duration": "4", "durationPeriod": "weeks",
        "adminType": "scheduled", "instructions": "Slow IV push over 5 min."
      }
    ],
    "inventory": [
      { "id": 1, "name": "Dialyzer F8HPS",       "itemNumber": "INV-001", "available": 25 },
      { "id": 2, "name": "Heparin 5000 IU vial", "itemNumber": "INV-002", "available": 40 }
    ]
  }
}
```

If other flow-sheet sections were already saved before this call, they remain in `forms.flowsheet[0].value` (the backend upserts only the section under the request's top-level key — other sections are never erased). The mobile client maps `forms.flowsheet[0].value` (snake_case) into its own camelCase model — no follow-up `GET /visits/{id}` is fired after a save.

#### Per-section reference

Each block below documents one section: clinical purpose, request body, field reference, and where the saved values land inside `Visit.flowSheet`.

All values are **strings** unless noted otherwise — the mobile UI captures free-text input and does not re-cast numeric inputs. Send the raw string the nurse typed; the backend stores and echoes back as-is.

##### 9.1.1 `outside_dialysis` — Outside Dialysis

Flag indicating whether the dialysis session was performed outside the regular center.

```json
{ "outside_dialysis": { "outsideDialysis": true } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `outsideDialysis` | boolean | yes | `true` when off-site; `false` otherwise. |

Updates `forms.flowsheet[0].value.outside_dialysis`.

##### 9.1.2 `pre_treatment_vital` — Pre-Treatment Vitals

Patient vitals captured at the start of the session, plus where/how BP was measured.

```json
{
  "pre_treatment_vital": {
    "vitals": {
      "height": "172", "preWeight": "80", "dryWeight": "78", "ufGoal": "2",
      "bpSystolic": "130", "bpDiastolic": "80",
      "temperature": "36.7", "spo2": "98", "hr": "78", "rr": "16", "rbs": "115"
    },
    "bpSite": "Right arm",
    "method": "Manual"
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `vitals.height` | string | optional | Patient height (cm). |
| `vitals.preWeight` | string | yes | Pre-dialysis weight (kg). Stored as `weight` in `forms.flowsheet[0].value.pre_treatment_vital`. |
| `vitals.dryWeight` | string | yes | Target dry weight (kg). Stored as `weight_dry`. |
| `vitals.ufGoal` | string | yes | Ultrafiltration goal (kg). Stored as `uf_goal`. |
| `vitals.bpSystolic` | string | yes | Systolic BP (mmHg). Stored as `bp_systolic`. |
| `vitals.bpDiastolic` | string | yes | Diastolic BP (mmHg). Stored as `bp_diastolic`. |
| `vitals.temperature` | string | yes | Body temperature (°C). Stored as `temp`. |
| `vitals.spo2` | string | yes | Oxygen saturation (%). |
| `vitals.hr` | string | yes | Heart rate (bpm). Stored as `pr_value`. |
| `vitals.rr` | string | yes | Respiratory rate (per minute). |
| `vitals.rbs` | string | yes | Random blood sugar (mg/dL). |
| `bpSite` | string | yes | Where BP was measured (e.g. `"Right arm"`, `"Left arm"`). Stored as `bp_site`. |
| `method` | string | yes | Measurement method (e.g. `"Manual"`, `"Automatic"`). Stored as `temp_method`. |

Updates `forms.flowsheet[0].value.pre_treatment_vital` (snake_case). The backend also derives `preTreatmentVitals` used by the doctor-note `vitalsSnapshot`.

##### 9.1.3 `machines` — Machines

The dialysis machine make/model assigned to this session.

```json
{ "machines": { "machine": "Fresenius 4008S" } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `machine` | string | yes | One of the allowed values below (mobile shows a dropdown). |

**Allowed values for `machine`:**

| Value |
|---|
| `"Fresenius 4008S"` |
| `"Fresenius 5008S"` |
| `"Fresenius 6008"` |
| `"Nipro Surdial X"` |
| `"Nipro Surdial 55 Plus"` |
| `"B.Braun Dialog+"` |
| `"B.Braun Dialog Adv"` |
| `"Nikkiso DBB-06"` |
| `"Gambro AK 200S"` |
| `"Toray TR-321"` |

Updates `forms.flowsheet[0].value.machines`.

##### 9.1.4 `pain_assessment` — Pain Assessment

Pain score (0–10) plus characterisation (location, type, what makes it better/worse).

```json
{
  "pain_assessment": {
    "pain": "3",
    "painDetails": {
      "toolUsed": "NRS", "location": "Lower back", "frequency": "Intermittent",
      "radiatingTo": "", "painType": "Dull", "occurs": "On movement",
      "ambulating": "Worse", "resting": "Better", "eating": "",
      "relievedBy": "Rest", "worsensBy": "Standing"
    }
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `pain` | string | yes | Numeric score `"0"` – `"10"` (string). |
| `painDetails.toolUsed` | string | yes | Assessment tool (e.g. `"NRS"`, `"FLACC"`, `"Wong-Baker"`). |
| `painDetails.location` | string | optional | Body location. |
| `painDetails.frequency` | string | optional | e.g. `"Constant"`, `"Intermittent"`. |
| `painDetails.radiatingTo` | string | optional | Free text. |
| `painDetails.painType` | string | optional | e.g. `"Sharp"`, `"Dull"`, `"Burning"`. |
| `painDetails.occurs` | string | optional | When the pain occurs. |
| `painDetails.ambulating` | string | optional | `"Better"` / `"Worse"` / free text. |
| `painDetails.resting` | string | optional | Same. |
| `painDetails.eating` | string | optional | Same. |
| `painDetails.relievedBy` | string | optional | Free text. |
| `painDetails.worsensBy` | string | optional | Free text. |

Send empty strings (not `null`, not omitted) for optional fields the nurse left blank, so the section payload remains shape-stable.

Updates `forms.flowsheet[0].value.pain_assessment`.

##### 9.1.5 `fall_risk_assessment` — Fall Risk

Fall-risk classification + Morse Fall Scale individual scores and total.

```json
{
  "fall_risk_assessment": {
    "fallRisk": "Moderate",
    "highFallRisk": false,
    "morseValues": { "a": 0, "b": 0, "c": 15, "d": 0, "e": 10, "f": 0 },
    "morseTotal": 25
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `fallRisk` | string | yes | Risk band — one of `"Low"`, `"Moderate"`, `"High"`. |
| `highFallRisk` | boolean | yes | Explicit clinical override; nurse may flag high risk regardless of Morse total. |
| `morseValues.a` | number | yes | History of falling (0 / 25). |
| `morseValues.b` | number | yes | Secondary diagnosis (0 / 15). |
| `morseValues.c` | number | yes | Ambulatory aid (0 / 15 / 30). |
| `morseValues.d` | number | yes | IV / heparin lock (0 / 20). |
| `morseValues.e` | number | yes | Gait / transferring (0 / 10 / 20). |
| `morseValues.f` | number | yes | Mental status (0 / 15). |
| `morseTotal` | number | yes | Sum of `morseValues.a–f`. Backend may recompute and reject (`422`) on mismatch. |

Updates `forms.flowsheet[0].value.fall_risk_assessment`.

##### 9.1.6 `nursing_action` — Nursing Action

Append-style log of clinical actions taken during the session. Each Save **replaces** the entire array (the mobile client always sends the full current list).

```json
{
  "nursing_action": {
    "nursingActions": [
      { "time": "08:30", "focus": "Hypotension", "action": "Saline bolus 250ml",
        "evaluation": "BP returned to 110/70", "name": "Sara" }
    ]
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `nursingActions[].time` | string | yes | `"HH:mm"`. |
| `nursingActions[].focus` | string | yes | Clinical focus / problem. |
| `nursingActions[].action` | string | yes | Intervention performed. |
| `nursingActions[].evaluation` | string | yes | Outcome / patient response. |
| `nursingActions[].name` | string | yes | Nurse name / initials. |

Updates `forms.flowsheet[0].value.nursing_action` (replaces the entire array).

##### 9.1.7 `hemodialysis` — Dialysis Parameters

Time-series of machine and patient parameters captured throughout the session. Each Save replaces the entire array.

```json
{
  "hemodialysis": {
    "dialysisParams": [
      { "time": "09:00", "systolic": "120", "diastolic": "80", "site": "right",
        "pulse": "78", "dialysateRate": "500", "uf": "1.0", "bfr": "300",
        "dialysateVol": "120", "ufVol": "1.0", "venous": "180", "effluent": "200",
        "access": "AV fistula", "alarms": "none", "initials": "SJ" }
    ]
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `dialysisParams[].time` | string | yes | `"HH:mm"`. |
| `dialysisParams[].systolic` | string | yes | Systolic BP (mmHg). Stored as `blood_pressure_systolic`. |
| `dialysisParams[].diastolic` | string | yes | Diastolic BP (mmHg). Stored as `blood_pressure_diastolic`. |
| `dialysisParams[].site` | string | yes | BP site shorthand (`"right"` / `"left"`). |
| `dialysisParams[].pulse` | string | yes | bpm. |
| `dialysisParams[].dialysateRate` | string | yes | mL/min. Stored as `dialysate_rate`. |
| `dialysisParams[].uf` | string | yes | Ultrafiltration rate (kg/hr). Stored as `uf_rate`. |
| `dialysisParams[].bfr` | string | yes | Blood flow rate (mL/min). |
| `dialysisParams[].dialysateVol` | string | yes | Dialysate volume (L). Stored as `dialysate_volume`. |
| `dialysisParams[].ufVol` | string | yes | UF volume so far (kg). Stored as `uf_volume`. |
| `dialysisParams[].venous` | string | yes | Venous pressure (mmHg). |
| `dialysisParams[].effluent` | string | optional | Effluent / TMP (mmHg). |
| `dialysisParams[].access` | string | yes | Access in use (e.g. `"AV fistula"`, `"AV graft"`, `"Catheter"`). |
| `dialysisParams[].alarms` | string | optional | Free text — alarms triggered, `"none"` if clean. |
| `dialysisParams[].initials` | string | yes | Nurse initials. |

Updates `forms.flowsheet[0].value.hemodialysis.dialysis` (replaces the entire array).

##### 9.1.8 `alarms_test` — Alarms Test

Confirmation flag that machine alarms were tested before dialysis began.

```json
{ "alarms_test": { "alarmsTest": true } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `alarmsTest` | boolean | yes | `true` when alarms were tested OK; `false` otherwise. Stored as `passed: "1"` / `"0"`. |

Updates `forms.flowsheet[0].value.alarms_test`.

##### 9.1.9 `intake_output` — Intake / Output

Total fluids in/out for the session.

```json
{ "intake_output": { "intake": "500ml", "output": "1500ml" } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `intake` | string | yes | Volume in (free-text including unit, e.g. `"500ml"`). |
| `output` | string | yes | Volume out. |

Updates `forms.flowsheet[0].value.intake_output`.

##### 9.1.10 `car` — CAR

Dialyzer / circuit info captured at the chair.

```json
{ "car": { "car": { "ffPercent": "20", "dialyzer": "F8HPS", "temp": "36.5" } } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `car.ffPercent` | string | yes | Filtration fraction (%). |
| `car.dialyzer` | string | yes | Dialyzer model. |
| `car.temp` | string | yes | Dialysate temperature (°C). |

Updates `forms.flowsheet[0].value.car`.

##### 9.1.11 `access` — Access / Location

Description of the vascular access used.

```json
{ "access": { "access": "AVF" } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `access` | string | yes | One of the allowed values below (mobile shows a dropdown). |

**Allowed values for `access`:**

| Value | Description |
|---|---|
| `"AVF"` | Arteriovenous Fistula |
| `"AVG"` | Arteriovenous Graft |
| `"CATHETER"` | Central venous catheter |
| `"Permacath"` | Permanent tunnelled catheter |

Updates `forms.flowsheet[0].value.access`.

##### 9.1.12 `dialysate` — Dialysate

Composition of the dialysate solution.

```json
{ "dialysate": { "dialysate": { "na": "138", "hco3": "32", "k": "2", "glucose": "100" } } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `dialysate.na` | string | yes | Sodium (mEq/L). |
| `dialysate.hco3` | string | yes | Bicarbonate (mEq/L). |
| `dialysate.k` | string | yes | Potassium (mEq/L). |
| `dialysate.glucose` | string | yes | Glucose (mg/dL). |

Updates `forms.flowsheet[0].value.dialysate`.

##### 9.1.13 `anticoagulation` — Anticoagulation

The anticoagulant in use during the session.

```json
{ "anticoagulation": { "anticoagType": "Heparin" } }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `anticoagType` | string | yes | One of the allowed values below (mobile shows a dropdown). |

**Allowed values for `anticoagType`:**

| Value |
|---|
| `"Heparin"` |
| `"Low Molecular Weight Heparin"` |
| `"Citrate"` |
| `"Nafamostat"` |
| `"Argatroban"` |
| `"None"` |

Updates `forms.flowsheet[0].value.anticoagulation`.

##### 9.1.14 `medications` — Dialysis Medications

Per-medication administration record. Keys of `medAdmin` are the **medication IDs** taken from `Visit.medications[]` (§10). Each save replaces `forms.flowsheet[0].value.dialysis_medications` entirely with the map sent.

```json
{
  "medications": {
    "medAdmin": {
      "12": { "status": "yes", "timestamp": "2026-04-26T09:14:00Z", "reason": "" },
      "13": { "status": "no",  "timestamp": "2026-04-26T09:15:00Z", "reason": "Patient refused" }
    }
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `medAdmin` | object | yes | Map keyed by medication id (string). |
| `medAdmin[id].status` | `"yes" \| "no" \| null` | yes | `"yes"` administered, `"no"` skipped, `null` not yet decided. |
| `medAdmin[id].timestamp` | string | yes when `status !== null` | ISO 8601. |
| `medAdmin[id].reason` | string | yes when `status === "no"` | Reason for skipping. Empty string otherwise. |

Updates `forms.flowsheet[0].value.dialysis_medications` (replaces the entire map).

##### 9.1.15 `post_treatment` — Post Treatment

Final vitals + patient/nurse signatures. When at least one signature PNG is present the request is sent as `multipart/form-data`; when no signatures are included a plain `application/json` request is used instead.

**Multipart fields** *(only when signatures are present)*

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | text (JSON string) | yes | `{ "post_assessment": { ... } }` — see schema below. |
| `patient_signature` | file (`image/png`) | optional | Patient signature PNG. |
| `patient_signature_signed_at` | text (ISO 8601) | optional | Sent alongside the file. |
| `nurse_signature` | file (`image/png`) | optional | Nurse signature PNG. |
| `nurse_signature_signed_at` | text (ISO 8601) | optional | Sent alongside the file. |

**JSON payload** (sent as body when no signatures, or as the `data` field when multipart):

```json
{
  "post_assessment": {
    "bp_sitting_systolic":  "168",
    "bp_sitting_diastolic": "95",
    "bp_sitting_site":      "Right Forearm",
    "pulse":                "78",
    "temp":                 "36",
    "temp_method":          "Temporal",
    "spo2":                 "99",
    "rr":                   "18",
    "rbs":                  "109",
    "weight":               "67.5",
    "tx_time_hr":           "4",
    "dialysate_l":          "50",
    "uf":                   "2.5",
    "blp":                  "70",
    "uf_net":               "",
    "catheter_lock":        "Heparin",
    "arterial_access":      "1.6",
    "venous_access":        "1,6",
    "machine_disinfected":  "yes",
    "access_problems":      "None",
    "non_medical_incidence": "None"
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `bp_sitting_systolic` | string | yes | Systolic BP sitting (mmHg). |
| `bp_sitting_diastolic` | string | yes | Diastolic BP sitting (mmHg). |
| `bp_sitting_site` | string | yes | Location where BP was measured (free-text, e.g. `"Right Forearm"`). |
| `pulse` | string | yes | Pulse rate (bpm). |
| `temp` | string | yes | Temperature (°C). |
| `temp_method` | string | yes | Measurement method — see **Allowed values** below. |
| `spo2` | string | yes | Oxygen saturation (%). |
| `rr` | string | yes | Respiratory rate (cpm). |
| `rbs` | string | yes | Random blood sugar (mg/dl). |
| `weight` | string | yes | Post-dialysis weight (kg). |
| `tx_time_hr` | string | yes | Treatment duration in hours. |
| `dialysate_l` | string | yes | Dialysate volume (L). |
| `uf` | string | yes | Ultrafiltration volume. |
| `blp` | string | yes | Blood pressure (BLP reading). |
| `uf_net` | string | optional | Net ultrafiltration. Empty string when not entered. |
| `catheter_lock` | string | optional | Catheter lock agent used (e.g. `"Heparin"`). |
| `arterial_access` | string | optional | Arterial needle gauge / access info. |
| `venous_access` | string | optional | Venous needle gauge / access info. |
| `machine_disinfected` | `"yes"` \| `"no"` | yes | Whether the machine was disinfected after the session. |
| `access_problems` | string | optional | Access/bleeding problems observed. Empty string or `"None"` when none. |
| `non_medical_incidence` | string | optional | Non-medical incidences during the session. Empty string or `"None"` when none. |

**Allowed values for `temp_method`:**

| Value |
|---|
| `"Oral"` |
| `"Axillary"` |
| `"Tympanic"` |
| `"Temporal"` |
| `"Rectal"` |

Backend behaviour:
- Persist each PNG (e.g. on S3) and return public URLs inside `forms.flowsheet[0].value.post_assessment.patient_signature.url` / `.nurse_signature.url`.
- Stamp `forms.flowsheet[0].value.post_assessment.submitted_at` with the server time.
- Do **not** require both signatures — either may be absent (e.g. patient unable to sign).

Updates `forms.flowsheet[0].value.post_assessment`.

#### Errors

| Status | When | Body |
|---|---|---|
| `400` | Body missing the section key, has more than one top-level key, malformed JSON, or wrong content-type for `post_treatment`. | `{ "message": "..." }` |
| `401` | Token missing / expired. App signs the user out. | `{ "message": "..." }` |
| `403` | User lacks the rule for the submitted section. | `{ "message": "..." }` |
| `404` | `{id}` is not a visit assigned to the user. | `{ "message": "..." }` |
| `422` | Section payload fails semantic validation (e.g. `morseTotal` ≠ sum of `morseValues`, missing required field, impossible numeric value). | `{ "message": "..." }` |
| `500` | Unhandled server error. | `{ "message": "..." }` |

### 9.2 Nursing progress note
`POST /visits/{id}/nursing-progress-notes`
`Content-Type: application/json`

Rule: `submit_nursing_progress_note`. Appends a new entry to `Visit.progressNotes.nursing`.

**Request**
```json
{
  "note": "Patient stable through first hour. No alarms."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `note` | string | yes | Free-text body of the note. Must be non-empty (the mobile client trims whitespace and short-circuits otherwise). |

The backend fills in the new `id`, `author` (current authenticated user), and `createdAt` (server time).

**Response** — the full updated Visit. The newly-created note appears at the end of `progressNotes.nursing`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": {
      "nursing": [
        {
          "id": 1,
          "visitId": 142,
          "note": "Patient stable through first hour. No alarms.",
          "author": "Mona Al-Harbi (RN)",
          "createdAt": "2026-05-03T09:05:00Z"
        }
      ],
      "doctor": [],
      "socialWorker": []
    },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [],
    "inventory": []
  }
}
```

### 9.3 Doctor progress note
`POST /visits/{id}/doctor-progress-notes`
`Content-Type: application/json`

Rule: `submit_doctor_progress_note`. Appends a new entry to `Visit.progressNotes.doctor`.

**Request — original note**
```json
{
  "note": "Continue current heparin dose.",
  "isAddendum": false,
  "parentNoteId": null
}
```

**Request — addendum to an earlier note**
```json
{
  "note": "Reduce heparin to 1500 IU after observed bleeding from access.",
  "isAddendum": true,
  "parentNoteId": 1
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `note` | string | yes | Free-text body. Must be non-empty. |
| `isAddendum` | boolean | yes | `true` when amending an earlier doctor note; `false` for a fresh note. |
| `parentNoteId` | number \| null | conditionally | Required when `isAddendum === true` (id of the earlier doctor note being amended); send `null` when `isAddendum === false`. |

The backend fills `id`, `author` (current authenticated user), `createdAt` (server time), and snapshots `forms.flowsheet[0].value.pre_treatment_vital` into the new note's `vitalsSnapshot` (so the doctor's view of the patient's vitals at the time of writing is preserved even if the flow sheet is later updated).

**Response** — the full updated Visit. The newly-created doctor note appears at the end of `progressNotes.doctor`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": {
      "visitId": 142,
      "preTreatmentVitals": {
        "temperature": "36.7", "respiratoryRate": "16", "oxygenSaturation": "98",
        "bloodPressure": "130/80", "pulseRate": "78",
        "preWeight": "80", "dryWeight": "78", "ufGoal": "2", "rbs": "115"
      }
    },
    "progressNotes": {
      "nursing": [],
      "doctor": [
        {
          "id": 1,
          "visitId": 142,
          "note": "Continue current heparin dose.",
          "vitalsSnapshot": {
            "temperature": "36.7", "respiratoryRate": "16", "oxygenSaturation": "98",
            "bloodPressure": "130/80", "pulseRate": "78",
            "preWeight": "80", "dryWeight": "78", "ufGoal": "2", "rbs": "115"
          },
          "isAddendum": false,
          "parentNoteId": null,
          "author": "Dr. Sara Al-Otaibi",
          "createdAt": "2026-05-03T09:30:00Z"
        }
      ],
      "socialWorker": []
    },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [],
    "inventory": []
  }
}
```

### 9.4 Social-worker progress note
`POST /visits/{id}/social-worker-progress-notes`
`Content-Type: application/json`

Rule: `submit_social_worker_progress_note`. Appends a new entry to `Visit.progressNotes.socialWorker`.

**Request**
```json
{
  "note": "Patient asked about transport assistance — referred to coordinator.",
  "location": "in_center"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `note` | string | yes | Free-text body. Must be non-empty. |
| `location` | string enum | yes | One of `"on_call"` or `"in_center"`. Indicates where the encounter took place. |

The backend fills `id`, `author` (current authenticated user), and `createdAt` (server time).

**Response** — the full updated Visit. The newly-created social-worker note appears at the end of `progressNotes.socialWorker`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": {
      "nursing": [],
      "doctor": [],
      "socialWorker": [
        {
          "id": 1,
          "visitId": 142,
          "note": "Patient asked about transport assistance — referred to coordinator.",
          "location": "in_center",
          "author": "Khaled Al-Mutairi (MSW)",
          "createdAt": "2026-05-03T10:10:00Z"
        }
      ]
    },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [],
    "inventory": []
  }
}
```

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
- `referralType` must be one of the listed enum values (mobile shows a dropdown).
- `referralHospital` must be one of the listed values below (mobile shows a dropdown).
- `printOptions` — booleans for which reports the nurse wants printed alongside the referral.

**Allowed values for `referralType`:**

| Value |
|---|
| `"Outpatient"` |
| `"Inpatient"` |
| `"Emergency"` |
| `"Follow-up"` |
| `"Specialist Consult"` |

**Allowed values for `referralHospital`:**

| Value |
|---|
| `"King Fahd Medical City"` |
| `"King Khalid University Hospital"` |
| `"King Faisal Specialist Hospital"` |
| `"Security Forces Hospital"` |
| `"National Guard Hospital"` |

The backend fills in `id`, `primaryPhysician`, `referralBy`, `status` (typically `"Active"`), `createdAt`. If `attachment` is sent, it persists the file (e.g. on S3) and stores the URL.

**Response** — the full updated Visit. The newly-created referral appears at the end of `referrals`, with `attachmentUrl` (public URL of the persisted file) and `attachmentName` (original filename). When no attachment was uploaded, both `attachmentUrl` and `attachmentName` are `null`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals": [
      {
        "id": 1,
        "visitId": 142,
        "referralDate": "2026-05-03",
        "primaryPhysician": "Dr. Sara Al-Otaibi",
        "referralBy": "Dr. Sara Al-Otaibi",
        "status": "Active",
        "referralType": "Outpatient",
        "referralHospital": "King Faisal Specialist Hospital",
        "printOptions": {
          "monthlyMedicalReport": true,
          "systemMedicalReport":  false,
          "labResult":            true,
          "last3FlowSheets":      false
        },
        "referralReason":  "Cardiology consult — new arrhythmia.",
        "completionDate":  "2026-05-10",
        "comments":        "Please send report back to nephrology.",
        "attachmentUrl":   "https://cdn.goconnect.com/referrals/142-1.pdf",
        "attachmentName":  "ECG_2026-05-03.pdf",
        "createdAt":       "2026-05-03T10:30:00Z"
      }
    ],
    "refusals": [],
    "sariScreenings": [],
    "medications": [],
    "inventory": []
  }
}
```

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
- `relative.relationship` must be one of the listed values below (mobile shows a dropdown).
- `signed` and `signedAt` for each party are always in `data`. The PNG bytes ride as the matching `*_signature` multipart file part.

**Allowed values for `relative.relationship`:**

| Value |
|---|
| `"Father"` |
| `"Mother"` |
| `"Spouse"` |
| `"Son"` |
| `"Daughter"` |
| `"Brother"` |
| `"Sister"` |
| `"Guardian"` |
| `"Other"` |

The backend fills `id`, `author`, `createdAt`, and stores each uploaded PNG (e.g. on S3). The persisted Refusal returned inside `Visit.refusals` carries `signatureUrl` per party (URL of the stored PNG) instead of `signatureData`. When a party did not sign (`signed === false`), the corresponding `signatureUrl` is `null` and `signedAt` is `null`.

**Response** — the full updated Visit. The newly-created refusal appears at the end of `refusals`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals": [],
    "refusals": [
      {
        "id": 1,
        "visitId": 142,
        "types": ["discontinuation", "refusal_consent"],
        "reason": "Patient elected to end session early.",
        "risks": {
          "hyperkalemia":   true,
          "cardiacArrest":  false,
          "pulmonaryEdema": true,
          "severeAcidosis": false,
          "others":         "Volume overload"
        },
        "witness": {
          "name":         "Mona Al-Harbi",
          "signed":       true,
          "signedAt":     "2026-05-03T11:00:00Z",
          "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-witness.png",
          "address":      "Riyadh Care Hospital, Riyadh"
        },
        "unableToSignReason": "",
        "relative": {
          "name":         "Khalid Al-Saud",
          "relationship": "Son",
          "signed":       true,
          "signedAt":     "2026-05-03T11:01:00Z",
          "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-relative.png"
        },
        "doctor": {
          "name":         "Dr. Sara Al-Otaibi",
          "signed":       true,
          "signedAt":     "2026-05-03T11:02:00Z",
          "signatureUrl": "https://cdn.goconnect.com/signatures/refusal-1-doctor.png"
        },
        "interpreter": {
          "name":         "",
          "signed":       false,
          "signedAt":     null,
          "signatureUrl": null
        },
        "author":    "Mona Al-Harbi (RN)",
        "createdAt": "2026-05-03T11:05:00Z"
      }
    ],
    "sariScreenings": [],
    "medications": [],
    "inventory": []
  }
}
```

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

The backend fills `id`, `author` (current authenticated user), and `createdAt` (server time).

**Response** — the full updated Visit. The newly-created screening appears at the end of `sariScreenings`.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [
      {
        "id": 1,
        "visitId": 142,
        "addressographPatientName": "Ahmed Al-Saud",
        "dateTime": "2026-05-03T08:15:00Z",
        "sariFeatures": {
          "fever":                "no",
          "coughOrBreathing":     "no",
          "radiographicEvidence": "no"
        },
        "exposureCriteria": {
          "closeContactSari":               "no",
          "travelToPhacNotice":             "no",
          "recentExposurePotentialSource":  "no",
          "inconsistentWithOtherKnownCause": "no"
        },
        "actions": {
          "thinkInfectionControl":             "done",
          "tellMedicalHealthOfficer":          "not_done",
          "tellInfectionControl":              "not_done",
          "consultInfectiousDiseaseSpecialist": "not_done",
          "test":                              "not_done"
        },
        "author":    "Mona Al-Harbi (RN)",
        "createdAt": "2026-05-03T08:18:00Z"
      }
    ],
    "medications": [],
    "inventory": []
  }
}
```

### 9.8 Inventory usage
`POST /visits/{id}/inventory-usage`
`Content-Type: application/json`

Rule: `submit_inventory_usage`. Records one inventory item consumed during this visit. The backend deducts the `quantity` from the patient's available stock (see §10).

**Request**
```json
{
  "itemId": 1,
  "quantity": 2,
  "notes": "Used for AV fistula access"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `itemId` | number | yes | The inventory item's id. Must match an `id` in `Visit.inventory[]` (§10). |
| `quantity` | number | yes | Units consumed. Must be `> 0` and `<= item.available` — backend returns `422` otherwise. |
| `notes` | string | optional | Free-text reason / context. Send empty string `""` when the nurse left it blank. |

**Response** — the full updated Visit. The matching entry in `inventory[]` reflects the new `available` (decremented by `quantity`); all other fields of the visit are unchanged from the previous read.

```json
{
  "data": {
    "id": 142,
    "patientName": "Ahmed Al-Saud",
    "patientId": 1,
    "date": "2026-05-03",
    "time": "08:00",
    "type": "Hemodialysis",
    "status": "in_progress",
    "provider": "Dr. Sara Al-Otaibi",
    "address": "Riyadh Care Hospital — Bay 3",
    "duration": 240,
    "careTeam": [
      { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
    ],
    "patient": {
      "id": 1,
      "patientId": "P-2024-001",
      "mrn": "MRN-001",
      "name": "Ahmed Al-Saud",
      "dob": "1965-04-12",
      "gender": "male",
      "phone": "+966501234567",
      "email": "ahmed.alsaud@example.com",
      "address": "King Fahd Road, Riyadh",
      "location": "Center A — Bay 3",
      "bloodType": "A+",
      "codeStatus": "Full Code",
      "treatmentHoliday": false,
      "status": "active",
      "lastVisit": "2026-04-30",
      "diagnosis": "End-stage renal disease",
      "avatarUrl": "https://cdn.goconnect.com/avatars/1.png",
      "careTeam": [
        { "name": "Dr. Sara Al-Otaibi", "role": "Nephrologist", "phone": "+966501112233", "isPrimary": true }
      ]
    },
    "patientAlerts": {
      "allergies": [], "contamination": [], "instructions": "", "isolation": null
    },
    "flowSheet": { "visitId": 142 },
    "progressNotes": { "nursing": [], "doctor": [], "socialWorker": [] },
    "referrals": [],
    "refusals": [],
    "sariScreenings": [],
    "medications": [
      {
        "id": 12, "drugName": "Erythropoietin", "form": "Injection",
        "dosage": "4000 IU", "frequency": "TIW", "route": "SC",
        "duration": "ongoing", "durationPeriod": "weeks",
        "adminType": "scheduled", "instructions": "Administer at end of dialysis."
      }
    ],
    "inventory": [
      { "id": 1, "name": "Dialyzer F8HPS",       "itemNumber": "INV-001", "available": 23 },
      { "id": 2, "name": "Heparin 5000 IU vial", "itemNumber": "INV-002", "available": 40 }
    ]
  }
}
```

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

## 11. Help & support

Source: [data/support_repository.ts](data/support_repository.ts), [data/models/support.ts](data/models/support.ts), [app/(settings)/help-support.tsx](app/(settings)/help-support.tsx).

### 11.1 Submit support message
`POST /support/messages`
`Content-Type: application/json`

Rule: `submit_support_message`. Submits a contact-form message from the
in-app **Help & Support** screen. The backend forwards the message to the
support inbox (and may email a copy to the user).

**Request**
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```
- All fields are required and non-empty (the mobile client trims whitespace
  and short-circuits with a local validation error otherwise).
- `email` — the address support should reply to. The mobile client does no
  format check beyond non-emptiness; the backend should validate and return
  `400` on a malformed value.

**Response** — `204` (no body). The mobile client surfaces a "message sent"
confirmation regardless of whether the backend echoes anything back.

### 11.2 Errors
- `400` — validation failed (missing field, malformed email).
- `401` — token invalid/expired → app signs the user out.
- `403` — user lacks `submit_support_message` (e.g. role with read-only
  access). The mobile client should surface the message and leave the form
  populated so the user can retry after a permission change.

---

## 12. Endpoint summary

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

### Permissions, home, patients, lab, scheduler
| # | Endpoint | Method |
|---|---|---|
| 3.1 | `/me/rules` | GET |
| 4.1 | `/home` | GET |
| 5.1 | `/patients` | GET |
| 5.2 | `/patients/{id}` | GET |
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
| 9.1 | `/visits/{id}/flow-sheet` | POST | JSON or **multipart** (post-treatment) — single top-level section key in body picks the section + rule |
| 9.2 | `/visits/{id}/nursing-progress-notes` | POST | JSON |
| 9.3 | `/visits/{id}/doctor-progress-notes` | POST | JSON |
| 9.4 | `/visits/{id}/social-worker-progress-notes` | POST | JSON |
| 9.5 | `/visits/{id}/referrals` | POST | **multipart** |
| 9.6 | `/visits/{id}/refusals` | POST | **multipart** |
| 9.7 | `/visits/{id}/sari-screenings` | POST | JSON |
| 9.8 | `/visits/{id}/inventory-usage` | POST | JSON |

> Reference data (medications + inventory) ride on the `GET /visits/{id}` response — no standalone endpoints. See §10.

### Help & support
| # | Endpoint | Method |
|---|---|---|
| 11.1 | `/support/messages` | POST |

**Total: 34 endpoints.**
