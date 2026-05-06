# Missing Data & Missing APIs

What the mobile app needs that the **v2 backend doesn't provide**, and what the
**v2 backend provides that the app doesn't use yet**.

| Legend | Meaning |
| :---: | :--- |
| 🔴 | Blocks a screen / feature from rendering correctly |
| 🟠 | Field shown in UI is always blank/undefined |
| 🟡 | Endpoint exists on one side only — feature gap |

---

## A. APIs the app calls but **v2 doesn't have**

| # | App call | Used by | Impact | Severity |
|---|---|---|---|:---:|
| A1 | `POST /support/messages` | "Contact support" form | Will 404 against v2. Confirm with backend if it's still served, or remove from the app. | 🟡 |

---

## B. APIs in **v2 the app doesn't implement** (no UI yet)

| # | v2 endpoint | What it captures | Suggested home |
|---|---|---|---|
| B1 | `POST /visits/{id}/forms/allergies` | Patient allergies as a visit form | `data/visit_repository.ts` |
| B2 | `POST /visits/{id}/forms/social-assessment` | Social-worker intake | `data/visit_repository.ts` |
| B3 | `POST /visits/{id}/forms/incidents` | Adverse-event report during the visit | `data/visit_repository.ts` |
| B4 | `POST /visits/{id}/forms/blood-sugar` | Blood-sugar reading log | `data/visit_repository.ts` |
| B5 | `POST /visits/{id}/forms/visual-triage-checklist` | Visual triage checklist | `data/visit_repository.ts` |

> Add a model + thin `submit*` wrapper for each of these when the matching screen is built.

---

## C. Data fields the app reads but v2 **doesn't return**

### C1 — `Patient` (list & detail)
The model is documented to expect these, but they are **not in the v2 list response**:

| Field | Used in | Severity |
|---|---|:---:|
| `address` | Patient detail header | 🟠 |
| `location` | Patient list row | 🟠 |
| `lastVisit` | Patient list row | 🟠 |
| `diagnosis` | Patient detail | 🟠 |
| `careTeam[]` | Patient detail / visit page | 🟠 |
| `treatmentHoliday` | Patient detail badge | 🟠 |

Source-of-truth comment lives at the top of `data/models/patient.ts`.

### C2 — `Visit` (read via `(record as any).…` in `app/visits/[id].tsx`)
Fields accessed with `as any` because they aren't on the typed `Visit` and
aren't documented in v2:

| Field | Line(s) | Severity |
|---|---|:---:|
| `careTeam` | 238 | 🟠 |
| `patientName` | 239, fallback | 🟠 |
| `visitDate`, `date` | 242, 284 | 🔴 (drives the visit header date) |
| `procedureTime` | 243 | 🟠 |
| `visitTime`, `time` | 244, 285 | 🔴 (drives the visit header time) |
| `hospital` | 245 | 🟠 |
| `insurance` | 246 | 🟠 |
| `doctorTime` | 247 | 🟠 |
| `provider` | 290 | 🟠 |

> All of these need either (a) a backend addition, (b) a derived value (e.g. compute `visitTime` from `scheduledAt`), or (c) the field removed from the UI.

### C3 — `DashboardStats` (`GET /dashboard/stats`)
The app's `DashboardStats` type accepts both legacy and "new" names. v2 only
returns the legacy set, so these "new" fields are always `undefined`:

| Expected (new) | Returned by v2 (legacy) |
|---|---|
| `totalActivePatients` | `totalPatients` |
| `inProgressVisits` | — |
| `todayAppointments` | `todayVisits` |
| `confirmedAppointments` | `pendingSchedules` / `completedVisits` |

Severity: 🟡 — UI still works because legacy names are also rendered.

### C4 — Rules / permissions (`GET /me/rules`)
The app expects **per-section** action keys (e.g.
`submit_flow_sheet_pre_treatment_vitals`) but v2 returns **bundle** keys
(`submit_flowsheet`, `submit_progress_notes`, …).

Severity: 🔴 — every per-section save button will be hidden against a real
backend until this is reconciled.

---

## D. v2 fields the app **doesn't read** (data we're throwing away)

| v2 field | Where it lives | Why it matters |
|---|---|---|
| `forms.flowsheet[*].value.dialysis_parameters.signature` | flowsheet response | Could surface a "signed by …" indicator on the dialysis params card. |
| `forms.flowsheet[*].value.post_treatment.patientSignature` / `nurseSignature` | flowsheet response | Could render the captured signature thumbnails on the post-treatment card. |
| `progressNotes.doctor[*].isAddendum` / `parentNoteId` | visit detail | Needed to render addenda threaded under their parent note. |

---

## E. Quick action checklist

| Priority | Action |
|:---:|---|
| 🔴 P0 | Decide rules vocabulary (per-section vs bundle keys) — §C4 |
| 🔴 P0 | Define the canonical visit date/time fields in v2 and remove the `as any` reads — §C2 |
| 🟠 P1 | Add the missing patient fields to v2 list/detail (or drop from UI) — §C1 |
| 🟡 P2 | Confirm `/support/messages` — §A1 |
| 🟡 P2 | Add the 5 new form repos when the screens land — §B |
