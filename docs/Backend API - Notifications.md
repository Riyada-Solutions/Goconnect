# Notifications API — Backend Contract

This is the complete contract the mobile app needs from the backend for the
notifications feature. It covers list, count, mark-read, preferences, snooze,
device registration (push), real-time updates, and per-type payload schemas.

Conventions used throughout:

- Base URL: `{baseUrl}/api`
- Auth: `Authorization: Bearer <token>` on every endpoint unless stated.
- Envelope: successful responses are wrapped in `{ "data": ... }`. Lists
  additionally carry `{ "meta": { ... } }` for pagination.
- Times: ISO 8601 UTC strings (`2026-05-13T07:51:00Z`). The mobile client
  formats relative-time labels locally.
- IDs: integers unless noted. The client accepts both `number` and numeric
  strings, but please send integers.
- Casing: existing endpoints use a mix of `snake_case` and `camelCase`.
  We are flexible — pick one per endpoint and stay consistent. The shapes
  below assume `snake_case` because that's what the recent `/dashboard`
  response uses.

---

## 1. Endpoint summary

| # | Method | Path                                              | Purpose                                            |
|---|--------|---------------------------------------------------|----------------------------------------------------|
| 1 | GET    | `/api/notifications`                              | List notifications (paginated, filterable).        |
| 2 | GET    | `/api/notifications/{id}`                         | Single notification by id.                         |
| 3 | GET    | `/api/notifications/count`                        | Lightweight unread count.                          |
| 4 | POST   | `/api/notifications/{id}/read`                    | Mark one as read.                                  |
| 5 | POST   | `/api/notifications/{id}/unread`                  | Mark one as unread.                                |
| 6 | POST   | `/api/notifications/read-all`                     | Mark all (or a filtered subset) as read.           |
| 7 | DELETE | `/api/notifications/{id}`                         | Soft-delete a single notification.                 |
| 8 | DELETE | `/api/notifications`                              | Bulk delete (by ids or filter).                    |
| 9 | POST   | `/api/notifications/{id}/snooze`                  | Snooze until a future timestamp.                   |
| 10| GET    | `/api/notifications/preferences`                  | User's per-type channel preferences.               |
| 11| PATCH  | `/api/notifications/preferences`                  | Update per-type channel preferences.               |
| 12| POST   | `/api/notifications/devices`                      | Register push device token (FCM / APNs).           |
| 13| DELETE | `/api/notifications/devices/{token}`              | Deregister device token (on logout).               |
| 14| GET    | `/api/notifications/stream`                       | (Optional) SSE / WebSocket for real-time updates.  |

---

## 2. Core resource — `Notification`

Every notification object the client receives has this shape. Fields marked
**required** must always be present; `null` is allowed only for fields that
say so explicitly.

```json
{
  "id": 1245,
  "type": "visit_assigned",
  "category": "clinical",
  "priority": "normal",
  "title": "New Visit Assigned",
  "body": "You have a home visit for Ahmed Al-Rashid at 10:00 AM.",
  "icon": "calendar",
  "image_url": null,
  "read": false,
  "read_at": null,
  "created_at": "2026-05-13T07:51:00Z",
  "updated_at": "2026-05-13T07:51:00Z",
  "snoozed_until": null,
  "deleted_at": null,
  "deeplink": {
    "screen": "visit_detail",
    "params": { "id": 140 }
  },
  "actor": {
    "id": 22,
    "name": "Dr. Sara Al-Otaibi",
    "role": "Physician",
    "avatar_url": null
  },
  "metadata": {
    "patient_id": 111,
    "visit_id": 140
  }
}
```

### Field reference

