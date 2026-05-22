# Settings Screens — Backend API Specification

**Project:** GoConnect (Expo / React Native — Healthcare Management)
**Base URL:** `https://nurse-app.careconnectksa.com/api`
**Auth:** Bearer token sent as `Authorization: Bearer {token}`
**Localization headers:** `Accept-Language` and `X-Lang` (values: `en` | `ar`)
**HTTP client:** Axios (auto-attaches auth + language headers via interceptor)

> Scope: this doc covers **settings-screen** endpoints only. Auth endpoints (login, change-password, delete-account, logout, verify-face) and the user-profile endpoints (`/me` GET / PATCH) are intentionally out of scope and handled separately.

---

## Global Headers (auto-added by axios interceptor)

```
Authorization: Bearer {accessToken}
Content-Type: application/json
Accept-Language: en | ar
X-Lang: en | ar
```

---

## Endpoints Summary

| # | Endpoint | Method | Status | Purpose |
|---|----------|--------|--------|---------|
| 1 | `/support/messages` | POST | Exists | Submit support form |
| 2 | `/me/notification-preferences` | PATCH | **NEW — to implement** | Persist notification toggles |
| 3 | `/me/avatar` (or `PATCH /me` with file) | POST | **NEW — to implement** | Upload profile photo |
| 4 | `/notifications` | GET | **NEW — to implement** | List the user's notifications (paginated, optional `filter`) |
| 5 | `/notifications/unread-count` | GET | **NEW — to implement** | Count of unread notifications (header badge) |
| 6 | `/notifications/{id}/read` | POST | **NEW — to implement** | Mark a single notification as read |
| 7 | `/notifications/read-all` | POST | **NEW — to implement** | Mark every unread notification as read |
| 8 | `/notifications/{id}` | DELETE | **NEW — to implement** | Dismiss / delete a single notification |

---

## 1. POST `/support/messages` — Help & Support form

**Used by:** [help-support.tsx](app/(settings)/help-support.tsx) via `useSubmitSupportMessage()` (React Query) → `submitSupportMessage()` in `data/support_repository.ts`.

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

**Validation (client):** all four fields required and non-empty.

**Response:** 204 No Content (or `{ "ticketId": "string" }` if you want to surface a ticket reference).

---

## 2. PATCH `/me/notification-preferences` — **NEW (not yet implemented)**

**Used by:** [notifications.tsx](app/(settings)/notifications.tsx). Currently local-state only; needs persistence so the user sees the same toggles across devices.

**Request body:**
```json
{
  "pushNotifications": true,
  "messages": true,
  "visitAlerts": true,
  "reminders": true,
  "appUpdates": false
}
```

| Field | Type | Default | Category | Meaning |
|-------|------|---------|----------|---------|
| `pushNotifications` | boolean | `true` | General | Master push toggle |
| `messages` | boolean | `true` | General | Patient/team messages |
| `visitAlerts` | boolean | `true` | Clinical | Upcoming visit alerts |
| `reminders` | boolean | `true` | Clinical | Schedule reminders |
| `appUpdates` | boolean | `false` | System | App update notifications |

**Response:** Updated preferences object (echo).

**Also needed:** expose `GET /me/notification-preferences` so the screen can hydrate from the server.

---

## 3. Profile photo upload — **NEW (not yet implemented)**

The "Change Photo" button on [edit-profile.tsx](app/(settings)/edit-profile.tsx) is a placeholder. Once an endpoint exists, wire it in.

**Suggested contract:**
```
POST /me/avatar
Content-Type: multipart/form-data
Body: file=<image>
```

**Response:**
```json
{ "avatarUrl": "https://..." }
```

Constraints to confirm: max size, allowed mime types (`image/jpeg`, `image/png`).

---

## 4–8. Notifications inbox — **NEW (not yet implemented)**

**Used by:** [app/notifications.tsx](app/notifications.tsx) (the bell-icon inbox, distinct from the settings notification-preferences screen).

The screen renders a paginated list grouped into **Today / Yesterday / Earlier**, with filter tabs **All** / **Unread**, an unread-count badge in the header, a "Mark all read" button, per-row tap → mark-as-read, and long-press / X → dismiss.

