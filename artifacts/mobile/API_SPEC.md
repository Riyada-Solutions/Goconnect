# API_SPEC.md — CodeConnect Backend API Contract

> **Audience:** Backend engineers implementing the API, and the mobile team consuming it.
> This document is the single contract between frontend and backend.
> The mobile app's mock data in `data/mock/` mirrors every shape defined here exactly.

---

## Table of Contents

1. [Base URL & Conventions](#1-base-url--conventions)
2. [Authentication](#2-authentication)
3. [Error Format](#3-error-format)
4. [Auth Endpoints](#4-auth-endpoints)
5. [User / Profile Endpoints](#5-user--profile-endpoints)
6. [Alerts / Incidents Endpoints](#6-alerts--incidents-endpoints)
7. [Notifications Endpoints](#7-notifications-endpoints)
8. [Reference Data Endpoints](#8-reference-data-endpoints)
9. [Push Notifications (FCM)](#9-push-notifications-fcm)
10. [Domain Models (TypeScript)](#10-domain-models-typescript)
11. [Open Decisions](#11-open-decisions)

---

## 1. Base URL & Conventions

| Item | Value |
|------|-------|
| Path prefix | `/api` — all routes under this prefix |
| Format | JSON (`Content-Type: application/json`) |
| Encoding | UTF-8 |
| Timestamps | ISO 8601: `"2024-01-15T10:30:00Z"` |
| IDs | Strings — UUID v4 or opaque strings; must be stable for deep links |
| Pagination | `page` (1-based) + `limit` query params; response includes `total` |
| CORS | Enabled for all origins (mobile client) |

---

## 2. Authentication

After login, the app stores the access token and attaches it to every request:

```
Authorization: Bearer <access_token>
```

- The token getter is registered via `setAuthTokenGetter()` in `api_client.ts`
- Token is stored in `AsyncStorage`
- All endpoints marked **Auth required** return `401` if token is missing or expired
- On `401`, the app should redirect to the login screen and clear stored credentials

---

## 3. Error Format

All error responses use this consistent shape:

```json
{
  "message": "Human-readable description of the error",
  "code": "MACHINE_READABLE_CODE"
}
```

### Common error codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing or invalid request field |
| 401 | `UNAUTHORIZED` | Token missing, expired, or invalid |
| 403 | `FORBIDDEN` | Token valid but insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate (e.g. email already registered) |
| 422 | `INVALID_OTP` | OTP is wrong or expired |
| 422 | `INVALID_CREDENTIALS` | Wrong username or password |
| 422 | `WEAK_PASSWORD` | Password does not meet requirements |
| 422 | `INVALID_REGISTER_CODE` | Register code not found or expired |
| 429 | `RATE_LIMITED` | Too many OTP requests |
| 500 | `SERVER_ERROR` | Internal error |

---

## 4. Auth Endpoints

### POST `/api/auth/login`

Login with username and password.

**Request body:**
```json
{
  "username": "dr.waleed@hospital.com",
  "password": "Password123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "user-001",
    "name": "Dr. Waleed",
    "role": "Physician",
    "hospital": "General Hospital",
    "email": "dr.waleed@hospital.com",
    "phone": "+966500000001",
    "department": "Cardiology",
    "employeeId": "EMP-001",
    "avatarUrl": null
  }
}
```

**Error codes:** `INVALID_CREDENTIALS`, `VALIDATION_ERROR`

---

### POST `/api/auth/register`

Register a new user with an organization code.

**Request body:**
```json
{
  "registerCode": "HOSP-2024-XYZ",
  "phone": "+966500000001",
  "fullName": "Dr. Waleed Ahmed",
  "email": "waleed@hospital.com"
}
```

**Response `201`:**
```json
{
  "message": "OTP sent to your phone number"
}
```

After this, the app navigates to the OTP screen with `purpose: "register"`.

**Error codes:** `INVALID_REGISTER_CODE`, `CONFLICT` (email/phone already used)

---

### POST `/api/auth/verify-otp`

Verify the OTP for registration or password reset.

**Request body:**
```json
{
  "purpose": "register",
  "identifier": "+966500000001",
  "otp": "1234"
}
```

> OTP is **4 digits** — enforced in the mobile UI.

**Purpose values:** `"register"` | `"reset_password"`

**Response `200`:**
```json
{
  "verified": true,
  "resetToken": "abc123"
}
```

> `resetToken` is only returned when `purpose = "reset_password"` — used in the next step.

**Error codes:** `INVALID_OTP`, `VALIDATION_ERROR`

---

### POST `/api/auth/resend-otp`

Resend OTP to the same identifier.

**Request body:**
```json
{
  "purpose": "register",
  "identifier": "+966500000001"
}
```

**Response `200`:**
```json
{ "message": "OTP resent" }
```

**Error codes:** `RATE_LIMITED`

---

### POST `/api/auth/forgot-password`

Trigger password reset. Sends OTP to the provided email.

**Request body:**
```json
{
  "email": "waleed@hospital.com"
}
```

**Response `200`:**
```json
{ "message": "OTP sent to your email" }
```

The app then navigates to the OTP screen with `purpose: "reset_password"`.

---

### POST `/api/auth/reset-password`

Set a new password using the token from OTP verification.

**Request body:**
```json
{
  "resetToken": "abc123",
  "newPassword": "NewPassword123"
}
```

> Minimum password length: **8 characters** — enforced in the mobile UI.

**Response `200`:**
```json
{ "message": "Password reset successfully" }
```

**Error codes:** `WEAK_PASSWORD`, `VALIDATION_ERROR`

---

### POST `/api/auth/change-password`

**Auth required.**
Change password for the currently logged-in user.

**Request body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response `200`:**
```json
{ "message": "Password changed successfully" }
```

**Error codes:** `INVALID_CREDENTIALS`, `WEAK_PASSWORD`

---

### POST `/api/auth/logout`

**Auth required.** (Optional — revoke refresh token if used.)

**Request body:** empty

**Response `200`:**
```json
{ "message": "Logged out" }
```

---

### POST `/api/auth/delete-account`

**Auth required.**
Permanently delete the account. Requires password + user types `"DELETE"` in the confirmation field.

**Request body:**
```json
{
  "password": "CurrentPassword123",
  "confirmation": "DELETE"
}
```

**Response `200`:**
```json
{ "message": "Account deleted" }
```

**Behavior:** Hard delete or deactivate the user. Revoke all tokens. Align with compliance requirements.

**Error codes:** `INVALID_CREDENTIALS`, `VALIDATION_ERROR`

---

## 5. User / Profile Endpoints

### GET `/api/me`

**Auth required.**
Returns the current user's profile.

**Response `200`:**
```json
{
  "id": "user-001",
  "name": "Dr. Waleed Ahmed",
  "role": "Physician",
  "hospital": "General Hospital",
  "email": "waleed@hospital.com",
  "phone": "+966500000001",
  "department": "Cardiology",
  "employeeId": "EMP-001",
  "avatarUrl": "https://cdn.example.com/avatars/user-001.jpg"
}
```

---

### PATCH `/api/me`

**Auth required.**
Update editable profile fields.

**Request body (all fields optional):**
```json
{
  "name": "Dr. Waleed Ahmed",
  "email": "waleed@hospital.com",
  "phone": "+966500000001",
  "department": "Cardiology"
}
```

> `role` and `hospital` are read-only — ignore if sent.

**Response `200`:** returns updated user object (same shape as GET `/api/me`)

---

### POST `/api/me/device-token`

**Auth required.**
Register or update the FCM device token for push notifications.

**Request body:**
```json
{
  "token": "fcm-device-token-string",
  "platform": "android"
}
```

**Platform values:** `"android"` | `"ios"`

**Response `200`:**
```json
{ "message": "Device token registered" }
```

---

## 6. Alerts / Incidents Endpoints

### GET `/api/alerts`

**Auth required.**
List alerts with optional filters.

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | `active \| pending \| resolved` | Filter by status |
| `type` | string | Filter by code type (e.g. `"Code Blue"`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "alert-001",
      "title": "Code Blue: Cardiac Arrest",
      "type": "Code Blue",
      "color": "#2196F3",
      "location": "Building A, Floor 3",
      "status": "active",
      "responders": 3,
      "timestamp": "2024-01-15T10:30:00Z",
      "building": "Building A",
      "floor": "3",
      "department": "ICU",
      "room": "Room 301",
      "notes": null
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/alerts/:id`

**Auth required.**
Alert detail including responder list.

**Response `200`:**
```json
{
  "id": "alert-001",
  "title": "Code Blue: Cardiac Arrest",
  "type": "Code Blue",
  "color": "#2196F3",
  "location": "Building A, Floor 3",
  "status": "active",
  "responders": 3,
  "timestamp": "2024-01-15T10:30:00Z",
  "building": "Building A",
  "floor": "3",
  "department": "ICU",
  "room": "Room 301",
  "notes": "Patient unresponsive on arrival",
  "respondersList": [
    {
      "id": "resp-001",
      "name": "Dr. Sara",
      "role": "Cardiologist",
      "avatar": "DS",
      "respondedAt": "2024-01-15T10:32:00Z"
    }
  ]
}
```

---

### POST `/api/alerts`

**Auth required.**
Activate a new emergency code. Triggered from the emergency activation flow.

**Request body:**
```json
{
  "type": "Code Blue",
  "building": "Building A",
  "floor": "3",
  "department": "ICU",
  "room": "Room 301",
  "notes": "Optional additional notes"
}
```

**Response `201`:**
```json
{
  "id": "alert-002",
  "title": "Code Blue: ICU",
  "status": "active",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

After creation, the backend should push `emergency_alert` FCM notification to relevant staff.

---

### POST `/api/alerts/:id/respond`

**Auth required.**
Current user responds to an alert.

**Request body:** empty

**Response `200`:**
```json
{
  "message": "Response recorded",
  "respondedAt": "2024-01-15T11:05:00Z"
}
```

---

### POST `/api/alerts/:id/escalate`

**Auth required.**
Escalate an alert (e.g. request more resources).

**Request body (optional):**
```json
{
  "reason": "Additional specialists needed"
}
```

**Response `200`:**
```json
{ "message": "Alert escalated" }
```

---

### POST `/api/alerts/:id/accept`

**Auth required.**
Accept an incoming alert assignment.

**Response `200`:**
```json
{ "message": "Alert accepted" }
```

---

### POST `/api/alerts/:id/decline`

**Auth required.**
Decline an incoming alert assignment.

**Request body (optional):**
```json
{
  "reason": "Currently in surgery"
}
```

**Response `200`:**
```json
{ "message": "Alert declined" }
```

---

### GET `/api/home/active-requests`

**Auth required.**
Lightweight list for the home screen "active requests" widget.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "alert-001",
      "title": "Code Blue: Cardiac Arrest",
      "type": "urgent",
      "location": "Building A, Floor 3",
      "updatedAt": "2024-01-15T10:30:00Z",
      "code": "Code Blue",
      "color": "#2196F3"
    }
  ]
}
```

> **IDs must match `/api/alerts` IDs** — the app navigates to `/alert/[id]` from home.

---

## 7. Notifications Endpoints

### GET `/api/notifications`

**Auth required.**

**Query params:** `page`, `limit`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "notif-001",
      "title": "New Emergency Alert",
      "message": "Code Red activated in Building B",
      "time": "2024-01-15T10:30:00Z",
      "read": false,
      "type": "urgent"
    }
  ],
  "total": 15,
  "unreadCount": 3,
  "page": 1,
  "limit": 20
}
```

**Notification type values:** `"urgent"` | `"info"` | `"success"`

---

### PATCH `/api/notifications/:id/read`

**Auth required.**
Mark a single notification as read.

**Response `200`:**
```json
{ "message": "Marked as read" }
```

---

### POST `/api/notifications/read-all`

**Auth required.**
Mark all notifications as read.

**Response `200`:**
```json
{ "message": "All notifications marked as read" }
```

---

## 8. Reference Data Endpoints

These endpoints are optional. The app currently uses hardcoded values. Expose these to allow updates without an app release.

### GET `/api/code-types`

List all emergency code types.

**Response `200`:**
```json
{
  "data": [
    {
      "type": "Code Blue",
      "color": "#2196F3",
      "icon": "heart",
      "description": "Cardiac or respiratory arrest",
      "tagline": "Immediate life support required"
    }
  ]
}
```

---

### GET `/api/locations/buildings`

**Auth required.**

**Response `200`:**
```json
{
  "data": ["Building A", "Building B", "Emergency Wing"]
}
```

---

### GET `/api/locations/floors`

**Auth required.**

**Query params:** `building` (required)

**Response `200`:**
```json
{
  "data": ["1", "2", "3", "4", "Basement"]
}
```

---

### GET `/api/locations/departments`

**Auth required.**

**Query params:** `building`, `floor`

**Response `200`:**
```json
{
  "data": ["ICU", "Cardiology", "Emergency", "Surgery"]
}
```

---

## 9. Push Notifications (FCM)

The backend sends FCM push notifications for real-time events.

### Notification payload shape

```json
{
  "notification": {
    "title": "New Emergency Alert",
    "body": "Code Blue activated in Building A"
  },
  "data": {
    "id": "alert-001",
    "type": "emergency_alert"
  }
}
```

### Notification types

| `type` value | Trigger | Mobile action |
|-------------|---------|---------------|
| `general` | Info announcements | Show notification, no navigation |
| `emergency_alert` | New emergency code activated | Navigate to Incoming Alert screen |
| `code_activated` | Code activated (for responders) | Navigate to `/alert/[id]` |
| `responder_assigned` | User assigned to an alert | Navigate to `/alert/[id]` |
| `alert_resolved` | Alert marked as resolved | Navigate to Alerts tab |

The `id` field in `data` is the alert ID used for deep linking.

---

## 10. Domain Models (TypeScript)

These types are defined in `artifacts/codeconnect/types/` and shared between the app and mock data.

```typescript
// types/auth.ts
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface User {
  id: string
  name: string
  role: string
  hospital: string
  email: string
  phone: string
  department: string
  employeeId: string
  avatarUrl: string | null
}
```

```typescript
// types/alert.ts
export interface Alert {
  id: string
  title: string
  type: string
  color: string
  location: string
  status: 'active' | 'pending' | 'resolved'
  responders: number
  timestamp: string
  building: string
  floor: string
  department: string
  room: string
  notes: string | null
}

export interface AlertDetail extends Alert {
  respondersList: Responder[]
}

export interface Responder {
  id: string
  name: string
  role: string
  avatar: string
  respondedAt: string
}

export interface ActiveRequest {
  id: string
  title: string
  type: 'urgent' | 'pending' | 'transit' | 'active' | 'resolved'
  location: string
  updatedAt: string
  code: string
  color: string
}
```

```typescript
// types/notification.ts
export interface AppNotification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'urgent' | 'info' | 'success'
}

export interface NotificationPayload {
  id: string
  type: NotificationType
  data?: Record<string, string>
}

export enum NotificationType {
  general = 'general',
  emergency_alert = 'emergency_alert',
  code_activated = 'code_activated',
  responder_assigned = 'responder_assigned',
  alert_resolved = 'alert_resolved',
}
```

---

## 11. Open Decisions

These must be decided between the product and backend teams before implementation:

| # | Decision | Options |
|---|----------|---------|
| 1 | **Login identifier** | Username string vs email address (UI label is "username") |
| 2 | **Multi-tenancy** | Single hospital vs multi-hospital; how `registerCode` maps to hospital/branch |
| 3 | **Guest mode** | Anonymous users only client-side, or also server-side? |
| 4 | **RBAC** | Who can activate codes? Who can escalate? Who can view PII? |
| 5 | **Audit trail** | Immutable event log for compliance? |
| 6 | **Real-time** | WebSocket vs SSE vs FCM-only for live alert updates |
| 7 | **Token strategy** | Access token only vs access + refresh token pair |
| 8 | **Account deletion** | Hard delete vs soft deactivate for compliance |
| 9 | **OTP delivery** | SMS vs email (currently: SMS for register, email for reset) |
| 10 | **Pagination defaults** | Default `limit` for alerts and notifications lists |