| Field            | Type                       | Required | Notes                                                                                |
|------------------|----------------------------|----------|--------------------------------------------------------------------------------------|
| `id`             | integer                    | yes      | Stable per user.                                                                     |
| `type`           | string (enum, §4)          | yes      | Drives icon/color and which `metadata` keys are populated.                           |
| `category`       | string (enum)              | yes      | `clinical` \| `operational` \| `system` \| `message`. Used by the type filter chip. |
| `priority`       | string (enum)              | yes      | `low` \| `normal` \| `high` \| `critical`. Drives sort weight & alert sound.        |
| `title`          | string                     | yes      | Plain text. Max 120 chars recommended.                                               |
| `body`           | string                     | yes      | Plain text. Max 500 chars recommended.                                               |
| `icon`           | string                     | no       | Feather icon name override. If absent, client picks one from `type`.                |
| `image_url`      | string (URL) \| null       | no       | Optional thumbnail (e.g. lab attachment, avatar).                                    |
| `read`           | boolean                    | yes      | `true` iff `read_at != null`. Authoritative for the UI.                              |
| `read_at`        | ISO 8601 \| null           | yes      | When the user marked it read.                                                        |
| `created_at`     | ISO 8601                   | yes      | Server clock.                                                                        |
| `updated_at`     | ISO 8601                   | yes      | Bumped on any server-side mutation.                                                  |
| `snoozed_until`  | ISO 8601 \| null           | no       | If set and in the future, the item is hidden from default list.                      |
| `deleted_at`     | ISO 8601 \| null           | no       | Set when the user soft-deletes. Hidden from default list.                            |
| `deeplink`       | object (§5) \| null        | no       | Tap target. If null/unknown, tap opens the list.                                     |
| `actor`          | object \| null             | no       | Who triggered the notification (doctor, system, etc.).                              |
| `metadata`       | object                     | yes      | Type-specific payload — see §4 for required keys per `type`.                        |

---

## 3. Pagination & meta

List endpoints (`#1`, `#8`) return:

```json
{
  "data": [ /* Notification[] */ ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 87,
    "last_page": 5,
    "unread_total": 11
  }
}
```

- `unread_total` is the unread count for the **same filter** that produced
  the page (so a `?type=lab_result` list returns the unread count for that
  type, not the global unread count).

---

## 4. Notification `type` catalogue

Each type below lists:
- **Trigger** — when the backend should emit it.
- **Category / Priority** — defaults; backend may override per-event.
- **Required `metadata` keys** — these MUST be present so the client can
  build the deeplink and the body.
- **Suggested copy** — the client falls back to these when `title`/`body`
  are missing; preferred is for backend to send localized strings.

### 4.1 `visit_assigned`
- Trigger: a visit is assigned to the current nurse.
- Category: `clinical`. Priority: `normal` (raise to `high` if visit is <2h away).
- `metadata`: `{ "visit_id": int, "patient_id": int, "patient_name": string, "visit_date": "YYYY-MM-DD", "visit_time": "HH:mm" }`
- `deeplink`: `{ screen: "visit_detail", params: { id: visit_id } }`
- Copy: title `"New Visit Assigned"`, body `"You have a {{type}} for {{patient_name}} at {{visit_time}}."`

### 4.2 `visit_reminder`
- Trigger: visit starts within a configurable window (default 30 min).
- Category: `clinical`. Priority: `high`.
- `metadata`: same as `visit_assigned`.
- `deeplink`: visit_detail.

### 4.3 `visit_started` / `visit_completed` / `visit_cancelled`
- Trigger: lifecycle transitions, when actor is not the current nurse.
- Category: `clinical`. Priority: `normal`.
- `metadata`: `{ "visit_id": int, "patient_id": int, "patient_name": string, "status": "in_progress" | "completed" | "cancelled" }`
- `deeplink`: visit_detail.

### 4.4 `appointment_created` / `appointment_updated` / `appointment_cancelled`
- Trigger: appointment lifecycle for slots the nurse can see.
- Category: `operational`. Priority: `normal`.
- `metadata`: `{ "appointment_id": int, "patient_id": int, "patient_name": string, "visit_date": "YYYY-MM-DD", "time": "HH:mm" }`
- `deeplink`: `{ screen: "appointment_detail", params: { id: appointment_id } }`

### 4.5 `appointment_reminder`
- Trigger: appointment starts within a configurable window.
- Category: `operational`. Priority: `high`.
- `metadata`: same as `appointment_created`.

### 4.6 `appointment_confirmed` / `appointment_checked_in`
- Trigger: status transition to confirmed / checked-in.
- Category: `operational`. Priority: `normal`.
- `metadata`: same as `appointment_created`, plus `"by_actor_id": int | null`.

### 4.7 `lab_order_added`
- Trigger: a doctor creates a lab order on a patient the nurse follows.
- Category: `clinical`. Priority: `normal`.
- `metadata`: `{ "patient_id": int, "patient_name": string, "lab_order_id": int, "tests": string[] }`
- `deeplink`: `{ screen: "lab_results", params: { patient_id, order_id: lab_order_id } }`

