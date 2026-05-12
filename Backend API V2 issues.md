# Backend API V2 — Issues Report

**For:** Backend dev team
**From:** Mobile (Goconnect / nurse app)
**Tested against:** `https://nurse-app.careconnectksa.com/api`
**Date:** 2026-05-11
**Auth token used:** `129|C4t0UogJ46C7oWaHCDBw5H249VlnrEHrCpZgqStg3e5c390a` (admin@backend.com, role=Administrator)
**Reference contract:** Postman collection *"CareConnect Nurse — Backend API (v2 — mobile-contract bodies)"*

Every endpoint below was probed live with the token above. For each issue, "Mobile expects" refers to the v2 Postman contract.

---

## TL;DR — Highest priority (blockers)

| # | Endpoint | Issue | Impact |
|---|---|---|---|
| 1 | `GET /api/me/rules` | Returns `{ rules: [] }` even for Administrator | All permission gates fail → nothing renders |
| 2 | `GET /api/dashboard/stats` | Field names diverge from contract | KPI cards show undefined / wrong numbers |
| 3 | `GET /api/patients/{id}/alerts` | Returns activity-feed array, not allergy/isolation object | Patient allergy/isolation banner empty |
| 4 | `GET /api/visits/{id}` | Top-level shape is `flowSheet/progressNotes/...`, contract promises `forms.*` | Read of saved forms broken across the board |
| 5 | Multiple form POSTs | Return 200 but data is NOT readable in the visit response | Silent data loss / nurse re-enters info |
| 6 | `POST /forms/nursing-progress-note` | Backend requires `note`, mobile sends `notes` | 422 on every save |
| 7 | `POST /forms/inventory_usage` | `available` stock does not decrement | Audit + dispensing tracking broken |

---

## 1. Permission rules endpoint returns empty

**Endpoint:** `GET /api/me/rules`
**Status:** 200 OK
**Actual response:**
```json
{ "data": { "rules": [] } }
```
**Mobile expects** (from spec) ~30 rule strings such as `view_dashboard`, `view_patients`, `start_visit`, `submit_flowsheet`, etc.

**Impact:** the mobile uses `can("...")` synchronously to gate every screen and button. An empty list means **no screen is reachable** after login for any user role. Login succeeds but the user lands on a permission-denied UX.

**Tested user:** `admin@backend.com` / role `Administrator` — even the highest-privilege user gets `[]`.

**Action:** populate `rules` per role (or at least return the full list for Administrator).

---

## 2. Dashboard stats — field names mismatch

**Endpoint:** `GET /api/dashboard/stats`
**Status:** 200 OK
**Actual response:**
```json
{
  "data": {
    "totalActivePatients": 114,
    "todayVisits": 3,
    "inProgressVisits": 1,
    "completedVisits": 2,
    "todayAppointments": 3,
    "confirmedAppointments": 3
  }
}
```
**Mobile expects** (per spec):
```json
{
  "data": {
    "totalPatients": 247,
    "todayVisits": 18,
    "pendingSchedules": 5,
    "completedVisits": 12
  }
}
```

| Spec key | Backend key | Action |
|---|---|---|
| `totalPatients` | `totalActivePatients` | Rename to `totalPatients` OR doc says active-only is fine |
| `pendingSchedules` | (missing) | Add — mobile needs pending count |
| `todayVisits` | ✅ same | — |
| `completedVisits` | ✅ same | — |
| — | `inProgressVisits`, `todayAppointments`, `confirmedAppointments` | Mobile happy to consume these too — keep |

**Recommended:** keep the extras, add `pendingSchedules`, rename `totalActivePatients` → `totalPatients` (or update the contract).

---

## 3. Patient alerts — wrong resource returned

