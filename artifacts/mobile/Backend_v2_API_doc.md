# Backend v2 — API Doc

Single reference for everything different between the mobile app and the
**v2 Postman backend contract**:

- **Part 1 — Conflicts:** field/shape mismatches the app code was sending or
  reading wrong.
- **Part 2 — Missing on the backend:** data the app wants that v2 doesn't
  return.
- **Part 3 — Missing in the app:** v2 endpoints / fields the app doesn't use yet.
- **Part 4 — Action checklist** with owners and priorities.

| Legend | Meaning |
| :---: | :--- |
| ✅ | Fixed in code (this pass) |
| ⚠️ | Needs a product / backend decision |
| 🔴 | Blocks a screen / feature |
| 🟠 | Field shown in UI is always blank/undefined |
| 🟡 | Endpoint exists on one side only — feature gap |
| ➖ | Match — no change required |

---

# Part 1 — Conflicts (mismatches that were fixed)

## 1.1 Auth

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 1 | `POST /auth/register` | Body simplified to `{ registerCode?, phone, fullName, email }`. Removed `username`, `password`, `password_confirmation`; renamed `name` → `fullName`. Registration is now identifier-only — password is set later via OTP. | ✅ |
| 2 | `POST /auth/verify-otp` | Field `email` → `identifier` (server accepts email **or** phone). | ✅ |
| 3 | login, me, profile, forgot/reset/change password, logout, delete-account, device-token, verify-face | unchanged | ➖ |

**Files touched:** `data/models/auth.ts`, `data/auth_repository.ts`, `app/(auth)/register.tsx`, `app/(auth)/otp.tsx`.

---

## 1.2 Patients

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 1 | `GET /patients/{id}/alerts` | Returns an **object** `{ allergies, contamination, instructions, isolation }`, not an array. New helper `getPatientAlertSummary` returns the object; legacy `getPatientAlerts` is now a deprecated stub returning `[]`. | ✅ |
| 2 | List + detail | Match. | ➖ |

> The visit-detail screen reads `record.patientAlerts` from the embedded visit response, not this endpoint. `Visit.patientAlerts` is now typed as `PatientAlertSummary | PatientAlert[] | PatientAlert | null`.

**Files touched:** `data/patient_repository.ts`, `data/models/visit.ts`.

---

## 1.3 Flow sheet — section keys (`POST /visits/{id}/forms/flowsheet`)

The mobile UI saves one section at a time; each section is sent under a
top-level key inside the flowsheet form. **Six keys were renamed in v2:**

| Section | Old key (broken) | New key (server v2) |
|---|---|---|
| Pre-treatment vitals | `pre_treatment_vital` | `pre_treatment_vitals` |
| Fall risk | `fall_risk_assessment` | `fall_risk` |
| Nursing actions | `nursing_action` | `nursing_actions` |
| Dialysis parameters | `hemodialysis` | `dialysis_parameters` |
| Medications | `dialysis_medications` | `medications` |
| Post-treatment | `post_assessment` | `post_treatment` |

The other 9 keys (`outside_dialysis`, `machines`, `pain_assessment`,
`alarms_test`, `intake_output`, `car`, `access`, `dialysate`,
`anticoagulation`) were already correct.

**Status:** ✅ Fixed in `FLOWSHEET_SECTION_KEY`.

---

## 1.4 Flow sheet — body shapes & read mapping

| # | What changed | Status |
|---|---|:---:|
| 1 | **Read mapper** `mapFlowSheetFromApi` now reads v2 nested camelCase shapes (`pre_treatment_vitals.vitals`, `car.car`, `dialysate.dialysate`, `dialysis_parameters.dialysisParams[]`, `nursing_actions.nursingActions[]`, `post_treatment.postTx`, `medications.medAdmin`) — falls back to legacy snake_case for older responses. | ✅ |
| 2 | **Post-treatment save** now sends `{ post_treatment: { postTx: <camelCase fields> } }`. The legacy snake_case translator was removed. | ✅ |

**File touched:** `data/visit_repository.ts`.

---

## 1.5 Progress notes

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 1 | `POST /visits/{id}/forms/nursing-progress-note` | Body field `notes` → `note`. | ✅ |
| 2 | `POST /visits/{id}/forms/progress-notes` (doctor) | Body now `{ type: "doctor", note, isAddendum, parentNoteId }` (was `{ type: "in_visit", notes, addenda: [...] }`). | ✅ |
| 3 | `POST /visits/{id}/forms/progress-notes` (social worker) | Body now `{ type: "social_worker", note, location }` (was `{ type: derived, notes, addenda: [] }`). | ✅ |

---

## 1.6 Other visit forms

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 1 | `POST /visits/{id}/forms/sari_screening` | `visitId` is in the URL only — stripped from the body. | ✅ |
| 2 | `POST /visits/{id}/forms/refusal` | Multipart layout already matches v2. | ➖ |
| 3 | `POST /visits/{id}/forms/referral` | Match. | ➖ |
| 4 | `POST /visits/{id}/forms/inventory-usage` | Body `{ itemId, quantity, notes }` matches. | ➖ |

---

## 1.7 Sections that already match

Lab results, scheduler (`/scheduler/slots`, `…/{id}`, `…/confirm`,
`…/check-in`), visit read & status (`GET /visits`, `GET /visits/{id}`,
`POST …/start`, `…/end`, `…/procedure-times`) — all align with v2.

---

# Part 2 — Missing on the backend (data the app expects but v2 doesn't return)

## 2.1 Patient list / detail
The model documents these fields but they are **not in the v2 list response**:

| Field | Used in | Severity |
|---|---|:---:|
| `address` | Patient detail header | 🟠 |
| `location` | Patient list row | 🟠 |
| `lastVisit` | Patient list row | 🟠 |
| `diagnosis` | Patient detail | 🟠 |
| `careTeam[]` | Patient detail / visit page | 🟠 |
| `treatmentHoliday` | Patient detail badge | 🟠 |

> Source-of-truth comment lives at the top of `data/models/patient.ts`.

---

## 2.2 Visit detail
Fields read with `(record as any).…` in `app/visits/[id].tsx` because they
aren't on the typed `Visit` and aren't documented in v2:

| Field | Line | Severity |
|---|---|:---:|
| `careTeam` | 238 | 🟠 |
| `patientName` | 239 | 🟠 |
| `visitDate` / `date` | 242, 284 | 🔴 (header date) |
| `procedureTime` | 243 | 🟠 |
| `visitTime` / `time` | 244, 285 | 🔴 (header time) |
| `hospital` | 245 | 🟠 |
| `insurance` | 246 | 🟠 |
| `doctorTime` | 247 | 🟠 |
| `provider` | 290 | 🟠 |

> Each needs either: (a) a backend addition, (b) a derived value
> (e.g. compute `visitTime` from `scheduledAt`), or (c) the field removed
> from the UI.

---

## 2.3 Dashboard stats (`GET /dashboard/stats`)
v2 only returns the legacy field names; the "new" names the app type allows
are always `undefined`:

| Expected (new) | Returned by v2 (legacy) |
|---|---|
| `totalActivePatients` | `totalPatients` |
| `inProgressVisits` | — |
| `todayAppointments` | `todayVisits` |
| `confirmedAppointments` | `pendingSchedules` / `completedVisits` |

Severity: 🟡 — UI still works because the legacy names are also rendered.

---

## 2.4 Rules / permissions (`GET /me/rules`)
The app expects **per-section** action keys (e.g.
`submit_flow_sheet_pre_treatment_vitals`); v2 returns **bundle** keys
(`submit_flowsheet`, `submit_progress_notes`, …).

Severity: 🔴 — every per-section save button will be hidden against a real
backend until this is reconciled.

**Decision needed:** either ask the backend to emit per-section keys
(preferred — matches UI granularity) or collapse the app's keys to bundles.

---

# Part 3 — Missing in the app (v2 endpoints / fields not used yet)

## 3.1 v2 endpoints with no UI yet

| # | v2 endpoint | What it captures | Suggested home |
|---|---|---|---|
| 1 | `POST /visits/{id}/forms/allergies` | Patient allergies as a visit form | `data/visit_repository.ts` |
| 2 | `POST /visits/{id}/forms/social-assessment` | Social-worker intake | `data/visit_repository.ts` |
| 3 | `POST /visits/{id}/forms/incidents` | Adverse-event report during the visit | `data/visit_repository.ts` |
| 4 | `POST /visits/{id}/forms/blood-sugar` | Blood-sugar reading log | `data/visit_repository.ts` |
| 5 | `POST /visits/{id}/forms/visual-triage-checklist` | Visual triage checklist | `data/visit_repository.ts` |

> Add a model + thin `submit*` wrapper for each when the matching screen is built.

---

## 3.2 v2 fields the app throws away

| v2 field | Where it lives | Why it matters |
|---|---|---|
| `forms.flowsheet[*].value.dialysis_parameters.signature` | flowsheet response | Could surface a "signed by …" indicator on the dialysis params card. |
| `forms.flowsheet[*].value.post_treatment.patientSignature` / `nurseSignature` | flowsheet response | Could render the captured signature thumbnails on the post-treatment card. |
| `progressNotes.doctor[*].isAddendum` / `parentNoteId` | visit detail | Needed to render addenda threaded under their parent note. |

---

## 3.3 App calls that aren't in the v2 collection

| App call | Notes | Severity |
|---|---|:---:|
| `POST /support/messages` | Not present in v2. Confirm with backend whether it's still served, or remove from the app. | 🟡 |

---

# Part 4 — Action checklist

| Priority | Action | Refers to | Owner |
|:---:|---|---|---|
| 🔴 P0 | Decide rules vocabulary (per-section vs. bundle keys) | §2.4 | Backend / product |
| 🔴 P0 | Define canonical visit date/time fields in v2 and remove the `as any` reads | §2.2 | Backend |
| 🟠 P1 | Add the missing patient fields to v2 list/detail (or drop from UI) | §2.1 | Backend / product |
| 🟡 P2 | Confirm `/support/messages` endpoint | §3.3 | Backend |
| 🟡 P2 | Add the 5 new form repos when their screens land | §3.1 | Mobile |
| 🟢 P3 | Surface signature thumbnails + addendum threading on the visit screen | §3.2 | Mobile |

---

# Files touched in this pass

- `data/models/auth.ts` — `RegisterRequest`, `VerifyOtpRequest`
- `data/models/visit.ts` — `patientAlerts` typed against `PatientAlertSummary`
- `data/auth_repository.ts` — `verifyOtp` body comment
- `data/visit_repository.ts` — `FLOWSHEET_SECTION_KEY`, `mapFlowSheetFromApi`, `submitFlowSheetPostTreatment`, nursing / doctor / social-worker progress notes, `submitSariScreening`
- `data/patient_repository.ts` — `getPatientAlerts` deprecated, `getPatientAlertSummary` added
- `app/(auth)/register.tsx` — UI no longer collects username / password
- `app/(auth)/otp.tsx` — sends `identifier` instead of `email`