### 4.8 `lab_result`
- Trigger: lab result becomes available.
- Category: `clinical`. Priority: `high` if any value flagged abnormal, else `normal`.
- `metadata`: `{ "patient_id": int, "patient_name": string, "lab_order_id": int, "result_id": int, "has_abnormal": bool }`
- `deeplink`: lab_results (with `result_id`).

### 4.9 `patient_added`
- Trigger: patient added to the nurse's panel.
- Category: `clinical`. Priority: `normal`.
- `metadata`: `{ "patient_id": int, "patient_name": string }`
- `deeplink`: `{ screen: "patient_detail", params: { id: patient_id } }`

### 4.10 `patient_alert`
- Trigger: critical patient alert (allergy added, isolation status change, etc.).
- Category: `clinical`. Priority: `high` (or `critical` for life-threatening).
- `metadata`: `{ "patient_id": int, "patient_name": string, "alert_type": string, "alert_id": int }`
- `deeplink`: patient_detail.

### 4.11 `message`
- Trigger: direct message from another staff member.
- Category: `message`. Priority: `normal`.
- `metadata`: `{ "thread_id": int, "sender_id": int, "sender_name": string }`
- `deeplink`: `{ screen: "message_thread", params: { id: thread_id } }`
- Note: `actor` must be populated.

### 4.12 `shift_change`
- Trigger: nurse's shift / schedule is modified by an admin.
- Category: `operational`. Priority: `normal`.
- `metadata`: `{ "shift_id": int, "starts_at": ISO8601, "ends_at": ISO8601 }`
- `deeplink`: `{ screen: "schedule" }`

### 4.13 `inventory_low`
- Trigger: a patient's stock for an item drops below threshold.
- Category: `operational`. Priority: `normal`.
- `metadata`: `{ "patient_id": int, "item_id": int, "item_name": string, "available": int }`
- `deeplink`: `{ screen: "patient_inventory", params: { patient_id } }`

### 4.14 `system`
- Trigger: app-wide announcements (release notes, maintenance windows).
- Category: `system`. Priority: `low` (use `high` for incidents).
- `metadata`: free-form. May be `{}`.
- `deeplink`: optional. May be an external `url` (see §5).

### Unknown types

If the client receives a `type` it does not recognise, it falls back to a
generic icon and renders `title` + `body` as-is. Adding a new type does not
require a mobile release as long as `deeplink.screen` is one of the keys
listed in §5 (or omitted).

---

## 5. `deeplink` schema

The client interprets `deeplink` to push an in-app screen on tap.

```json
{ "screen": "visit_detail", "params": { "id": 140 } }
```

### Recognised `screen` values

| `screen`              | Required `params`                              | Maps to client route                     |
|-----------------------|------------------------------------------------|------------------------------------------|
| `home`                | —                                              | `/(tabs)/home`                           |
| `visits_list`         | —                                              | `/(tabs)/visits`                         |
| `visit_detail`        | `{ id }`                                       | `/visits/[id]`                           |
| `appointments_list`   | —                                              | `/(tabs)/scheduler`                      |
| `appointment_detail`  | `{ id }`                                       | `/appointments/[id]`                     |
| `patients_list`       | —                                              | `/(tabs)/patients`                       |
| `patient_detail`      | `{ id }`                                       | `/patients/[id]`                         |
| `patient_inventory`   | `{ patient_id }`                               | `/patients/[id]?tab=inventory`           |
| `lab_results`         | `{ patient_id, order_id?, result_id? }`        | `/lab-results/[id]` or list              |
| `message_thread`      | `{ id }`                                       | (future) `/messages/[id]`                |
| `schedule`            | —                                              | `/(tabs)/scheduler`                      |
| `settings`            | —                                              | `/(settings)`                            |
| `notifications`       | —                                              | `/notifications`                         |

### External URLs

For `system` notifications you may instead send:

```json
{ "url": "https://example.com/release-notes/4.1" }
```

The client opens external URLs in the in-app browser. `url` and `screen`
are mutually exclusive — send one or the other.

---

## 6. Endpoint details

### 6.1 `GET /api/notifications`

List notifications for the authenticated user, newest first.

#### Query parameters

