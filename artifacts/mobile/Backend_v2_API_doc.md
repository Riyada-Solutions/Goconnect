# GoConnect Nurse — Mobile ↔ Backend v2 Review

**Audience:** Backend team
**From:** Mobile team
**Re:** Gaps and questions found while wiring the mobile app to the v2 Postman contract.

This document lists everything the mobile app needs the backend to **confirm, add, or change** so the v2 contract fully covers the nurse workflow. The mobile side has already been adjusted to match v2 wherever the contract was clear; the items below are the ones we cannot resolve on our own.

| Legend | Meaning |
| :---: | :--- |
| 🔴 | Blocks a screen / feature |
| 🟠 | Field shown in UI is currently blank |
| 🟡 | Endpoint exists on one side only |
| ❓ | Needs a decision from backend / product |

---

## 1. Decisions we need from you

### 1.1 Rules vocabulary (`GET /me/rules`) 🔴 ❓
The mobile UI shows save buttons **per flow-sheet section**, so it expects per-section permission keys, e.g.:

```
submit_flow_sheet_pre_treatment_vitals
submit_flow_sheet_dialysis_parameters
submit_flow_sheet_post_treatment
…one per section
```

v2 currently returns **bundle** keys:

```
submit_flowsheet
submit_progress_notes
…
```

**Question:** Can `/me/rules` emit per-section keys (preferred — matches UI granularity), or should the app collapse all section saves under the bundle keys?

---

### 1.2 Canonical visit date / time fields 🔴 ❓
The visit-detail screen needs a header date and time. We're currently reading these names from the visit object, none of which are in the v2 spec:

```
visitDate, date, visitTime, time, procedureTime, doctorTime
```

**Question:** What are the canonical fields on `GET /visits/{id}`? Options:

1. Add explicit `visitDate` / `visitTime` to the response, or
2. Confirm `scheduledAt` / `startedAt` are authoritative and we derive date+time on the client.

Either is fine — we just need one source of truth.

---

### 1.3 `/support/messages` 🟡 ❓
The app calls `POST /support/messages` (contact-support form), but it's not in the v2 collection.
**Question:** Is this endpoint still served? If yes, please add it to the v2 spec. If no, we'll remove the screen.

---

## 2. Fields the app expects but v2 doesn't return

### 2.1 Patient list & detail 🟠
These fields drive patient cards and the patient header. They're on the mobile model but not in v2 responses:

| Field | Used in | Notes |
|---|---|---|
| `address` | Patient detail header | string |
| `location` | Patient list row | short locality label |
| `lastVisit` | Patient list row | ISO date of last completed visit |
| `diagnosis` | Patient detail | string |
| `careTeam[]` | Patient detail / visit page | array of `{ name, role }` |
| `treatmentHoliday` | Patient detail badge | boolean |

**Ask:** Add these to `GET /patients` (list) and/or `GET /patients/{id}` (detail). If any are not feasible, tell us so we can drop them from the UI.

---

### 2.2 Visit detail 🟠 / 🔴
Beyond §1.2 above, the visit-detail screen also reads:

| Field | Used for | Severity |
|---|---|:---:|
| `careTeam` | "Care team" section | 🟠 |
| `patientName` | Header fallback | 🟠 |
| `hospital` | Header chip | 🟠 |
| `insurance` | Header chip | 🟠 |
| `provider` | Header chip | 🟠 |

**Ask:** Confirm whether these belong on the visit response or should be derived from the embedded patient.

---

### 2.3 Dashboard stats (`GET /dashboard/stats`) 🟡
v2 returns the legacy field names below; the new names the app would prefer are never populated:

| Mobile would prefer | v2 currently returns |
|---|---|
| `totalActivePatients` | `totalPatients` |
| `inProgressVisits` | _(missing)_ |
| `todayAppointments` | `todayVisits` |
| `confirmedAppointments` | `pendingSchedules` / `completedVisits` |

