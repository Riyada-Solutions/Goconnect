# AGENTS.md — CodeConnect Architecture & Engineering Guide

> **Audience:** AI agents, senior contributors, and engineers onboarding to this project.
> This is the single source of truth for architecture decisions, patterns, and conventions.
> Follow it exactly. Do not invent patterns not described here.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Layout](#2-repository-layout)
3. [Architecture](#3-architecture)
4. [Mock ↔ Real API Switching](#4-mock--real-api-switching)
5. [How to Add a New Feature (Workflow)](#5-how-to-add-a-new-feature-workflow)
6. [Data Layer — Patterns & Templates](#6-data-layer--patterns--templates)
7. [State Management Decision Tree](#7-state-management-decision-tree)
8. [Naming Conventions](#8-naming-conventions)
9. [Component Rules](#9-component-rules)
10. [Styling](#10-styling)
11. [Routing & Navigation](#11-routing--navigation)
12. [TypeScript](#12-typescript)
13. [Forms & Validation](#13-forms--validation)
14. [User Feedback & Dialogs](#14-user-feedback--dialogs)
15. [Firebase & Push Notifications](#15-firebase--push-notifications)
16. [Theme & Internationalization](#16-theme--internationalization)
17. [Animations](#17-animations)
18. [Platform-Specific Code](#18-platform-specific-code)
19. [Environment Variables](#19-environment-variables)
20. [Git & Commits](#20-git--commits)
21. [Flutter → React Native Reference](#21-flutter--react-native-reference)
22. [Brand & Design Tokens](#22-brand--design-tokens)
23. [Backend API Contract](#23-backend-api-contract)

---

## 1. Project Overview

**CodeConnect** is a hospital emergency response mobile app built with **Expo / React Native**.
Staff can activate emergency codes, respond to alerts, and receive real-time push notifications.

| Item | Value |
|------|-------|
| Framework | Expo SDK + React Native |
| Router | Expo Router (file-based) |
| Language | TypeScript (strict) |
| Server state | TanStack React Query |
| HTTP client | Axios (`data/api_client.ts`) |
| Push notifications | Firebase Cloud Messaging + expo-notifications |
| Animations | react-native-reanimated |
| Package manager | **pnpm** |
| App source root | `/` (project root) |
| Backend API spec | `API_SPEC.md` |

> All file creation, editing, and navigation work happens at the **project root** (`/`).
> There is no `artifacts/` folder — the Expo app is the root of this project.

---

## 2. Repository Layout

```
/                                             ← project root — THE MOBILE APP lives here
│
├── app/                                      ← Expo Router screens (file = route)
│   ├── _layout.tsx                           ← Root layout (fonts, QueryClient, AppContext)
│   ├── index.tsx                             ← Entry redirect (→ splash or tabs)
│   ├── +not-found.tsx                        ← 404 screen
│   ├── incoming-alert.tsx                    ← Incoming emergency alert screen
│   ├── notifications.tsx                     ← Notifications list screen
│   ├── settings.tsx                          ← Settings screen
│   ├── about.tsx                             ← About screen
│   ├── privacy.tsx                           ← Privacy policy screen
│   ├── terms.tsx                             ← Terms of service screen
│   ├── help-support.tsx                      ← Help & support screen
│   ├── edit-profile.tsx                      ← Edit profile screen
│   ├── change-password.tsx                   ← Change password screen
│   ├── delete-account.tsx                    ← Delete account screen
│   ├── delete-account-verify.tsx             ← Delete account OTP verify screen
│   ├── (auth)/                               ← Unauthenticated screens
│   │   ├── _layout.tsx                       ← Auth stack layout
│   │   ├── splash.tsx                        ← Splash / onboarding screen
│   │   ├── login.tsx                         ← Login screen
│   │   ├── register.tsx                      ← Register screen
│   │   ├── otp.tsx                           ← OTP verification screen
│   │   ├── verify-otp.tsx                    ← Verify OTP (password reset)
│   │   ├── forgot-password.tsx               ← Forgot password screen
│   │   └── new-password.tsx                  ← Set new password screen
│   ├── (tabs)/                               ← Authenticated tab screens
│   │   ├── _layout.tsx                       ← Tab bar layout
│   │   ├── index.tsx                         ← Home tab (active codes + requests)
│   │   ├── alerts.tsx                        ← Alerts list tab
│   │   └── profile.tsx                       ← Profile tab
│   ├── alert/
│   │   └── [id].tsx                          ← Alert detail screen
│   └── emergency/
│       └── new.tsx                           ← Activate emergency bottom sheet
│
├── components/
│   ├── ErrorBoundary.tsx                     ← Top-level error boundary wrapper
│   ├── ErrorFallback.tsx                     ← Fallback UI for error boundary
│   ├── KeyboardAwareScrollViewCompat.tsx     ← Cross-platform keyboard scroll helper
│   └── ui/                                   ← Reusable UI primitives
│       ├── AlertCard.tsx                     ← Alert list item card
│       ├── Avatar.tsx                        ← User avatar with initials
│       ├── Badge.tsx                         ← Status badge (urgent/pending/resolved)
│       ├── CodeButton.tsx                    ← Emergency code selector button
│       ├── CustomButton.tsx                  ← Primary button component
│       ├── EmergencyCodeCard.tsx             ← Active code card on Home screen
│       ├── FeedbackDialog.tsx                ← Success / error / confirm dialog
│       ├── LiveDot.tsx                       ← Animated live indicator dot
│       ├── RequestCard.tsx                   ← Active request card on Home screen
│       ├── Shimmer.tsx                       ← Shimmer loading animation
│       └── skeletons/
│           ├── AlertDetailSkeleton.tsx       ← Alert detail loading skeleton
│           ├── AlertsScreenSkeleton.tsx      ← Alerts list loading skeleton
│           ├── HomeScreenSkeleton.tsx        ← Home screen loading skeleton
│           └── NotificationsSkeleton.tsx     ← Notifications loading skeleton
│
├── constants/
│   ├── codes.ts                              ← Emergency code definitions + getCodeByType()
│   ├── colors.ts                             ← Raw color palette (use via theme, not directly)
│   ├── env.ts                                ← ENV object (USE_MOCK_DATA, API_BASE_URL)
│   ├── mockData.ts                           ← Legacy mock data (do not add new data here)
│   └── theme.ts                             ← Light/dark theme tokens (ThemeColors type)
│
├── contexts/
│   └── AppContext.tsx                        ← Theme + i18n + language (useApp() hook)
│
├── hooks/
│   ├── useAlerts.ts                          ← useAlerts(), useAlertDetail()
│   ├── useColors.ts                          ← useColors() shorthand
│   ├── useHome.ts                            ← useActiveCodes(), useActiveRequests()
│   └── useNotifications.ts                  ← useNotifications()
│
├── types/
│   ├── alert.ts                              ← Alert, AlertDetail, Responder, ActiveCode
│   ├── auth.ts                               ← LoginRequest, LoginResponse, User, etc.
│   └── notification.ts                       ← Notification type
│
├── utils/
│   └── formatTime.ts                         ← formatTime(seconds) → "MM:SS"
│
├── data/                                     ← Data layer (repositories + mocks)
│   ├── api_client.ts                         ← Axios instance (baseURL, auth header, errors)
│   ├── auth_repository.ts                    ← login(), register(), updateDeviceToken()
│   ├── alert_repository.ts                   ← fetchAlerts(), fetchAlertById(), respondToAlert()
│   ├── notification_repository.ts            ← fetchNotifications()
│   └── mock/
│       ├── auth_mock.ts                      ← mockLogin(), mockRegister()
│       ├── alerts_mock.ts                    ← MOCK_ALERTS, mockFetchAlerts(), etc.
│       └── notifications_mock.ts             ← mockFetchNotifications()
│
├── assets/                                   ← Images, fonts, icons
├── app.json                                  ← Expo app config (bundle ID, version, plugins)
├── eas.json                                  ← EAS Build profiles (development/preview/testflight/production)
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
├── AGENTS.md                                 ← This file
└── API_SPEC.md                               ← Backend API contract (→ see section 23)
```

---

## 3. Architecture

### The Three-Layer Rule

```
┌─────────────────────────────────┐
│         SCREEN / COMPONENT       │  ← Renders UI. Calls hooks. No API calls.
├─────────────────────────────────┤
│         REACT QUERY HOOK         │  ← useQuery / useMutation wrapping repository fn
├─────────────────────────────────┤
│         REPOSITORY (data/)       │  ← Checks USE_MOCK_DATA → mock or real API
└─────────────────────────────────┘
```

**Rules:**
- Screens never call APIs or Firebase directly
- All async data goes through a repository in `data/`
- All server state is managed by TanStack React Query
- `useState` is for local UI state only (toggles, form fields, visibility)

---

## 4. Mock ↔ Real API Switching

This is the project's core development pattern. One env variable controls everything.

### How it works

```
.env
├── USE_MOCK_DATA=true    → All repositories return local mock data (no network)
└── USE_MOCK_DATA=false   → All repositories call the real API via api_client.ts
```

### The exact pattern every repository must follow

```typescript
// data/auth_repository.ts

import { ENV } from '../constants/env'          // reads process.env.USE_MOCK_DATA
import { apiClient } from './api_client'
import { mockLogin, mockRegister } from './mock/auth_mock'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  if (ENV.USE_MOCK_DATA) return mockLogin(body)
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body)
  return data
}

export async function register(body: RegisterRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockRegister(body)
  await apiClient.post('/auth/register', body)
}
```

### Mock file shape rule

Mock files must return **the exact same TypeScript type** as the real API would.
A type mismatch in a mock file = a runtime bug when switching to real.

```typescript
// data/mock/auth_mock.ts

import type { LoginRequest, LoginResponse } from '../../types/auth'

export async function mockLogin(body: LoginRequest): Promise<LoginResponse> {
  await delay(600)   // simulate network latency
  return {
    accessToken: 'mock-token-abc',
    user: {
      id: 'user-001',
      name: 'Dr. Waleed',
      role: 'Physician',
      hospital: 'General Hospital',
      email: body.username,
      phone: '+966500000001',
      department: 'Cardiology',
      employeeId: 'EMP-001',
      avatarUrl: null,
    },
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### Switching checklist

| Want to… | Action |
|----------|--------|
| Use mock data | Set `USE_MOCK_DATA=true` in `.env` |
| Use real API | Set `USE_MOCK_DATA=false` and set `API_BASE_URL` |
| Add a new endpoint | Write real fn + mock fn + the `if (ENV.USE_MOCK_DATA)` branch |
| Verify shape matches | TypeScript will catch it — both must return the same type |

> **Do not add new mock data to `constants/mockData.ts`** — that file is legacy.
> All new mock data goes in `data/mock/`.

---

## 5. How to Add a New Feature (Workflow)

Use this workflow for every new screen or data operation. Do not skip steps.

```
1. DEFINE THE TYPE
   └── Add request/response interfaces to types/<domain>.ts

2. WRITE THE MOCK
   └── Add mock function to data/mock/<domain>_mock.ts
       Returns hardcoded data matching the real API shape

3. WRITE THE REPOSITORY
   └── Add function to data/<domain>_repository.ts
       Follows the USE_MOCK_DATA pattern (see section 4)

4. WRITE THE REACT QUERY HOOK (optional, recommended for screens)
   └── Add useQuery or useMutation hook in hooks/use<Domain>.ts
       Wraps the repository function

5. BUILD THE SCREEN
   └── Create screen in app/<route>.tsx
       Uses the hook from step 4
       Handles loading, error, and success states
       Uses theme colors from useApp().colors
       Wraps content in SafeAreaView

6. WIRE ROUTING
   └── Expo Router picks up the file automatically
       Add navigation links from other screens as needed
```

---

## 6. Data Layer — Patterns & Templates

### api_client.ts template

```typescript
// data/api_client.ts

import axios from 'axios'
import { ENV } from '../constants/env'

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach Bearer token on every request
apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken()   // implement with AsyncStorage
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors — throw a readable message, not an Axios object
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'Unknown error'
    throw new Error(message)
  }
)
```

### React Query hook template

```typescript
// hooks/useAlerts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAlerts, respondToAlert } from '../data/alert_repository'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    staleTime: 30_000,
  })
}

export function useRespondToAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => respondToAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
```

### Screen template (loading + error + success)

```typescript
// app/(tabs)/alerts.tsx

import { View, FlatList, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '../../contexts/AppContext'
import { useAlerts } from '../../hooks/useAlerts'

export default function AlertsScreen() {
  const { colors, t } = useApp()
  const { data, isLoading, isError, error, refetch } = useAlerts()

  if (isLoading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )

  if (isError) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.error }}>{error?.message}</Text>
      <CustomButton label={t('common.retry')} onPress={refetch} />
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList data={data} renderItem={({ item }) => <AlertCard alert={item} />} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
```

---

## 7. State Management Decision Tree

```
Is this data from the server / API?
  YES → TanStack React Query (useQuery / useMutation)
  NO  → Is this app-wide state (theme, language, current user)?
          YES → React Context (useApp())
          NO  → Is this form input or local UI toggle?
                  YES → useState
                  NO  → useReducer (for complex local state machines)
```

**Never:**
- `useState` for server data (stale, no caching, no retry)
- Direct `fetch()` / `axios` calls inside components
- Prop-drill more than 2 levels — use Context or co-locate with a hook

---

## 8. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `AlertCard.tsx`, `CustomButton.tsx` |
| Screen files (Expo Router) | kebab-case | `forgot-password.tsx`, `verify-otp.tsx` |
| Hook files | camelCase | `useAlerts.ts`, `useColors.ts` |
| Repository files | snake_case | `auth_repository.ts`, `alert_repository.ts` |
| Mock files | snake_case | `auth_mock.ts`, `alerts_mock.ts` |
| Type/interface files | camelCase | `authTypes.ts`, `alertTypes.ts` |
| Utility files | camelCase | `formatTime.ts`, `parseError.ts` |
| React component names | PascalCase | `export default function AlertCard()` |
| Variables & functions | camelCase | `const alertList`, `function fetchAlerts()` |
| Enums | PascalCase keys | `NotificationType.emergency_alert` |
| Constants | UPPER_SNAKE_CASE | `MAX_OTP_ATTEMPTS` |

---

## 9. Component Rules

- **150 line limit** per file — if exceeded, split by:
  - Sub-components in the same file (private, not exported)
  - A new sibling component file
  - Extracting logic into a `hooks/use<Name>.ts`
- Always wrap page-level screens with `ErrorBoundary`
- Always show **loading**, **error**, and **empty** states — never leave them unhandled
- Error state must include a retry button
- Reusable UI primitives belong in `components/ui/`
- Page-specific components stay in the same folder as their screen

---

## 10. Styling

```typescript
// CORRECT — static styles at bottom of file
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600' },
})

// CORRECT — dynamic theme value merged at render time
<View style={[styles.container, { backgroundColor: colors.background }]} />

// WRONG — never do this
<View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }} />
```

**Rules:**
- `StyleSheet.create()` for all static styles — always at the bottom of the file
- Inline style arrays `[styles.x, { dynamic }]` only for theme/runtime values
- No Tailwind, NativeWind, CSS-in-JS, or plain CSS
- Always use `useApp().colors` — never hardcode hex values in components
- Font sizes and weights should come from theme constants, not magic numbers

---

## 11. Routing & Navigation

- All navigation uses **Expo Router** (file-based)
- Auth screens → `app/(auth)/`
- Main tab screens → `app/(tabs)/`
- Detail screens → `app/<domain>/[id].tsx`
- Navigation calls:

```typescript
import { router } from 'expo-router'

router.push('/alert/123')          // push onto stack
router.replace('/(auth)/login')    // replace current screen
router.back()                      // go back
router.push({ pathname: '/alert/[id]', params: { id: alertId } })
```

- Never use React Navigation APIs directly
- Never use `href` string interpolation without `params` — use the typed params pattern

---

## 12. TypeScript

- All files use TypeScript — `.tsx` for components, `.ts` for logic
- Shared types live in `types/` — one file per domain (`types/auth.ts`, `types/alert.ts`)
- Define explicit interface for every component's props
- No `any` — use `unknown` and narrow with type guards
- Use the `ThemeColors` type from `constants/theme.ts` for theme values
- API response shapes must be typed — never use untyped `response.data`

```typescript
// types/alert.ts
export interface Alert {
  id: string
  title: string
  type: string
  status: 'active' | 'pending' | 'resolved'
  location: string
  timestamp: string
  responders: number
}

export interface AlertDetailParams {
  id: string
}
```

---

## 13. Forms & Validation

- Use `useState` for each form field value
- Validate on submit — not on every keystroke (unless UX requires instant feedback)
- Show validation errors inline, near the relevant field
- Required field checks happen before any navigation or API call

```typescript
const [email, setEmail] = useState('')
const [emailError, setEmailError] = useState('')

function handleSubmit() {
  if (!email.trim()) {
    setEmailError(t('validation.email_required'))
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setEmailError(t('validation.email_invalid'))
    return
  }
  setEmailError('')
  // proceed
}
```

---

## 14. User Feedback & Dialogs

| Situation | Component |
|-----------|-----------|
| Success after action | `FeedbackDialog` (success variant) |
| API error | `FeedbackDialog` (error variant) |
| Destructive action confirmation | `FeedbackDialog` (confirm variant) |
| Quick toast / status | — (not implemented; add if needed) |

**Rules:**
- Never use `Alert.alert()` — always use `FeedbackDialog` from `components/ui/`
- Keep messages short and actionable: "Password updated" not "Your password has been successfully updated"
- Destructive actions (logout, delete account, reject alert) always require a confirmation dialog

---

## 15. Firebase & Push Notifications

### Package map

| Package | Responsibility |
|---------|---------------|
| `@react-native-firebase/app` | Firebase core init |
| `@react-native-firebase/auth` | Google / Apple sign-in |
| `@react-native-firebase/messaging` | FCM token + background handler |
| `expo-notifications` | Local notification display (foreground) |

### Initialization order (`app/_layout.tsx`)

```
1. Firebase.initializeApp()
2. FcmHandler component mounted
3. App content rendered
```

### Notification flow

```
FCM push arrives
  ├── App FOREGROUND → notification_repository shows local notification via expo-notifications
  ├── App BACKGROUND → FCM handles display; onNotificationOpenedApp fires on tap
  └── App CLOSED     → getInitialNotification() fires after cold start
```

### Notification types & navigation

| Type | Navigate to |
|------|------------|
| `general` | No navigation |
| `emergency_alert` | Incoming Alert screen |
| `code_activated` | `/alert/[id]` |
| `responder_assigned` | `/alert/[id]` |
| `alert_resolved` | Alerts tab |

### Token lifecycle

```
Login success
  → fcm_repository.getToken()
  → cache token in AsyncStorage
  → auth_repository.updateDeviceToken(userId, token)

Token refreshed (onTokenRefresh)
  → repeat above
```

### FCM repository responsibilities (`data/fcm_repository.ts`)

1. Request notification permissions (iOS + Android)
2. Get and cache FCM token
3. Send token to backend after login
4. Listen for token refresh and re-send
5. Register background message handler (must be a module-level function, not a closure)

---

## 16. Theme & Internationalization

- All screens access theme via `const { colors, t, isRTL } = useApp()`
- Never import `lightTheme` / `darkTheme` directly in screens
- All user-visible strings use `t('namespace.key')`
- Every translation key must have both **English** and **Arabic** values
- Key format: `<screen>.<element>` → `login.welcome`, `alerts.empty_state`
- RTL layout: use `isRTL` from `useApp()` for conditional flex direction where needed
- Theme + language preference persists via AsyncStorage automatically

---

## 17. Animations

```typescript
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'

// Screen entry animation
<Animated.View entering={FadeInDown.duration(300)}>
  ...
</Animated.View>

// Interactive / value-driven animation
const scale = useSharedValue(1)
const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
```

- Use `react-native-reanimated` for all animations — no `Animated` from React Native core
- `FadeInDown` / `FadeInUp` for screen and list item entrances
- `useSharedValue` + `useAnimatedStyle` for gesture-driven or interactive animations

---

## 18. Platform-Specific Code

```typescript
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Platform check
if (Platform.OS === 'ios') { ... }
if (Platform.OS === 'android') { ... }

// Safe area (always use this — never hardcode status bar height)
const insets = useSafeAreaInsets()
<View style={{ paddingTop: insets.top }} />

// OR wrap entire screen
import { SafeAreaView } from 'react-native-safe-area-context'
<SafeAreaView style={{ flex: 1 }}>...</SafeAreaView>
```

- Always handle notch/status bar via `SafeAreaView` or `useSafeAreaInsets()`
- Never hardcode `paddingTop: 44` or similar values
- Test on both iOS and Android before marking a screen done

---

## 19. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `USE_MOCK_DATA` | Yes | `true` = mock data, `false` = real API |
| `API_BASE_URL` | When `USE_MOCK_DATA=false` | Backend origin, e.g. `https://api.codeconnect.app` |
| `EXPO_PUBLIC_*` prefix | — | Required by Expo for client-accessible env vars |
 
```typescript
// constants/env.ts — single place to read env vars
export const ENV = {
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false',  // defaults to true (mock mode) if unset
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
}
```

- Never hardcode secrets, tokens, or API keys
- Firebase config goes in `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) — do not commit production credentials

---

## 20. Git & Commits

```
feat: add alert detail screen with responder list
fix: resolve FCM token not refreshing on iOS
chore: migrate auth mock data to data/mock/
refactor: extract useAlerts hook from alerts screen
docs: update API_SPEC.md with notifications endpoint
```

- Format: `<type>: <imperative sentence>`
- Types: `feat` `fix` `chore` `refactor` `docs` `style` `test`
- One logical change per commit
- Branch naming: `feature/<short-name>`, `fix/<short-name>`

---

## 21. Flutter → React Native Reference

> This section is a permanent reference. It maps Flutter mental models to this project's patterns.

### Lifecycle

| Flutter | React Native (this project) |
|---------|----------------------------|
| `initState` | `useEffect(() => { ... }, [])` — empty deps = run once on mount |
| `dispose` | Return function from `useEffect`: `return () => subscription.cancel()` |
| `didChangeDependencies` | `useEffect` with the dependency in the array |
| `setState(() {})` | `useState` setter function |
| `build()` called on setState | Component re-renders on state/prop change |

### State management

| Flutter | React Native (this project) |
|---------|----------------------------|
| `Riverpod` / `Provider` for server data | TanStack React Query (`useQuery`) |
| `Riverpod` / `Provider` for app state | React Context (`useApp()`) |
| `StatefulWidget` local state | `useState` / `useReducer` |
| `FutureProvider` / `StreamProvider` | `useQuery` with async `queryFn` |

### Layout

| Flutter | React Native |
|---------|-------------|
| `Column` | `View` with `flexDirection: 'column'` (default) |
| `Row` | `View` with `flexDirection: 'row'` |
| `Expanded` | `flex: 1` on a child `View` |
| `Padding` widget | `padding` style on any View/Text |
| `SizedBox(height: 16)` | `<View style={{ height: 16 }} />` or margin |
| `Scaffold` | `SafeAreaView` + `View` layout |
| `ListView.builder` | `FlatList` with `renderItem` |
| `Stack` | `View` with `position: 'absolute'` children |

### Navigation

| Flutter | React Native (Expo Router) |
|---------|---------------------------|
| `Navigator.push(context, route)` | `router.push('/path')` |
| `Navigator.pushReplacement` | `router.replace('/path')` |
| `Navigator.pop` | `router.back()` |
| Named routes | File-based routes (file name = path) |
| Route arguments | `params` in Expo Router |

### Platform

| Flutter | React Native |
|---------|-------------|
| `Platform.isAndroid` | `Platform.OS === 'android'` |
| `Platform.isIOS` | `Platform.OS === 'ios'` |
| `SafeArea` widget | `SafeAreaView` from `react-native-safe-area-context` |

---

## 22. Brand & Design Tokens

| Token | Value |
|-------|-------|
| Primary color | `#2daaae` (teal) |
| Font family | Inter |
| Font weights | 400 Regular, 500 Medium, 600 SemiBold, 700 Bold |
| Border radius (cards, buttons) | 12–16px |
| Logo | `assets/images/logo.jpeg` (Emdad Arabia) |
| App icon | `assets/images/ic_launcher.png` |

All colors come from `useApp().colors` — never reference hex values directly in components.

---

## 23. Backend API Contract

The full backend API specification lives in **`API_SPEC.md`** at the workspace root.
That document is the contract between the mobile app and the backend team.

**Key points for frontend work:**

- All endpoints live under `/api/` prefix
- Auth: `Authorization: Bearer <token>` header (obtained after login)
- All timestamps: ISO 8601 strings (`"2024-01-15T10:30:00Z"`)
- All IDs: strings (UUIDs)
- Error shape: `{ message: string, code?: string }`
- The mock data in `data/mock/` must match the shapes in `API_SPEC.md` exactly
- Do not reference `artifacts/`, `api-server`, `mockup-sandbox`, or `lib/api-spec` — they are removed from this project

**When the real API is ready:**
1. Set `USE_MOCK_DATA=false` and `API_BASE_URL=<real URL>` in `.env`
2. Run the app — every repository automatically switches to real calls
3. If TypeScript shows no errors, shapes are compatible