| Param           | Type      | Default | Notes                                                         |
|-----------------|-----------|---------|---------------------------------------------------------------|
| `page`          | integer   | `1`     | 1-based.                                                      |
| `per_page`      | integer   | `20`    | Max `100`.                                                    |
| `unread`        | boolean   | —       | `true` → only `read=false`. `false` → only `read=true`.       |
| `type`          | csv enum  | —       | One or more `type` values, comma-separated.                   |
| `category`      | csv enum  | —       | One or more `category` values.                                |
| `priority`      | csv enum  | —       | One or more `priority` values.                                |
| `since`         | ISO 8601  | —       | Only items with `created_at > since`.                         |
| `until`         | ISO 8601  | —       | Only items with `created_at < until`.                         |
| `include_deleted` | boolean | `false` | Include soft-deleted (`deleted_at != null`).                  |
| `include_snoozed` | boolean | `false` | Include items whose `snoozed_until > now`.                    |

#### Response — 200 OK

`{ data: Notification[], meta: { ... } }`. See §2 and §3.

#### Errors

- `401 Unauthorized` — missing/invalid token.
- `422 Unprocessable Entity` — bad query param (e.g. unknown `type`).

---

### 6.2 `GET /api/notifications/{id}`

Single notification. Useful when the app receives a push payload referencing
an id it hasn't loaded yet.

#### Response — 200 OK

`{ data: Notification }`.

#### Errors

- `404 Not Found` — id does not exist OR belongs to another user.

---

### 6.3 `GET /api/notifications/count`

Lightweight count, designed to be called frequently (e.g. on tab switch).

#### Query parameters

Same as §6.1 (`type`, `category`, `priority`, `since`, …). When omitted,
returns the global unread count.

#### Response — 200 OK

```json
{ "data": { "unread": 11, "total": 87 } }
```

> Home does NOT need this — it reads `notification_count` off `/dashboard`.
> Drop this endpoint if you'd rather centralise on `/dashboard`.

---

### 6.4 `POST /api/notifications/{id}/read`

Idempotent. No request body. Marking an already-read item is a no-op.

#### Response — 200 OK

`{ data: Notification }` (with `read: true`, `read_at` set).

#### Errors

- `404 Not Found` — id does not exist OR belongs to another user.

---

### 6.5 `POST /api/notifications/{id}/unread`

Idempotent. Reverses `read`. Useful for user "mark as unread" UX.

#### Response — 200 OK

`{ data: Notification }`.

---

### 6.6 `POST /api/notifications/read-all`

Mark all matching notifications as read.

#### Request body (optional)

```json
{
  "ids": [1245, 1246],
  "filter": { "type": ["lab_result"], "category": ["clinical"] }
}
```

- Pass `ids` to mark a specific list.
- Pass `filter` (same vocabulary as §6.1) to mark a server-side query.
- Pass neither to mark **everything** unread for the user as read.
- `ids` and `filter` are mutually exclusive; backend should 422 if both are
  set.

#### Response — 200 OK

```json
{ "data": { "marked": 11 } }
```

---

### 6.7 `DELETE /api/notifications/{id}`

Soft-delete. Sets `deleted_at` on the row. The item is hidden from the
default list but remains queryable via `?include_deleted=true`.

#### Response — 204 No Content

---

### 6.8 `DELETE /api/notifications`

Bulk soft-delete. Body identical to §6.6 (`ids` xor `filter`).

#### Response — 200 OK

```json
{ "data": { "deleted": 23 } }
```

---

### 6.9 `POST /api/notifications/{id}/snooze`

Hide a notification until a future timestamp. Cleared automatically when the
timestamp passes (i.e. it reappears).

#### Request body

```json
{ "until": "2026-05-13T17:00:00Z" }
```

Or a preset:

```json
{ "preset": "1h" }
```

Recognised presets: `15m`, `1h`, `3h`, `tomorrow`, `next_week`.

Either `until` (ISO 8601 in the future) or `preset` is required.

#### Response — 200 OK

`{ data: Notification }` with `snoozed_until` populated.

#### Errors

- `422` — `until` in the past or unrecognised `preset`.

---

### 6.10 `GET /api/notifications/preferences`

User's per-type channel preferences. Drives the in-app settings screen.

#### Response — 200 OK