**Endpoint:** `GET /api/patients/{id}/alerts` (tested with id=189)
**Status:** 200 OK
**Actual response:** flat array of activity/notification rows:
```json
{ "data": [
  { "id":"22821", "type":"lab", "actionType":"lab_order", "date":"...", "message":"New lab order added ...", "data": [] },
  { "id":"22822", "type":"lab", "actionType":"lab_result", "date":"...", "message":"Lab results available", "data": [] },
  ...
]}
```
**Mobile expects** the patient's clinical alert object:
```json
{ "data": {
  "allergies":   [{ "type":"drug", "value":"Penicillin" }, ...],
  "contamination": ["MRSA"],
  "instructions": "Patient requires assistance with mobility",
  "isolation":   "Contact precautions"
}}
```

**This is a wrong-resource bug** — the route is returning what looks like a notification feed instead of the patient's allergy/isolation record. The data the mobile needs lives elsewhere on the backend (the visit detail does expose `patientAlerts: { allergies, contamination, instructions, isolation }`, so the data exists — the route binding is incorrect).

**Action:** route `/patients/{id}/alerts` to the same source the visit detail uses for `patientAlerts`. If the activity feed is also needed, expose it on a separate path (e.g. `/patients/{id}/activity`).

---

## 4. Visit detail — top-level shape diverges from contract

**Endpoint:** `GET /api/visits/{id}`
**Status:** 200 OK
**Actual top-level keys** (visit 137):
```
id, patientName, patientId, date, time, type, status, provider, address, duration,
careTeam[],
patient { ...full patient object... },
patientAlerts { allergies, contamination, instructions, isolation },
flowSheet { visitId, <section_key>: {...}, ... },
progressNotes { nursing: [], doctor: [], socialWorker: [] },
referrals: [],
refusals: [],
sariScreenings: [],
medications: [],
inventory: [{ id, name, itemNumber, available }]
```

**Mobile expects** (per spec):
```
... visit fields ...,
forms: {
  "flowsheet":            [{ id, value:{...}, createdAt, updatedAt, createdBy, updatedBy }],
  "nursing-progress-note": [...],
  "progress-notes":        [...],
  "refusal":               [...],
  "referral":              [...],
  "sari_screening":        [...],
  "inventory_usage":       [...]
}
```

**Differences:**
- Backend has **no `forms` envelope**. Each form type sits at its own top-level key with its own ad-hoc shape.
- Flow-sheet sections are merged directly under `flowSheet.<key>` (Class A merge works), but **without** the `id/createdAt/createdBy` metadata the spec promises.
- `progressNotes` is split into three buckets (`nursing`, `doctor`, `socialWorker`) instead of being one `progress-notes` array with a `type` discriminator.
- Many save endpoints respond 200 but their results never appear in this payload (see §5).

**Action:** decide on one shape and keep it. Either:
- **Option A** — align backend to spec: add a `forms` envelope, drop `flowSheet`/`progressNotes`/etc., return each form save in `forms[form_name][]`. This is the cleanest path for mobile.
- **Option B** — keep current shape but document it as the new contract and update the Postman collection. Mobile will then rewrite its readers around `flowSheet`/`progressNotes`/etc.

---

## 4b. Flowsheet section-key contract (post-treatment "error" root cause)

The `flowsheet` endpoint accepts only specific section keys at the top of the body. **Unknown section keys return a misleading error** — `HTTP 422 { "message": "Unknown form: flowsheet" }` (it should say "Unknown section" — the form name in the URL is fine, the section key in the body is not).

Live map of what backend accepts:

| App sends today | Backend accepts | Result |
|---|---|---|
| `outside_dialysis` | `outside_dialysis` | ✅ 200 |
| `pre_treatment_vital` | `pre_treatment_vitals` | ❌ 422 |
| `machines` | `machines` | ✅ 200 |
| `pain_assessment` | `pain_assessment` | ✅ 200 (presumed) |
| `fall_risk_assessment` | `fall_risk` | ❌ 422 |
| `nursing_action` | `nursing_actions` | ❌ 422 |
| `hemodialysis` | `dialysis_parameters` | ❌ 422 |
| `alarms_test` | `alarms_test` | ✅ 200 |
| `intake_output` | `intake_output` | ✅ 200 (presumed) |
| `car` | `car` | ✅ 200 (presumed) |
| `access` | `access` | ✅ 200 (presumed) |
| `dialysate` | `dialysate` | ✅ 200 (presumed) |
| `anticoagulation` | `anticoagulation` | ✅ 200 (presumed) |
| `dialysis_medications` | `medications` | ❌ 422 |
| `post_assessment` | `post_treatment` | ❌ 422 |

