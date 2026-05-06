# API Changes — Mobile App vs. v2 Backend

A quick-read summary of how the mobile app's API calls were updated to match
the new v2 Postman collection.

| Status | Meaning |
| :---: | :--- |
| ✅ | Fixed in code |
| ⚠️ | Needs a product / backend decision |
| ➖ | Match — no change required |

---

## 1. Auth

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 1.1 | `POST /auth/register` | Body simplified to `{ registerCode?, phone, fullName, email }`. Removed `username`, `password`, `password_confirmation`. Renamed `name` → `fullName`. Registration is now identifier-only; the password is set later via OTP. | ✅ |
| 1.2 | `POST /auth/verify-otp` | Field `email` → `identifier` (server accepts email **or** phone). | ✅ |
| 1.3 | All other auth endpoints | login, me, profile update, forgot/reset/change password, logout, delete-account, device-token, verify-face — unchanged. | ➖ |

**Files touched:** `data/models/auth.ts`, `data/auth_repository.ts`, `app/(auth)/register.tsx`, `app/(auth)/otp.tsx`.

---

## 2. Authorization (`GET /me/rules`)

| # | What changed | Status |
|---|---|:---:|
| 2.1 | Server returns **bundle keys** (e.g. `submit_flowsheet`, `submit_progress_notes`). The app uses **per-section keys** (e.g. `submit_flow_sheet_pre_treatment_vitals`). With a real backend, every per-section gate evaluates to `false` and save buttons disappear. | ⚠️ |

**Decision needed:** either ask the backend to emit per-section keys (preferred — matches the UI granularity) or collapse the app's keys to the bundle keys.

---

## 3. Dashboard

| # | What changed | Status |
|---|---|:---:|
| 3.1 | Server returns the legacy field names (`totalPatients`, `todayVisits`, `pendingSchedules`, `completedVisits`). The `DashboardStats` type already accepts both legacy and new names — no change needed. | ➖ |

---

## 4. Patients

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 4.1 | `GET /patients/{id}/alerts` | Returns an **object** `{ allergies, contamination, instructions, isolation }`, not an array. New helper `getPatientAlertSummary` returns the object; legacy `getPatientAlerts` is now a deprecated stub returning `[]`. | ✅ |
| 4.2 | List + detail | Match. | ➖ |

> Note: the visit-detail screen reads `record.patientAlerts` (embedded on the visit response), not this endpoint. `Visit.patientAlerts` is now typed as `PatientAlertSummary | PatientAlert[] | PatientAlert | null` so both shapes type-check.

**Files touched:** `data/patient_repository.ts`, `data/models/visit.ts`.

---

## 5. Lab results, scheduler, basic visit endpoints

| Section | Endpoints | Status |
|---|---|:---:|
| Lab results | `GET /patients/{id}/lab-results` | ➖ |
| Scheduler | `GET /scheduler/slots`, `…/{id}`, `…/confirm`, `…/check-in` | ➖ |
| Visits read & status | `GET /visits`, `GET /visits/{id}`, `POST /visits/{id}/start`, `…/end`, `…/procedure-times` | ➖ |

---

## 6. Flow sheet — section keys (`POST /visits/{id}/forms/flowsheet`)

The mobile UI saves one section at a time. Each section is sent under a top-level key inside the flowsheet form. Six keys were renamed in v2:

| Section | Old key (broken) | New key (server v2) |
|---|---|---|
| Pre-treatment vitals | `pre_treatment_vital` | `pre_treatment_vitals` |
| Fall risk | `fall_risk_assessment` | `fall_risk` |
| Nursing actions | `nursing_action` | `nursing_actions` |
| Dialysis parameters | `hemodialysis` | `dialysis_parameters` |
| Medications | `dialysis_medications` | `medications` |
| Post-treatment | `post_assessment` | `post_treatment` |

The other 9 keys (`outside_dialysis`, `machines`, `pain_assessment`, `alarms_test`, `intake_output`, `car`, `access`, `dialysate`, `anticoagulation`) were already correct.