```json
{
  "data": {
    "channels": {
      "push":  { "enabled": true },
      "email": { "enabled": true },
      "sms":   { "enabled": false },
      "inapp": { "enabled": true }
    },
    "types": {
      "visit_assigned":       { "push": true,  "email": true,  "sms": false, "inapp": true },
      "visit_reminder":       { "push": true,  "email": false, "sms": false, "inapp": true },
      "appointment_reminder": { "push": true,  "email": false, "sms": false, "inapp": true },
      "lab_result":           { "push": true,  "email": true,  "sms": false, "inapp": true },
      "message":              { "push": true,  "email": false, "sms": false, "inapp": true },
      "system":               { "push": false, "email": false, "sms": false, "inapp": true }
    },
    "quiet_hours": {
      "enabled": true,
      "start": "22:00",
      "end":   "07:00",
      "timezone": "Asia/Riyadh"
    }
  }
}
```

- A `type` entry not present in `types` inherits from `channels`.
- During `quiet_hours`, `push` and `sms` should be suppressed; `inapp` still
  records the notification.

---

### 6.11 `PATCH /api/notifications/preferences`

Partial update. Send only the keys that changed.

#### Request body (example)

```json
{
  "types": {
    "lab_result": { "email": false }
  },
  "quiet_hours": { "enabled": false }
}
```

#### Response — 200 OK

Returns the full updated preferences object (same shape as §6.10).

#### Errors

- `422` — invalid `type` key, malformed `quiet_hours.start/end` (must be
  `HH:mm`), or invalid IANA `timezone`.

---

### 6.12 `POST /api/notifications/devices`

Register a push device token. Called after the user grants notification
permission, and again on app launch if the token rotated.

#### Request body

```json
{
  "platform":     "android",
  "provider":     "fcm",
  "token":        "fcm_token_string",
  "app_version":  "4.0.1",
  "os_version":   "Android 14",
  "device_model": "Pixel 7",
  "locale":       "en-SA"
}
```

| Field          | Type   | Required | Notes                                          |
|----------------|--------|----------|------------------------------------------------|
| `platform`     | enum   | yes      | `android` \| `ios` \| `web`.                   |
| `provider`     | enum   | yes      | `fcm` \| `apns` \| `expo` \| `webpush`.        |
| `token`        | string | yes      | Provider-specific device token.                |
| `app_version`  | string | yes      | E.g. `4.0.1`.                                  |
| `os_version`   | string | no       | Free-form.                                     |
| `device_model` | string | no       | Free-form.                                     |
| `locale`       | string | no       | BCP-47 (`en-SA`, `ar-SA`).                     |

Idempotent on `(user_id, token)` — calling twice with the same token updates
the row, doesn't create a duplicate.

#### Response — 200 OK

```json
{ "data": { "device_id": 88, "registered_at": "2026-05-13T07:51:00Z" } }
```

---

### 6.13 `DELETE /api/notifications/devices/{token}`

Deregister. Called on logout and when the OS reports the token as
invalidated.

#### Response — 204 No Content

---

### 6.14 `GET /api/notifications/stream` (optional)

If the backend exposes SSE or WebSocket, the client will subscribe to push
in real-time notifications without polling. Either of:

- SSE (preferred for simplicity): `text/event-stream`, events of type
  `notification.created`, `notification.updated`, `notification.deleted`,
  each event's `data:` is a `Notification` (or `{ id }` for deletes).
- WebSocket: same event names, JSON frames.

If unavailable, the client falls back to polling `/api/notifications/count`
every 60 seconds while the app is foregrounded.

---

## 7. Push payload contract (FCM / APNs)

When the server pushes a notification, the OS payload must include enough
data for the client to either:
1. Show a system tray notification immediately, AND
2. Open the right screen if the user taps it, even if the app is cold-booted.

### 7.1 FCM (Android)

```json
{
  "to": "<token>",
  "priority": "high",
  "notification": {
    "title": "New Visit Assigned",
    "body":  "You have a home visit for Ahmed Al-Rashid at 10:00 AM.",
    "sound": "default"
  },
  "data": {
    "id":       "1245",
    "type":     "visit_assigned",
    "priority": "normal",
    "deeplink": "{\"screen\":\"visit_detail\",\"params\":{\"id\":140}}",
    "metadata": "{\"patient_id\":111,\"visit_id\":140}"
  }
}
```

- `data` values must be strings (FCM constraint). Client JSON-parses
  `deeplink` and `metadata`.
- For `priority: "critical"` notifications, set FCM `priority: "high"` and
  `notification.channel_id: "critical"` (client will create this channel).

