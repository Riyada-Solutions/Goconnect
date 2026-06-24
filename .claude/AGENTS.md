# AGENTS.md — Goconnect Architecture & Engineering Guide

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
10. [Styling & Theme](#10-styling--theme)
11. [Routing & Navigation](#11-routing--navigation)
12. [TypeScript](#12-typescript)
13. [Forms & Validation](#13-forms--validation)
14. [User Feedback & Dialogs](#14-user-feedback--dialogs)
15. [Firebase & Push Notifications](#15-firebase--push-notifications)
16. [Theme & Internationalization](#16-theme--internationalization)
17. [Animations](#17-animations)
18. [Platform-Specific Code](#18-platform-specific-code)
19. [Environment Variables](#19-environment-variables)
20. [RBAC — Role-Based Access Control](#20-rbac--role-based-access-control)
21. [Git & Commits](#21-git--commits)
22. [Brand & Design Tokens](#22-brand--design-tokens)
23. [Backend API Contract](#23-backend-api-contract)

---

## 1. Project Overview

**Goconnect** is a nursing / home-care workflow mobile app built with **Expo / React Native**.
Nurses can manage patients, schedule and conduct visits, submit clinical flow-sheet data,
write progress notes, view lab results, and receive push notifications.

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
| Bundle ID | `com.careconnectksa.nurse` |
| App scheme | `goconnect` |
| Backend API spec | `API_SPEC.md` |

> All file creation, editing, and navigation work happens at the **project root** (`/`).

---

## 2. Repository Layout

```
/                                               ← project root — THE MOBILE APP lives here
│
├── app/                                        ← Expo Router screens (file = route)
│   ├── _layout.tsx                             ← Root layout (fonts, QueryClient, AppProvider)
│   ├── index.tsx                               ← Entry redirect (→ biometric-unlock or tabs)
│   ├── +not-found.tsx                          ← 404 screen
│   ├── biometric-unlock.tsx                    ← Face ID / fingerprint lock screen
│   ├── notifications.tsx                       ← Notifications list screen
│   ├── (auth)/                                 ← Unauthenticated screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── otp.tsx                             ← OTP verification
│   │   ├── forgot-password.tsx
│   │   └── new-password.tsx
│   ├── (tabs)/                                 ← Authenticated tab screens
│   │   ├── _layout.tsx                         ← Tab bar (Home, Patients, Schedule, Visits)
│   │   ├── home.tsx                            ← Dashboard / home tab
│   │   ├── patients.tsx                        ← Patients list tab
│   │   ├── scheduler.tsx                       ← Appointments / schedule tab
│   │   └── visits.tsx                          ← Visits list tab
│   ├── (settings)/                             ← Settings group (modal presentation)
│   │   ├── _layout.tsx
│   │   ├── index.tsx                           ← Settings menu
│   │   ├── profile.tsx                         ← View profile
│   │   ├── edit-profile.tsx                    ← Edit profile
│   │   ├── change-password.tsx
│   │   ├── delete-account.tsx
│   │   ├── about.tsx
│   │   ├── privacy.tsx
│   │   ├── terms.tsx
│   │   ├── notifications.tsx                   ← Notification preferences
│   │   ├── help-support.tsx
│   │   └── app-settings.tsx                    ← Theme, language, biometric toggle
│   ├── patients/
│   │   └── [id].tsx                            ← Patient detail screen
│   ├── visits/
│   │   ├── [id].tsx                            ← Visit detail screen
│   │   ├── visit-detail.styles.ts              ← StyleSheet for visit detail
│   │   └── components/                         ← Visit-specific sub-components
│   │       ├── CollapsibleHeader.tsx
│   │       ├── CollapsibleBody.tsx
│   │       ├── FormField.tsx
│   │       ├── Acc.tsx
│   │       ├── VisitDetailSkeleton.tsx
│   │       ├── VisitDetailStates.tsx
│   │       ├── VisitDetailTopBar.tsx
│   │       ├── VisitInfoCard.tsx
│   │       ├── NurseSignatureSheet.tsx
│   │       ├── RadioOption.tsx
│   │       ├── forms/                          ← Individual flow-sheet form components
│   │       │   ├── VitalsForm.tsx
│   │       │   ├── MachinesForm.tsx
│   │       │   ├── PainForm.tsx
│   │       │   ├── FallRiskForm.tsx
│   │       │   ├── NursingActionForm.tsx
│   │       │   ├── DialysisParamsForm.tsx
│   │       │   ├── AlarmsTestForm.tsx
│   │       │   ├── IntakeOutputForm.tsx
│   │       │   ├── CarForm.tsx
│   │       │   ├── AccessForm.tsx
│   │       │   ├── DialysateForm.tsx
│   │       │   ├── AnticoagForm.tsx
│   │       │   ├── DialysisMedsForm.tsx
│   │       │   ├── PostTreatmentForm.tsx
│   │       │   └── OutsideDialysisForm.tsx
│   │       └── visitForms/                     ← High-level visit workflow forms
│   │           ├── FlowSheetForm.tsx
│   │           ├── PatientHero.tsx
│   │           ├── PatientAlertsCard.tsx
│   │           ├── PatientInventorySection.tsx
│   │           ├── PatientSignatureSheet.tsx
│   │           ├── CheckOutConfirmModal.tsx
│   │           ├── PhysicianCallModal.tsx
│   │           ├── ReadOnlyBanner.tsx
│   │           ├── UseItemsModal.tsx
│   │           ├── WorkflowActionButtons.tsx
│   │           ├── MorseFallScaleSheet.tsx
│   │           ├── SariScreeningForm.tsx
│   │           ├── ReferralForm.tsx
│   │           ├── RefusalForm.tsx
│   │           ├── ProgressNoteItem.tsx
│   │           ├── ProgressNoteGroup.tsx
│   │           ├── DoctorProgressNoteForm.tsx
│   │           ├── NursingProgressNoteForm.tsx
│   │           ├── SocialWorkerProgressNoteForm.tsx
│   │           └── refusal/
│   │               ├── RefusalMainSection.tsx
│   │               ├── PartyInfoSection.tsx
│   │               └── SignatureConfirmSheet.tsx
│   ├── lab-results/
│   │   └── [patientId].tsx                     ← Lab results for a patient
│   └── appointments/
│       └── [id].tsx                            ← Appointment detail screen
│
├── components/
│   ├── ErrorBoundary.tsx                       ← Root-level re-export
│   ├── ErrorFallback.tsx
│   ├── KeyboardAwareScrollViewCompat.tsx
│   ├── common/                                 ← Reusable UI primitives
│   │   ├── ActionButton.tsx
│   │   ├── Avatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Card.tsx
│   │   ├── CareTeamView.tsx
│   │   ├── CustomButton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   ├── ErrorState.tsx
│   │   ├── HRSwitch.tsx
│   │   ├── KeyboardAwareScrollViewCompat.tsx
│   │   ├── PaginationList.tsx
│   │   ├── PatientCard.tsx
│   │   ├── RuleGate.tsx                        ← RBAC wrapper component
│   │   ├── ScreenBackground.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SplashView.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ThemedText.tsx
│   │   ├── ThemedView.tsx
│   │   └── WorkspaceSheet.tsx
│   ├── skeletons/                              ← Loading skeleton components
│   │   ├── AppointmentDetailSkeleton.tsx
│   │   ├── LabResultCardSkeleton.tsx
│   │   ├── ListSkeleton.tsx
│   │   ├── PatientCardSkeleton.tsx
│   │   ├── PatientDetailSkeleton.tsx
│   │   ├── SlotCardSkeleton.tsx
│   │   ├── VisitCardSkeleton.tsx
│   │   └── index.ts
│   └── ui/                                     ← Specialized form-field UI
│       ├── CheckboxField.tsx
│       ├── ClickToSignButton.tsx
│       ├── DateTimeField.tsx
│       ├── FeedbackDialog.tsx
│       ├── GuestWall.tsx
│       ├── SelectField.tsx
│       ├── Shimmer.tsx
│       ├── SignatureField.tsx
│       └── SignaturePad.tsx
│
├── context/
│   └── AppContext.tsx                          ← Auth + theme + i18n + rules (useApp() hook)
│
├── config/
│   └── i18n.ts                                ← Translation strings (en + ar)
│
├── hooks/
│   ├── useAuth.ts                             ← useLogin(), useLogout(), useRegister(), etc.
│   ├── useColors.ts                           ← Shorthand color access
│   ├── useDebounce.ts
│   ├── useHome.ts                             ← useHome()
│   ├── useLabResults.ts                       ← useLabResults()
│   ├── useMachines.ts
│   ├── useNotificationPreferences.ts
│   ├── useNotifications.ts
│   ├── usePatients.ts
│   ├── usePullToRefresh.ts
│   ├── useRuleGuard.ts                        ← Programmatic RBAC guard hook
│   ├── useRules.ts
│   ├── useScheduler.ts
│   ├── useScreenPadding.ts
│   ├── useSignatureUpload.ts
│   ├── useSupport.ts
│   ├── useTheme.ts                            ← Theme access hook
│   ├── useVisitTimers.ts
│   ├── useVisits.ts
│   ├── useWorkspace.ts
│   └── useAttachmentUpload.ts
│
├── data/                                      ← Data layer (repositories + mocks + models)
│   ├── api_client.ts                          ← Axios instance (auth, lang, version headers)
│   ├── auth_repository.ts
│   ├── home_repository.ts
│   ├── patient_repository.ts
│   ├── visit_repository.ts
│   ├── scheduler_repository.ts
│   ├── labResult_repository.ts
│   ├── notification_repository.ts
│   ├── rules_repository.ts                    ← GET /me/rules
│   ├── support_repository.ts
│   ├── settings_repository.ts
│   ├── app_settings_repository.ts
│   ├── signature_repository.ts
│   ├── attachment_repository.ts
│   ├── machines_repository.ts
│   ├── secure_storage.ts                      ← Face token (expo-secure-store)
│   ├── upload_config.ts                       ← Upload API base URL (set from appSettings)
│   ├── transform/
│   │   └── disOfHemodialysis.ts
│   ├── models/                                ← TypeScript types (replaces /types)
│   │   ├── auth.ts
│   │   ├── patient.ts
│   │   ├── visit.ts
│   │   ├── home.ts
│   │   ├── scheduler.ts
│   │   ├── notification.ts
│   │   ├── notificationPreferences.ts
│   │   ├── labResult.ts
│   │   ├── machine.ts
│   │   ├── careTeam.ts
│   │   ├── workspace.ts
│   │   ├── pagination.ts
│   │   ├── flowSheet.ts
│   │   ├── nursingProgressNote.ts
│   │   ├── doctorProgressNote.ts
│   │   ├── socialWorkerProgressNote.ts
│   │   ├── sariScreening.ts
│   │   ├── referral.ts
│   │   ├── refusal.ts
│   │   ├── morseFallsRisk.ts
│   │   ├── support.ts
│   │   └── rules.ts                           ← RuleAction, BackendRule, FE_RULE_TO_BACKEND
│   └── mock/
│       ├── auth_mock.ts
│       ├── home_mock.ts
│       ├── patients_mock.ts
│       ├── visits_mock.ts
│       ├── scheduler_mock.ts
│       ├── labResults_mock.ts
│       ├── notifications_mock.ts
│       ├── rules_mock.ts
│       ├── support_mock.ts
│       └── settings_mock.ts
│
├── theme/                                     ← Design tokens
│   ├── colors.ts                              ← Colors object (light/dark/primary/etc.)
│   ├── spacing.ts                             ← Spacing constants
│   └── index.ts                              ← Re-exports Colors, Spacing, useTheme, useScreenPadding
│
├── constants/
│   └── env.ts                                 ← ENV object (USE_MOCK_DATA, API_BASE_URL, etc.)
│
├── utils/
│   ├── biometric.ts
│   ├── datetime.ts
│   ├── firebase.ts
│   ├── logger.ts
│   ├── time.ts
│   └── workspace.ts
│
├── assets/                                    ← Images, fonts, icons
├── app.json                                   ← Expo app config
├── eas.json                                   ← EAS Build profiles
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── package.json
├── AGENTS.md                                  ← This file
└── API_SPEC.md                                ← Backend API contract
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
- All types/interfaces live in `data/models/` — never in `types/`

---

## 4. Mock ↔ Real API Switching

One env variable controls everything.

### How it works

```
.env
├── EXPO_PUBLIC_USE_MOCK_DATA=false  → USE_MOCK_DATA = true  → mock data (no network)
└── (not set / any other value)      → USE_MOCK_DATA = false → real API
```

> **Note:** The check in `constants/env.ts` is `=== 'false'` (string comparison).
> Setting the variable to the string `'false'` enables mock mode; anything else uses real API.

### The exact pattern every repository must follow

```typescript
// data/visit_repository.ts

import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockFetchVisits } from './mock/visits_mock'
import type { Visit } from './models/visit'

export async function fetchVisits(): Promise<Visit[]> {
  if (ENV.USE_MOCK_DATA) return mockFetchVisits()
  const { data } = await apiClient.get<{ data: Visit[] }>('/visits')
  return data.data
}
```

### Mock file shape rule

Mock files must return **the exact same TypeScript type** as the real API would.
A type mismatch in a mock file = a runtime bug when switching to real.

```typescript
// data/mock/visits_mock.ts

import type { Visit } from '../models/visit'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function mockFetchVisits(): Promise<Visit[]> {
  await delay(600)
  return [
    { id: 'v-001', patientName: 'John Doe', ... },
  ]
}
```

### Switching checklist

| Want to… | Action |
|----------|--------|
| Use mock data | Set `EXPO_PUBLIC_USE_MOCK_DATA=false` in `.env` |
| Use real API | Remove or set to any other value; set `EXPO_PUBLIC_API_BASE_URL` |
| Add a new endpoint | Write real fn + mock fn + `if (ENV.USE_MOCK_DATA)` branch |
| Verify shape matches | TypeScript will catch it — both must return the same type |

> All new mock data goes in `data/mock/`. Do not add mock data to `constants/mockData.ts`.

---

## 5. How to Add a New Feature (Workflow)

Use this workflow for every new screen or data operation. Do not skip steps.

```
1. DEFINE THE TYPE
   └── Add request/response interfaces to data/models/<domain>.ts

2. WRITE THE MOCK
   └── Add mock function to data/mock/<domain>_mock.ts
       Returns hardcoded data matching the real API shape

3. WRITE THE REPOSITORY
   └── Add function to data/<domain>_repository.ts
       Follows the USE_MOCK_DATA pattern (see section 4)

4. WRITE THE REACT QUERY HOOK
   └── Add useQuery or useMutation hook in hooks/use<Domain>.ts
       Wraps the repository function

5. BUILD THE SCREEN
   └── Create screen in app/<route>.tsx
       Uses the hook from step 4
       Handles loading, error, and success states
       Uses Colors from theme/colors.ts + isDark from useApp()
       Wraps content in SafeAreaView
       Gates restricted actions with can() or <RuleGate>

6. WIRE ROUTING
   └── Expo Router picks up the file automatically
       Register the screen in app/_layout.tsx Stack if needed
       Add navigation links from other screens as needed
```

---

## 6. Data Layer — Patterns & Templates

### api_client.ts

The Axios instance sends these headers on every request:
- `Authorization: Bearer <token>` (from AsyncStorage)
- `Accept-Language` / `X-Lang` (from stored language preference)
- `X-App-Version` / `Version` (from `expo-constants`)
- `X-Platform` (`ios` or `android`)

Laravel 422 validation errors are parsed: field-level messages are extracted and appended to the error `message` so they surface in FeedbackDialog. The error object also carries `.status` and `.fieldErrors` for per-field UI mapping.

### React Query hook template

```typescript
// hooks/useVisits.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchVisits, startVisit } from '../data/visit_repository'

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: fetchVisits,
    staleTime: 30_000,
  })
}

export function useStartVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (visitId: string) => startVisit(visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}
```

### Screen template (loading + error + success)

```typescript
// app/(tabs)/visits.tsx

import { View, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '@/context/AppContext'
import { Colors } from '@/theme/colors'
import { useVisits } from '@/hooks/useVisits'
import { CustomButton } from '@/components/common/CustomButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ListSkeleton } from '@/components/skeletons'

export default function VisitsScreen() {
  const { isDark, t } = useApp()
  const bg = isDark ? Colors.dark.background : Colors.light.background
  const { data, isLoading, isError, error, refetch } = useVisits()

  if (isLoading) return <ListSkeleton />

  if (isError) return (
    <View style={[styles.center, { backgroundColor: bg }]}>
      <CustomButton label={t('common.retry')} onPress={refetch} />
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <VisitCard visit={item} />}
        ListEmptyComponent={<EmptyState />}
      />
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
  NO  → Is this app-wide state (auth, theme, language, rules)?
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
| Component files | PascalCase | `PatientCard.tsx`, `CustomButton.tsx` |
| Screen files (Expo Router) | kebab-case | `forgot-password.tsx`, `app-settings.tsx` |
| Hook files | camelCase | `useVisits.ts`, `usePatients.ts` |
| Repository files | snake_case | `visit_repository.ts`, `patient_repository.ts` |
| Mock files | snake_case | `visits_mock.ts`, `patients_mock.ts` |
| Model/type files | camelCase | `visit.ts`, `auth.ts` (in `data/models/`) |
| Utility files | camelCase | `datetime.ts`, `logger.ts` |
| React component names | PascalCase | `export default function PatientCard()` |
| Variables & functions | camelCase | `const visitList`, `function fetchVisits()` |
| Constants | UPPER_SNAKE_CASE | `ACCESS_TOKEN_KEY` |

---

## 9. Component Rules

- **150 line limit** per file — if exceeded, split by:
  - Sub-components in the same file (private, not exported)
  - A new sibling component file
  - Extracting logic into a `hooks/use<Name>.ts`
- Always wrap page-level screens with `ErrorBoundary`
- Always show **loading**, **error**, and **empty** states — never leave them unhandled
- Error state must include a retry button
- Reusable UI primitives belong in `components/common/`
- Form-field UI primitives belong in `components/ui/`
- Skeleton components belong in `components/skeletons/`
- Page-specific components stay in a `components/` folder next to their screen (e.g. `app/visits/components/`)

---

## 10. Styling & Theme

```typescript
// CORRECT — static styles at bottom of file
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
})

// CORRECT — dynamic theme value merged at render time
const { isDark } = useApp()
const bg = isDark ? Colors.dark.background : Colors.light.background
<View style={[styles.container, { backgroundColor: bg }]} />

// WRONG — never do this
<View style={{ flex: 1, backgroundColor: '#2DAAAE', padding: 16 }} />
```

**Rules:**
- `StyleSheet.create()` for all static styles — always at the bottom of the file
- Inline style arrays `[styles.x, { dynamic }]` only for theme/runtime values
- No Tailwind, NativeWind, CSS-in-JS, or plain CSS
- Always use `Colors` from `@/theme/colors` — never hardcode hex values in components
- Use `isDark` from `useApp()` to pick `Colors.dark.*` vs `Colors.light.*`
- Font families: `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`

---

## 11. Routing & Navigation

- All navigation uses **Expo Router** (file-based)
- Auth screens → `app/(auth)/`
- Main tab screens → `app/(tabs)/`
- Settings screens → `app/(settings)/` (modal)
- Detail screens → `app/<domain>/[id].tsx`
- Navigation calls:

```typescript
import { router } from 'expo-router'

router.push('/patients/123')                           // push onto stack
router.push({ pathname: '/visits/[id]', params: { id: visitId } })
router.replace('/(auth)/login')                        // replace current screen
router.back()                                          // go back
```

- Never use React Navigation APIs directly
- Never use `href` string interpolation without `params` — use the typed params pattern
- `(settings)` is registered as a `modal` in `app/_layout.tsx` — navigate to it with `router.push('/(settings)')`

---

## 12. TypeScript

- All files use TypeScript — `.tsx` for components, `.ts` for logic
- Shared types live in `data/models/` — one file per domain
- Define explicit interface for every component's props
- No `any` — use `unknown` and narrow with type guards
- API response shapes must be typed — never use untyped `response.data`
- Import types from `data/models/`, not from `types/` (that folder is removed)

```typescript
// data/models/visit.ts
export interface Visit {
  id: string
  patientName: string
  status: 'pending' | 'in_progress' | 'completed'
  scheduledAt: string   // ISO 8601
  address: string
}
```

---

## 13. Forms & Validation

- Use `useState` for each form field value
- Validate on submit — not on every keystroke (unless UX requires instant feedback)
- Show validation errors inline, near the relevant field
- Required field checks happen before any navigation or API call
- Use `components/ui/` form primitives: `SelectField`, `CheckboxField`, `DateTimeField`, `SignatureField`

```typescript
const [note, setNote] = useState('')
const [noteError, setNoteError] = useState('')

function handleSubmit() {
  if (!note.trim()) {
    setNoteError(t('validation.field_required'))
    return
  }
  setNoteError('')
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

**Rules:**
- Never use `Alert.alert()` — always use `FeedbackDialog` from `components/ui/`
- Keep messages short and actionable
- Destructive actions (logout, delete account) always require a confirmation dialog

---

## 15. Firebase & Push Notifications

### Package map

| Package | Responsibility |
|---------|---------------|
| `@react-native-firebase/app` | Firebase core init |
| `@react-native-firebase/messaging` | FCM token + background handler |
| `expo-notifications` | Local notification display (foreground) |

### Token lifecycle

```
Login success
  → get FCM token
  → cache token in AsyncStorage (@goconnect/fcm_token)
  → auth_repository.registerDevice({ fcm_token, device_type })

App open (token exists in storage)
  → syncDeviceWithProfile() called from AppContext on init
```

---

## 16. Theme & Internationalization

- All screens access auth/theme/i18n via `const { user, isDark, t, can } = useApp()`
- Never import `Colors` directly in screens without also using `isDark` to select the correct variant
- All user-visible strings use `t('key')` — keys are defined in `config/i18n.ts`
- Every translation key must have both **English** and **Arabic** values
- RTL: `I18nManager.forceRTL` is called automatically on language switch — no manual `isRTL` checks needed in most cases
- Theme + language preference persists via AsyncStorage automatically

```typescript
// Correct theme usage in a screen
const { isDark, t } = useApp()
const colors = isDark ? Colors.dark : Colors.light

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>{t('visits.title')}</Text>
</View>
```

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
- Tab bar uses `BlurView` on iOS, solid color on Android

---

## 19. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_USE_MOCK_DATA` | No | Set to `'false'` to enable mock mode |
| `EXPO_PUBLIC_API_BASE_URL` | When using real API | Backend base URL |
| `EXPO_PUBLIC_SIGNATURE_API_BASE_URL` | When using real API | Signature/upload service URL |

```typescript
// constants/env.ts
export const ENV = {
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'false',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  SIGNATURE_API_BASE_URL: process.env.EXPO_PUBLIC_SIGNATURE_API_BASE_URL ?? '',
}
```

- Never hardcode secrets, tokens, or API keys
- Firebase config goes in `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) — do not commit production credentials
- Upload base URL is also set dynamically at runtime from `appSettings.uploadMediaUrl` (fetched from backend on app start)

---

## 20. RBAC — Role-Based Access Control

The app fetches the user's permitted action keys from `GET /me/rules` on login and app start.
These are stored in `AppContext` and used to gate UI elements.

### Checking permissions

```typescript
// In any component or screen
const { can } = useApp()

// Gate a button
{can('submit_nursing_progress_note') && <CustomButton ... />}

// Gate an entire section
<RuleGate action="view_lab_results">
  <LabResultsSection />
</RuleGate>

// Programmatic guard in a hook
const guard = useRuleGuard()
guard('start_visit')  // throws / redirects if not allowed
```

### Key files

| File | Purpose |
|------|---------|
| `data/models/rules.ts` | `RuleAction` type, `BackendRule` constants, `FE_RULE_TO_BACKEND` mapping |
| `data/rules_repository.ts` | `getRules()` → calls `GET /me/rules` |
| `hooks/useRules.ts` | React Query wrapper around `getRules()` |
| `hooks/useRuleGuard.ts` | Imperative guard hook |
| `components/common/RuleGate.tsx` | Declarative wrapper component |
| `context/AppContext.tsx` | `can()` function + `rules` Set |

### Rules behavior

- Backend returns a flat `string[]` of granted rule keys
- Empty array from backend = super-admin / all allowed (`allowAll = true`)
- FE `RuleAction` keys (snake_case) are mapped to backend keys via `FE_RULE_TO_BACKEND`
- Pure UI actions (theme, language, biometrics, logout) are **not mapped** → always allowed
- Use `BackendRule.*` constants (not raw strings) when checking backend-specific keys directly

---

## 21. Git & Commits

```
feat: add visit flow-sheet post-treatment form
fix: resolve FCM token not refreshing on app open
chore: migrate models to data/models/
refactor: extract useVisitTimers hook from visit detail screen
docs: update API_SPEC.md with rules endpoint
```

- Format: `<type>: <imperative sentence>`
- Types: `feat` `fix` `chore` `refactor` `docs` `style` `test`
- One logical change per commit
- Branch naming: `feature/<short-name>`, `fix/<short-name>`

---

## 22. Brand & Design Tokens

| Token | Value |
|-------|-------|
| Primary color | `#2DAAAE` (teal) |
| Font family | Inter |
| Font weights | 400 Regular, 500 Medium, 600 SemiBold, 700 Bold |
| Border radius (cards, buttons) | 12–16px |
| App icon | `assets/images/icon.png` |
| Adaptive icon (Android) | `assets/images/adaptive-icon.png` |
| Splash icon | `assets/images/splash-icon.png` |

All dynamic colors come from `Colors.dark.*` / `Colors.light.*` via `isDark` from `useApp()`.
Never reference hex values directly in component files.

---

## 23. Backend API Contract

The full backend API specification lives in **`API_SPEC.md`** at the workspace root.

**Key points for frontend work:**

- All endpoints live under `/api/` prefix (set as `baseURL` in api_client)
- Auth: `Authorization: Bearer <token>` header (stored in AsyncStorage after login)
- Language: `Accept-Language` / `X-Lang` headers sent automatically
- All timestamps: ISO 8601 strings (`"2024-01-15T10:30:00Z"`)
- All IDs: strings (UUIDs)
- Success response wrapper: `{ data: <payload> }` — unwrap with `res.data.data`
- Error shape: `{ message: string, errors?: Record<string, string[]> }` (Laravel standard)
- The mock data in `data/mock/` must match the shapes in `API_SPEC.md` exactly
- Rules endpoint: `GET /me/rules` → `{ rules: string[] }`

**When the real API is ready:**
1. Remove `EXPO_PUBLIC_USE_MOCK_DATA=false` (or set it to any other value) in `.env`
2. Set `EXPO_PUBLIC_API_BASE_URL=<real URL>` in `.env`
3. Run the app — every repository automatically switches to real calls
4. If TypeScript shows no errors, shapes are compatible