**Status:** ✅ Fixed in `FLOWSHEET_SECTION_KEY`.

---

## 7. Flow sheet — body shapes & read mapping

| # | What changed | Status |
|---|---|:---:|
| 7.1 | **Read mapper** (`mapFlowSheetFromApi`) now reads v2 nested camelCase shapes (`pre_treatment_vitals.vitals`, `car.car`, `dialysate.dialysate`, `dialysis_parameters.dialysisParams[]`, `nursing_actions.nursingActions[]`, `post_treatment.postTx`, `medications.medAdmin`) — falls back to legacy snake_case for older responses. | ✅ |
| 7.2 | **Post-treatment save** now sends `{ post_treatment: { postTx: <camelCase fields> } }`. The legacy snake_case translator was removed. | ✅ |

**File touched:** `data/visit_repository.ts`.

---

## 8. Progress notes

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 8.1 | `POST /visits/{id}/forms/nursing-progress-note` | Body field `notes` → `note`. | ✅ |
| 8.2 | `POST /visits/{id}/forms/progress-notes` (doctor) | Body now `{ type: "doctor", note, isAddendum, parentNoteId }` (was `{ type: "in_visit", notes, addenda: [...] }`). | ✅ |
| 8.3 | `POST /visits/{id}/forms/progress-notes` (social worker) | Body now `{ type: "social_worker", note, location }` (was `{ type: derived, notes, addenda: [] }`). | ✅ |

---

## 9. Other visit forms

| # | Endpoint | What changed | Status |
|---|---|---|:---:|
| 9.1 | `POST /visits/{id}/forms/sari_screening` | `visitId` is in the URL only — stripped from the body. | ✅ |
| 9.2 | `POST /visits/{id}/forms/refusal` | Multipart layout already matches v2 — no change. | ➖ |
| 9.3 | `POST /visits/{id}/forms/referral` | Match. | ➖ |
| 9.4 | `POST /visits/{id}/forms/inventory-usage` | Body `{ itemId, quantity, notes }` matches. | ➖ |

---

## 10. New endpoints in v2 (no UI yet)

These endpoints exist in the v2 collection but have no model / repository in
the app. They were intentionally **not** scaffolded — add them when their
screens are built so the types match the real UI inputs.

| Endpoint | Suggested home |
|---|---|
| `POST /visits/{id}/forms/allergies` | `data/visit_repository.ts` |
| `POST /visits/{id}/forms/social-assessment` | `data/visit_repository.ts` |
| `POST /visits/{id}/forms/incidents` | `data/visit_repository.ts` |
| `POST /visits/{id}/forms/blood-sugar` | `data/visit_repository.ts` |
| `POST /visits/{id}/forms/visual-triage-checklist` | `data/visit_repository.ts` |

---

## 11. App calls that aren't in the v2 collection

| App call | Notes | Status |
|---|---|:---:|
| `POST /support/messages` | Not present in v2. Confirm with backend whether it's still served. Code is unchanged. | ⚠️ |

---

## 12. Files changed in this pass

- `data/models/auth.ts` — `RegisterRequest`, `VerifyOtpRequest`
- `data/models/visit.ts` — `patientAlerts` typed against `PatientAlertSummary`
- `data/auth_repository.ts` — `verifyOtp` body comment
- `data/visit_repository.ts` — `FLOWSHEET_SECTION_KEY`, `mapFlowSheetFromApi`, `submitFlowSheetPostTreatment`, nursing / doctor / social-worker progress notes, `submitSariScreening`
- `data/patient_repository.ts` — `getPatientAlerts` deprecated, `getPatientAlertSummary` added
- `app/(auth)/register.tsx` — UI no longer collects username / password
- `app/(auth)/otp.tsx` — sends `identifier` instead of `email`

---

## 13. Outstanding decisions

| # | Topic | Owner |
|---|---|---|
| 2.1 | Rules vocabulary alignment (per-section vs. bundle keys) | Backend / product |
| 9   | Five new form endpoints — add when their screens land | Product |
| 11  | Confirm whether `/support/messages` is still supported | Backend |