### 7.2 APNs (iOS)

```json
{
  "aps": {
    "alert": {
      "title": "New Visit Assigned",
      "body":  "You have a home visit for Ahmed Al-Rashid at 10:00 AM."
    },
    "badge": 11,
    "sound": "default",
    "thread-id": "visit-140",
    "category": "VISIT_ASSIGNED",
    "mutable-content": 1
  },
  "id":       1245,
  "type":     "visit_assigned",
  "priority": "normal",
  "deeplink": { "screen": "visit_detail", "params": { "id": 140 } },
  "metadata": { "patient_id": 111, "visit_id": 140 }
}
```

- `badge` should reflect the user's current unread count post-delivery.
- `thread-id` groups related notifications in the iOS UI.
- `category` enables custom action buttons (mark-read, snooze) when set up
  on the client.

---

## 8. Error response format

Errors follow the standard API error envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Field 'until' must be in the future.",
    "fields": {
      "until": ["must be in the future"]
    }
  }
}
```

| HTTP | `error.code`           | When                                                     |
|------|------------------------|----------------------------------------------------------|
| 400  | `bad_request`          | Malformed JSON.                                          |
| 401  | `unauthenticated`      | Missing/expired token.                                   |
| 403  | `forbidden`            | Authenticated, but resource not visible to the user.     |
| 404  | `not_found`            | Id does not exist OR belongs to another user.            |
| 409  | `conflict`             | Idempotency conflict (rare).                             |
| 422  | `validation_error`     | Body/query failed validation. `fields` enumerates them.  |
| 429  | `rate_limited`         | Throttled. Response includes `Retry-After` header.       |
| 500  | `internal_error`       | Server bug.                                              |

---

## 9. Behavior expectations

- **Auth & scope**: every endpoint requires the user's bearer token and
  returns only that user's notifications. The client never sends `user_id`.
- **Ordering**: `GET /api/notifications` returns newest first by
  `created_at`, with `id` as a tiebreaker. Within the same `created_at`,
  higher `priority` ranks first.
- **Soft delete**: deletes set `deleted_at`. Hard delete is not exposed.
- **Snooze**: items with `snoozed_until > now()` are hidden from the
  default list. When `now() >= snoozed_until`, they reappear; the row
  itself is not modified.
- **Read receipts**: `read_at` is server-time, not client-time.
- **Retention**: the server may purge soft-deleted rows older than 90 days
  and read rows older than 1 year. The client makes no assumptions.
- **Idempotency**: read / unread / snooze / device registration are
  idempotent. Re-issuing the same call must not produce side effects beyond
  refreshing `updated_at`.
- **Throttling**: per-user limits OK. The client retries 429s with the
  `Retry-After` header.
- **Time zones**: all `_at` fields are UTC. `quiet_hours` is local time in
  `quiet_hours.timezone`.
- **Localization**: backend should localize `title` / `body` based on the
  user's profile language (English default). The client sends
  `Accept-Language` so the server can pick.
- **Push delivery is best-effort**: a notification MUST also exist via the
  REST API. The client treats the REST list as the source of truth and
  uses push only to refresh / focus the screen.

---

## 10. Open questions for backend

1. **Pagination style** — confirm page-based vs cursor. Page-based matches
   the rest of the app; cursor would be cleaner for an infinite feed.
2. **Count parity** — should `/dashboard.notification_count` match the
   *global unread* count from `/api/notifications/count` exactly, or are
   there backend-side filters (e.g. exclude `system`)?
3. **`read_all` scope** — confirm it is scoped to the current user only
   (expected: yes).
4. **Deeplink shape** — confirm structured `{ screen, params }` (our
   preference) vs plain URL string (e.g. `careconnect://visits/140`).
5. **Real-time** — is SSE/WebSocket feasible in this phase, or should we
   plan for poll-only?
6. **Snooze semantics** — when a snoozed item's `snoozed_until` passes,
   should it generate a fresh push notification, or just silently reappear
   in the list?
7. **Quiet hours** — backend-enforced (server skips delivery) vs
   client-enforced (client suppresses display)? We expect server-enforced
   so quiet hours apply across devices.
8. **Critical priority** — confirm there is a path to bypass quiet hours
   for `priority: "critical"` items.

Please reply with confirmations or counter-proposals on the items above and
we'll lock the contract.