**→ 6 of 15 flowsheet sections currently fail with 422.** The map in [data/visit_repository.ts:313-329](data/visit_repository.ts#L313-L329) is wrong. Mobile will fix on its side (see §16 fix list).

**Action for backend:** improve the error message — return `{ "message": "Unknown flowsheet section: post_assessment", "errors": { "section": ["..."] } }` so the mobile dev sees which side is wrong without having to bisect.

---

## 4c. Post-treatment assessment — why it errors

This is the specific question that triggered the audit. Two distinct bugs stacked together.

**App code:** [data/visit_repository.ts:471-513](data/visit_repository.ts#L471-L513)

**What the app sends:**
```json
{
  "post_assessment": {
    "bp_sitting_systolic": 120,
    "bp_sitting_diastolic": 80,
    "bp_sitting_site": "right",
    "pulse": 76,
    "temp": 36.7,
    "temp_method": "oral",
    "spo2": 98,
    "rr": 16,
    "rbs": 115,
    "weight": 78.2,
    "tx_time_hr": 4,
    "dialysate_l": 120,
    "uf": 1.5,
    "blp": "120/80",
    "uf_net": 1.5,
    "catheter_lock": "heparin",
    "arterial_access": "ok",
    "venous_access": "ok",
    "machine_disinfected": "yes",
    "access_problems": "",
    "non_medical_incidence": ""
  }
}
```
→ **HTTP 422** `{"message":"Unknown form: flowsheet"}`

**What the backend accepts:**
```json
{
  "post_treatment": {
    "postTx": {
      "postWeight": "78.2",
      "lastBp": "120/80",
      "lastPulse": "76",
      "condition": "Stable",
      "notes": "tolerated well"
    }
  }
}
```
→ **HTTP 200**, persisted, visible at `flowSheet.post_treatment.postTx.*` ✅

**The three problems:**
1. **Section key**: app sends `post_assessment`, backend requires `post_treatment`.
2. **Inner envelope**: app flattens the fields directly under the section key; backend requires them wrapped in `postTx`.
3. **Field names**: app uses snake_case clinical names (`bp_sitting_systolic`, `pulse`, `temp`, `weight`, `tx_time_hr`, `dialysate_l`, `uf`, `blp`, `uf_net`, `catheter_lock`, `arterial_access`, `venous_access`, `machine_disinfected`, `access_problems`, `non_medical_incidence`). Backend expects camelCase summary names (`postWeight`, `lastBp`, `lastPulse`, `condition`, `notes`).

**This is more than a renaming issue** — the field set is fundamentally different. The app captures ~20 detailed post-treatment fields; the backend's documented contract only stores 5 summary fields. Either:

- **(a) Backend expands its post_treatment schema** to accept the full 20-field set the app collects. Recommended — losing the rest is a clinical regression. The current behaviour silently drops 15 fields the nurse has filled in.
- **(b) App reduces its post-treatment form** to the 5 documented fields. Cuts clinical data — confirm with product first.
- **(c) Backend accepts both shapes** — extra unknown keys stored as-is. Simplest if the backend uses a JSON column.

**Until this is fixed:** the post-treatment save will 422 on **every attempt** in production. Nurses cannot complete the flow-sheet.

---

## 5. Visit Forms — Generic Endpoint: full data-handling coverage

The Postman folder *"Visit Forms — Generic Endpoint"* has 13 form types (counting the 15 flow-sheet sections as one). Every one was probed live against `POST /api/visits/137/forms/<form>` with valid bodies. Results below.

**Legend:**
- ✅ — save returns 200 **AND** data is visible on subsequent `GET /api/visits/137`
- ⚠️ — save returns 200 but data is **invisible** on read (silent loss)
- ❌ — save returns 422 / 4xx (won't persist at all)

| # | Form name | POST result | Where data lands in `GET /visits/{id}` | Verdict |
|---|---|---|---|---|
| 1 | `flowsheet` — section `outside_dialysis` | 200 | `flowSheet.outside_dialysis` | ✅ |
| 1 | `flowsheet` — `pre_treatment_vitals` | 200 | `flowSheet.pre_treatment_vitals` | ✅ |
| 1 | `flowsheet` — `machines` | 200 | `flowSheet.machines` | ✅ |
| 1 | `flowsheet` — `pain_assessment` | 200 | `flowSheet.pain_assessment` | ✅ |
| 1 | `flowsheet` — `fall_risk` | 200 | `flowSheet.fall_risk` | ✅ |
| 1 | `flowsheet` — `nursing_actions` | 200 | `flowSheet.nursing_actions` | ✅ |
| 1 | `flowsheet` — `dialysis_parameters` | 200 | `flowSheet.dialysis_parameters` | ✅ |
| 1 | `flowsheet` — `alarms_test` | 200 | `flowSheet.alarms_test` | ✅ |
| 1 | `flowsheet` — `intake_output` | 200 | `flowSheet.intake_output` | ✅ presumed (same handler) |
| 1 | `flowsheet` — `car` / `access` / `dialysate` / `anticoagulation` | 200 | `flowSheet.<key>` | ✅ presumed |
| 1 | `flowsheet` — `medications` | 200 | `flowSheet.medications` | ✅ |
| 1 | `flowsheet` — `post_treatment` (JSON) | 200 | `flowSheet.post_treatment.postTx.*` | ✅ (with correct key — see §4c) |
| 1 | `flowsheet` — `post_treatment` (multipart + signatures) | not tested | — | ❓ pending follow-up |
| 2 | `nursing-progress-note` | 200 | `progressNotes.nursing[]` with `{id, visitId, note, author, createdAt}` | ✅ |
| 3 | `progress-notes` (`type:"doctor"`) | 200 | `progressNotes.doctor` stays `[]` | ⚠️ silent loss |
| 4 | `progress-notes` doctor ADDENDUM | 200 | same — invisible | ⚠️ silent loss |
| 5 | `progress-notes` (`type:"social_worker"`) | 200 (presumed) | `progressNotes.socialWorker` likely `[]` | ⚠️ silent loss |
| 6 | `refusal` (multipart) | not run from CLI | `refusals` array | ❓ pending follow-up |
| 7 | `referral` (multipart) | not run from CLI | `referrals` array | ❓ pending follow-up |
| 8 | `sari_screening` | 200 | `sariScreenings` stays `[]` | ⚠️ silent loss |
| 9 | `inventory_usage` (itemId=69, qty=1) | 200 | `inventory[].available` did **not** decrement (still 5) | ⚠️ stock not deducted |
| 10 | `allergies` | 200 | `patientAlerts.allergies` stays `[]` | ⚠️ silent loss |
| 11 | `social-assessment` | 200 | no field surfaced anywhere | ⚠️ silent loss |
| 12 | `incidents` | 200 | no field surfaced anywhere | ⚠️ silent loss |
| 13 | `blood-sugar` | 200 | no field surfaced anywhere | ⚠️ silent loss |
| 14 | `visual-triage-checklist` | 200 | no field surfaced anywhere | ⚠️ silent loss |
| — | (negative) `unknown-form` | 422 `"Unknown form: unknown-form"` | n/a | ✅ correct |

**Outside the generic-forms folder, the same visit response carries:**
| Source | Lands in | Verdict |
|---|---|---|
| `POST /visits/{id}/procedure-times` | not visible in response | ⚠️ silent loss |
| `POST /visits/{id}/start` and `/end` | `status` flips ✅ | ✅ |

**Summary of read-back paths the backend currently exposes on `GET /visits/{id}`:**
```
flowSheet     ← only `flowsheet` writes
progressNotes.nursing[]      ← only `nursing-progress-note` writes
progressNotes.doctor[]       ← nothing surfaces here (bug)
progressNotes.socialWorker[] ← nothing surfaces here (bug)
referrals[]                  ← presumed unread
refusals[]                   ← presumed unread
sariScreenings[]             ← unread
medications[]                ← unread
inventory[]                  ← read-only stock list
patientAlerts.{allergies, contamination, instructions, isolation}  ← unread by `allergies` writes
```

**9 form types** (`progress-notes` doctor + social, `sari_screening`, `inventory_usage` stock, `allergies`, `social-assessment`, `incidents`, `blood-sugar`, `visual-triage-checklist`) plus `procedure-times` **save with 200 but the data cannot be read back**. This is the single biggest blocker — nurses lose work without seeing any error.

**This is the single biggest blocker.** A 200 with no read-back gives the nurse the illusion the form is saved while the data is either dropped or stored somewhere the read API doesn't surface.

**Action per form:**
1. Confirm the row is actually being inserted (check DB directly).
2. If yes — fix the read serializer for `GET /visits/{id}` so each form's rows are surfaced.
3. If no — fix the write handler.

The mobile is willing to read these under whatever final shape you choose — but a 200 with invisible data is worse than a 422.

---

## 6. `nursing-progress-note` body field name

**Endpoint:** `POST /api/visits/{id}/forms/nursing-progress-note`
**Backend accepts:** `{ "note": "..." }` ✅ (confirmed 200)
**Backend rejects:** `{ "notes": "..." }` → 422 `"The note field is required."`

**Mobile (current) sends `notes`** ([data/visit_repository.ts:524](data/visit_repository.ts#L524)) — mobile will switch to `note`. Just confirming the backend wants singular `note`. ✅

---

## 7. `inventory_usage` does not decrement stock

**Endpoint:** `POST /api/visits/137/forms/inventory_usage`
**Body sent:** `{ "itemId": 69, "quantity": 1, "notes": "probe test" }`
**Status:** 200 OK
**Before:** `inventory[0].available = 5`
**After (same GET):** `inventory[0].available = 5` — **no change**

Spec §9.8 explicitly says: *"the backend ALSO decrements `patient_inventory.available` for the matching item."* This isn't happening.

**Action:** wire the `inventory_usage` write to deduct from `patient_inventory.available` (or whichever stock table). Also: the spec says quantity > available should return 422 — please confirm that guard exists.

---

## 8. Login field name

**Endpoint:** `POST /api/auth/login`
**Working body:**
```json
{ "username": "super-admin", "password": "Admin_123456" }
```
Confirmed working — `username` (not `email`). ✅ No issue. Documenting for the team.

Response shape ✅ matches spec: `{ data: { accessToken, user: { id, name, role, hospital, email, phone, face_token, department, employeeId, avatarUrl } } }`.

---

## 9. Patients list — minor field shape

**Endpoint:** `GET /api/patients`
**Status:** 200 OK

**Differences from spec:**
| Field | Spec | Backend | Action |
|---|---|---|---|
| `codeStatus` enum | `"Full Code"` | `"full_code"` | Standardise (mobile prefers snake) |
| `patientId` (e.g. `P-2026-013`) | Present | **Missing** — only `id` and `mrn` exist | Either add `patientId` or drop from spec |
| `careTeam[].role` enum | `Nephrologist`, `Nurse`, ... | Includes `HHD Nurse`, `Charge Nurse`, `Nursing Director`, `Social Worker`, `Physician` | Document the full role enum |

Otherwise structure matches. ✅

---

## 10. Scheduler slot — extra fields & enum

**Endpoint:** `GET /api/scheduler/slots`, `GET /api/scheduler/slots/{id}`
**Status:** 200 OK

**Backend adds (not in spec):**
- `patient` — the full nested patient object on each slot.

**Status enum observed:** `confirmed`, `pending`, `checked_in`, `cancelled` — spec only documents `confirmed`/`pending`/`checked_in`. Please confirm `cancelled` is a real state and document it.

No bugs here — just spec drift. Either keep the extras and update Postman, or strip them.

---

## 11. Visit list — heavyweight items

**Endpoint:** `GET /api/visits`
**Status:** 200 OK, body 139 KB for ~tens of visits.

Each list item embeds the full `patient`, `patientAlerts`, `flowSheet`, `progressNotes`, `referrals`, `refusals`, `sariScreenings`, `medications`, `inventory` — identical to the visit detail. Spec says the list returns lean rows (`id, patientName, patientId, date, time, status, type, duration, address, provider`).

**Impact:** mobile pulls megabytes when scrolling the visits list, and the same payload is re-fetched on detail open. On 3G this is painful.

**Action:** strip the nested objects from the list response. Keep them on `GET /visits/{id}` only.

---

## 12. Generic forms endpoint — whitelist enforcement ✅

**Negative test:** `POST /api/visits/137/forms/unknown-form` → **422 `"Unknown form: unknown-form"`**

Whitelist works correctly. No issue. ✅

---

## 13. Misc small items

- `GET /api/patients/{id}/lab-results` returns `{ data: [] }` for test patient — endpoint reachable, just no fixture data. No action.
- `GET /api/me` returns `phone: null`, `face_token: null` even though the user has these in admin. Confirm DB write path for these two fields.
- `GET /api/visits/{id}.inventory[].itemNumber` is returned but not documented in spec — please add to contract.

---

## 14. Endpoints still untested (need fixture data or destructive — not run today)

| Endpoint | Reason skipped |
|---|---|
| `POST /api/auth/register` | Creates real user |
| `POST /api/auth/verify-otp` | Needs OTP from email |
| `POST /api/auth/forgot-password` | Triggers email send |
| `POST /api/auth/reset-password` | Needs valid reset token |
| `POST /api/auth/change-password` | Would lock test account |
| `POST /api/auth/logout` | Would invalidate the bearer |
| `POST /api/auth/delete-account` | Destructive |
| `POST /api/me/device-token` | Skipped this round |
| `POST /api/auth/verify-face` | Needs real face_token |
| `POST /api/visits/137/start` and `/end` | Visit already in `completed` state — would error |
| `POST /api/scheduler/slots/{id}/confirm`, `/check-in` | State-changing, not safe on shared QA data |
| Flowsheet sections 9.1.2–9.1.15 (we tested only 9.1.1) | All use the same handler — assuming uniform behaviour, will verify next round |
| `POST /forms/refusal` (multipart, 4 signatures) | Multipart with PNGs — couldn't generate from CLI cleanly |
| `POST /forms/referral` (multipart, attachment) | Same |
| `POST /forms/flowsheet` (post_treatment multipart) | Same |

Happy to run a follow-up pass once §1–§7 are fixed.

---

## Mobile-side fixes already planned

For traceability, the mobile will change the following regardless of backend decisions:

1. Switch `nursing-progress-note` body from `{ notes }` to `{ note }` ([data/visit_repository.ts:524](data/visit_repository.ts#L524)).
2. Add `Accept: application/json` to default axios headers ([data/api_client.ts:15-20](data/api_client.ts#L15-L20)).
3. Set `EXPO_PUBLIC_API_BASE_URL` per environment ([constants/env.ts:5](constants/env.ts#L5)).
4. Once §4 (visit shape) is decided, rewrite the read mappers in [data/visit_repository.ts](data/visit_repository.ts) accordingly.

---

## Test credentials used (for your reproduction)

```
POST /api/auth/login
{ "username": "super-admin", "password": "Admin_123456" }

→ Bearer: 129|C4t0UogJ46C7oWaHCDBw5H249VlnrEHrCpZgqStg3e5c390a
   User : admin@backend.com (id=21, role=Administrator)

Test visit  : 137 (patient 189, "Bassem Test")
Test slot   : 298
Test item   : inventory id=69 (Express Fluid Warmer Disposables)
```