### Notification model

```ts
interface Notification {
  id: number;
  /** Drives icon + colour. See enum below. */
  type:
    | "visit_assigned"
    | "visit_completed"
    | "patient_added"
    | "appointment_reminder"
    | "message"
    | "lab_result"
    | "shift_change"
    | "system";
  title: string;       // headline (one line)
  body: string;        // multiline preview text
  read: boolean;
  /** ISO 8601 — client formats relative ("9 min ago") and bucket
   *  (today / yesterday / earlier) locally. */
  createdAt: string;
  /** Optional deep-link payload — opens the related visit / patient /
   *  lab-result screen when the row is tapped. */
  link?: {
    type: "visit" | "patient" | "lab_result" | "message" | string;
    id: number | string;
  } | null;
}
```

> **Note on grouping:** the screen buckets rows into Today / Yesterday / Earlier based on `createdAt` against the user's local clock — no `group` field is needed in the response.

---

### 4. GET `/notifications`

Fetch the user's notifications inbox.

**Query params:**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `per_page` | number | `20` | Results per page. |
| `page` | number | `1` | Page number. |
| `filter` | `"all" \| "unread"` | `"all"` | Server-side filter. Omit or `all` returns everything. |

**Response 200 (Laravel paginator shape, same as `/patients`):**
```json
{
  "data": [
    {
      "id": 1,
      "type": "visit_assigned",
      "title": "New Visit Assigned",
      "body":  "You have a home visit for Ahmed Al-Rashid at 10:00 AM …",
      "read":  false,
      "createdAt": "2026-05-20T08:51:00+03:00",
      "link": { "type": "visit", "id": 144 }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page":    3,
    "per_page":     20,
    "total":        47,
    "from":         1,
    "to":           20
  }
}
```

---

### 5. GET `/notifications/unread-count`

Cheap endpoint for the header bell badge and the "Unread" tab pill.

**Response 200:**
```json
{ "count": 4 }
```

---

### 6. POST `/notifications/{id}/read`

Mark a single notification as read. Idempotent — sending it for an already-read notification is a no-op.

**Request:** no body.
**Response:** `204 No Content` (or echo the updated `Notification`).

Triggered when the user **taps** a notification row.

---

### 7. POST `/notifications/read-all`

Mark every unread notification as read.

**Request:** no body.
**Response:**
```json
{ "markedCount": 4 }
```

Triggered by the "Read All" button in the screen header.

---

### 8. DELETE `/notifications/{id}`

Dismiss / delete a notification permanently.

**Request:** no body.
**Response:** `204 No Content`.

Triggered when the user taps the **X** on a row or long-presses it.

---

## Screens with NO backend dependency

These are pure client / static / device-only — no endpoints needed:

| Screen | Why |
|--------|-----|
| [app-settings.tsx](app/(settings)/app-settings.tsx) | Theme + language + biometric — all stored locally (`AsyncStorage` + secure storage). |
| [about.tsx](app/(settings)/about.tsx) | Static content (i18n strings). |
| [terms.tsx](app/(settings)/terms.tsx) | Hardcoded 7 sections. |
| [privacy.tsx](app/(settings)/privacy.tsx) | Hardcoded 7 sections. |

If marketing wants Terms/Privacy/About to be editable without app releases, we could add `GET /content/{terms|privacy|about}` returning markdown/HTML — flag if you want this.

---

## Open questions for backend dev

1. **Notification preferences** — confirm endpoint shape above, and the matching GET endpoint to hydrate the screen.
2. **Avatar upload** — confirm endpoint + multipart vs base64.
3. **Notifications inbox** — confirm:
   - The `type` enum covers every notification kind the backend will send (or share the full list so we can extend the union).
   - `link` shape — do you want a separate `linkType` / `linkId` pair instead of the nested object?
   - Real-time updates — push via FCM (already wired) only, or should we also expose a websocket / SSE channel for in-app live updates?
   - Is `read-all` an "all unread" sweep or scoped to the current filter (e.g. a category)?

---

*Generated from analysis of `app/(settings)/` screens and `data/` repositories. Hand off to backend dev.*
