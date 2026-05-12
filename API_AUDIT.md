# CareConnect Nurse — API Audit vs Postman v2 Collection

**Audited:** 2026-05-11
**App:** `Goconnect` (Expo / React Native, axios + TanStack Query)
**Collection:** "CareConnect Nurse — Backend API (v2 — mobile-contract bodies)"
**Staging base URL:** `https://staging.goconnect.com`
**Test bearer:** `126|ggD8UXWIWNDiJUsWv1fvpNqkTUxgUKnzGl632CWDa82c5b54`

---

## 1. Configuration issues (block staging QA today)

| # | Issue | File / line | Fix |
|---|---|---|---|
| 1 | Default base URL points to production-style host, not staging | [constants/env.ts:5](constants/env.ts#L5) | Set `EXPO_PUBLIC_API_BASE_URL=https://staging.goconnect.com/api` in `.env` for QA builds |
| 2 | Missing `Accept: application/json` header — Laravel/Sanctum may return HTML error pages instead of JSON envelopes | [data/api_client.ts:15-20](data/api_client.ts#L15-L20) | Add `Accept: 'application/json'` to default headers |
| 3 | Two stale clients still in tree | [services/api/client.ts](services/api/client.ts), [lib/api-client-react/src/generated/api.ts](lib/api-client-react/src/generated/api.ts) | Leave or delete — neither is on the active call path |

---

## 2. Coverage matrix

Legend: ✅ wired & matches spec · ⚠️ wired but body/shape mismatch · ❌ not implemented

### Auth (12/12 ✅)
`login`, `GET /me`, `PATCH /me`, `register`, `verify-otp`, `forgot-password`, `reset-password`, `change-password`, `logout`, `delete-account`, `device-token`, `verify-face` — all in [data/auth_repository.ts](data/auth_repository.ts).

### Read endpoints (all ✅)

| Endpoint | App location |
|---|---|
| `GET /me/rules` | [data/rules_repository.ts:17](data/rules_repository.ts#L17) |
| `GET /dashboard/stats` | [data/home_repository.ts:21](data/home_repository.ts#L21) |
| `GET /patients`, `/patients/{id}`, `/patients/{id}/alerts` | [data/patient_repository.ts:18,26,34](data/patient_repository.ts#L18) |
| `GET /lab-results` | [data/labResult_repository.ts:11](data/labResult_repository.ts#L11) |
| `GET /scheduler/slots`, slot detail, confirm, check-in | [data/scheduler_repository.ts:21,31,55,63](data/scheduler_repository.ts#L21) |

### Visit lifecycle (5/5 ✅)
List, detail, start, end, procedure-times — [data/visit_repository.ts:61,69,264,278,284](data/visit_repository.ts#L61).

### Visit forms — generic endpoint `POST /visits/{id}/forms/{form_name}`

Dispatcher: [data/visit_repository.ts:336-348](data/visit_repository.ts#L336-L348) ✅

| Form (spec) | Status | Notes |
|---|---|---|
| `flowsheet` (15 sections) | ⚠️ | See §3.1 — section keys diverge from spec |
| `flowsheet/post_treatment` (multipart) | ✅ | [visit_repository.ts:471-513](data/visit_repository.ts#L471-L513) |
| `nursing-progress-note` | ⚠️ | Sends `{ notes }`, spec wants `{ note }` — [visit_repository.ts:524](data/visit_repository.ts#L524) |
| `progress-notes` (doctor) | ⚠️ | Sends `type:"in_visit"`, `notes`, `addenda[]`; spec wants `type:"doctor"`, `note`, `isAddendum`, `parentNoteId` — [visit_repository.ts:536-545](data/visit_repository.ts#L536-L545) |
| `progress-notes` (social-worker) | ⚠️ | Sends `type:"in_visit"\|"outside_visit"`; spec wants `type:"social_worker"`, `location:"on_call"\|"in_center"` — [visit_repository.ts:668-676](data/visit_repository.ts#L668-L676) |
| `sari_screening` | ✅ | [visit_repository.ts:556](data/visit_repository.ts#L556) |
| `refusal` (multipart) | ✅ | `data` JSON + four signature parts — [visit_repository.ts:570-615](data/visit_repository.ts#L570-L615) |
| `referral` (multipart) | ⚠️ | Sends flat text fields; spec wants single `data` JSON field + `attachment` — [visit_repository.ts:628-637](data/visit_repository.ts#L628-L637) |
| `inventory_usage` | ✅ | [visit_repository.ts:692](data/visit_repository.ts#L692) |
| `allergies` | ❌ | Not implemented |
| `social-assessment` | ❌ | Not implemented |
| `incidents` | ❌ | Not implemented |
| `blood-sugar` | ❌ | Not implemented |
| `visual-triage-checklist` | ❌ | Not implemented |

---

## 3. Schema mismatches (detail)

### 3.1 Flowsheet section keys
[visit_repository.ts:313-329](data/visit_repository.ts#L313-L329) — the FE→backend key map differs from the Postman section names:

| FE slug | App sends | Spec expects |
|---|---|---|
| `pre-treatment-vitals` | `pre_treatment_vital` | `pre_treatment_vitals` |
| `fall-risk` | `fall_risk_assessment` | `fall_risk` |
| `nursing-actions` | `nursing_action` | `nursing_actions` |
| `dialysis-parameters` | `hemodialysis` | `dialysis_parameters` |
| `medications` | `dialysis_medications` | `medications` |
| `post-treatment` | `post_assessment` | `post_treatment` |

Confirm with backend which side is authoritative — keys are silently merged (Class-A endpoint), so a wrong key won't 4xx, it'll just disappear.

### 3.2 `nursing-progress-note` — key name
- App: `{ notes: payload.note }` ([visit_repository.ts:524](data/visit_repository.ts#L524))
- Spec: `{ note: "..." }`

### 3.3 `progress-notes` — doctor variant
- App: `{ type: "in_visit", notes, addenda: [{ parentNoteId, notes }] }`
- Spec: `{ type: "doctor", note, isAddendum: bool, parentNoteId?: number }`

### 3.4 `progress-notes` — social-worker variant
- App reuses doctor enum: `type: "in_visit" | "outside_visit"`
- Spec: `{ type: "social_worker", location: "on_call" | "in_center", note }`

### 3.5 `referral` multipart shape
- App: flat text fields appended one-by-one + `printOptions` JSON + optional `attachment` ([visit_repository.ts:628-651](data/visit_repository.ts#L628-L651))
- Spec: single `data` field containing JSON-stringified body + `attachment` file (same pattern as `refusal`)

---

## 4. Recommended fix order

1. **Unblock QA first** — set staging base URL + add `Accept: application/json` header.
2. **Confirm naming authority** with backend for §3.1–§3.5 (each is a one-line edit once decided).
3. **Implement missing forms** (`allergies`, `social-assessment`, `incidents`, `blood-sugar`, `visual-triage-checklist`) — same generic dispatcher, only the wrapper + types are new.

---

## 5. QA quick-start

```bash
# .env (or app config)
EXPO_PUBLIC_API_BASE_URL=https://staging.goconnect.com/api

# Bearer for manual curl/Postman runs
Authorization: Bearer 126|ggD8UXWIWNDiJUsWv1fvpNqkTUxgUKnzGl632CWDa82c5b54
Accept: application/json
```