**Ask:** Either add `inProgressVisits` and rename to the "new" names, or confirm the legacy names are final (we'll keep reading them).

---

## 3. v2 endpoints with no UI counterpart yet

These exist in v2 but the mobile app has no screens for them. We will add them when the matching screens land — no backend action required, just flagging so they don't get deprecated:

| v2 endpoint | Captures |
|---|---|
| `POST /visits/{id}/forms/allergies` | Patient allergies as a visit form |
| `POST /visits/{id}/forms/social-assessment` | Social-worker intake |
| `POST /visits/{id}/forms/incidents` | Adverse-event report |
| `POST /visits/{id}/forms/blood-sugar` | Blood-sugar reading log |
| `POST /visits/{id}/forms/visual-triage-checklist` | Visual triage checklist |

---

## 4. v2 fields we'd like to surface (no backend change needed)

Just calling out v2 fields the app currently ignores but probably should render — informational only:

| v2 field | Where | Suggested UI |
|---|---|---|
| `forms.flowsheet[*].value.dialysis_parameters.signature` | flowsheet response | "Signed by …" indicator |
| `forms.flowsheet[*].value.post_treatment.patientSignature` / `nurseSignature` | flowsheet response | Signature thumbnails on post-treatment card |
| `progressNotes.doctor[*].isAddendum` / `parentNoteId` | visit detail | Render addenda threaded under the parent note |

---

## 5. Action checklist

| Priority | Owner | Action | Refers to |
|:---:|---|---|---|
| 🔴 P0 | Backend | Decide rules vocabulary (per-section vs. bundle) | §1.1 |
| 🔴 P0 | Backend | Define canonical visit date / time fields | §1.2 |
| 🟡 P0 | Backend | Confirm `/support/messages` status | §1.3 |
| 🟠 P1 | Backend | Add missing patient fields (or confirm dropped) | §2.1 |
| 🟠 P1 | Backend | Confirm visit header fields (`hospital`, `insurance`, `provider`, …) | §2.2 |
| 🟡 P2 | Backend | Confirm dashboard field naming | §2.3 |
| 🟢 P3 | Mobile | Add 5 new form repositories when screens land | §3 |
| 🟢 P3 | Mobile | Surface signature + addendum threading | §4 |

---

## Appendix A — What the mobile side has already aligned to v2

For your reference, the mobile app has been updated to match the v2 contract for the items below. **No backend action needed on these — just confirming we read your spec the same way.**

### Auth
- `POST /auth/register` — body is now `{ registerCode?, phone, fullName, email }` (no `username` / `password` / `password_confirmation`).
- `POST /auth/verify-otp` — sends `identifier` (email or phone), not `email`.

### Patients
- `GET /patients/{id}/alerts` — read as the object `{ allergies, contamination, instructions, isolation }`.
- `Visit.patientAlerts` (embedded in visit detail) — typed to accept the alert summary object.

### Flow sheet (`POST /visits/{id}/forms/flowsheet`)
We now send these section keys (six were renamed from our older naming):

| Section | Key we send |
|---|---|
| Pre-treatment vitals | `pre_treatment_vitals` |
| Fall risk | `fall_risk` |
| Nursing actions | `nursing_actions` |
| Dialysis parameters | `dialysis_parameters` |
| Medications | `medications` |
| Post-treatment | `post_treatment` |
| (unchanged) | `outside_dialysis`, `machines`, `pain_assessment`, `alarms_test`, `intake_output`, `car`, `access`, `dialysate`, `anticoagulation` |

Reads support both v2 nested camelCase (`pre_treatment_vitals.vitals`, `dialysis_parameters.dialysisParams[]`, `post_treatment.postTx`, …) and the older flat snake-case shape during rollout.

Post-treatment save body: `{ post_treatment: { postTx: { …camelCase… } } }`.

### Progress notes
- `POST /visits/{id}/forms/nursing-progress-note` — body field `note` (was `notes`).
- `POST /visits/{id}/forms/progress-notes` (doctor) — `{ type: "doctor", note, isAddendum, parentNoteId }`.
- `POST /visits/{id}/forms/progress-notes` (social worker) — `{ type: "social_worker", note, location }`.

### SARI
- `POST /visits/{id}/forms/sari_screening` — `visitId` is in the URL only and is no longer sent in the body.

### Sections that already matched v2 (no changes)
Lab results, scheduler (`/scheduler/slots`, `…/{id}`, `…/confirm`, `…/check-in`), visit read & status (`GET /visits`, `GET /visits/{id}`, `POST …/start`, `…/end`, `…/procedure-times`), refusal, referral, inventory-usage.
