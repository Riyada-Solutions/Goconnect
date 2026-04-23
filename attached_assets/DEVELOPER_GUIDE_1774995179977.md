# GoConnect — Developer Guide

## Overview

GoConnect is a healthcare management mobile application built with **Expo React Native** (SDK 54) and **Expo Router v6** (file-based routing). It targets iOS, Android, and Web platforms.

- **Backend API**: `staging.goconnect.com`
- **Bundle ID (iOS)**: `com.riyadasolutions.goconnect`
- **Package (Android)**: `com.riyadasolutions.goconnect`
- **Apple Team ID**: `N3R8MF955Y`
- **Design System**: Light gray background (`#F5F6FA`), teal primary (`#2DAAAE`), Inter font family, white rounded cards.

---

## Prerequisites

| Tool   | Version         |
| ------ | --------------- |
| Node.js | v20+ (v24 used in CI) |
| pnpm   | v9+             |
| Expo CLI | Included via `pnpm exec expo` |

> **Important:** This project uses **pnpm** exclusively. Running `npm install` or `yarn install` will fail due to a preinstall guard.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Riyada-Solutions/goconnect_nurse.git
cd goconnect_nurse
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Set the following environment variables (or create an `.env` file at the project root):

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `EXPO_PUBLIC_DOMAIN` | API domain for the app | `staging.goconnect.com` |

On Replit these are set automatically via the workflow command.

### 4. Start the Dev Server

```bash
pnpm run dev
```

This starts the Expo development server. The app is accessible via:
- **Web**: `http://localhost:18115`
- **iOS/Android**: Scan the QR code with Expo Go

### 5. Login Credentials (Staging)

| Username | Password |
| -------- | -------- |
| `super-admin` | `Admin_123456` |

---

## Project Structure

```
goconnect_nurse/
├── app/                          # Expo Router pages (thin wrappers)
│   ├── _layout.tsx               # Root layout (providers, fonts, splash)
│   ├── index.tsx                 # Entry redirect
│   ├── +not-found.tsx            # 404 page
│   ├── (auth)/                   # Auth group (login screen)
│   ├── (tabs)/                   # Main tab navigator (home, patients, visits, settings)
│   ├── (settings)/               # Settings sub-screens (profile, edit-profile, etc.)
│   ├── patients/                 # Patient detail screens
│   ├── visits/                   # Visit detail screens
│   ├── appointments/             # Appointment screens
│   └── notifications.tsx         # Notifications screen
│
├── src/                          # All source code
│   ├── features/                 # Feature modules
│   │   ├── auth/                 # Authentication
│   │   │   ├── screens/          # LoginScreen
│   │   │   ├── services/         # AuthRepository, tokenStorage
│   │   │   └── domain/           # Entities, repository interface
│   │   ├── home/                 # Dashboard / Home
│   │   │   └── screens/          # HomeScreen
│   │   ├── patients/             # Patient management
│   │   │   ├── screens/          # PatientsList, PatientDetail, etc.
│   │   │   └── services/         # Patient API calls
│   │   ├── visits/               # Visit management
│   │   │   ├── screens/          # VisitsList, VisitDetail, etc.
│   │   │   └── services/         # Visit API calls
│   │   ├── scheduler/            # Appointment scheduler
│   │   │   └── screens/          # SchedulerScreen
│   │   └── settings/             # Settings & Profile
│   │       └── screens/          # SettingsScreen, ProfileScreen, etc.
│   │
│   ├── components/common/        # Shared UI components
│   │   ├── ActionButton.tsx
│   │   ├── Avatar.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SearchBar.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ...
│   │
│   ├── services/                 # Shared services
│   │   ├── api/                  # HTTP client setup
│   │   ├── i18n/                 # Internationalization
│   │   └── storage/              # AsyncStorage wrappers
│   │
│   ├── context/                  # React Context providers
│   │   └── AppContext.tsx         # Global app state (user, theme, language)
│   │
│   ├── hooks/                    # Custom hooks
│   │   └── useTheme.ts           # Theme hook (light/dark/system)
│   │
│   ├── theme/                    # Design tokens
│   │   └── colors.ts             # Color palette, light/dark themes
│   │
│   ├── config/                   # App configuration
│   │   └── i18n.ts               # Translation strings (EN/AR)
│   │
│   └── assets/                   # Static assets
│       ├── fonts/                # Inter font files
│       └── images/               # Icons, splash, etc.
│
├── lib/                          # Workspace packages (pnpm monorepo)
│   ├── api-client-react/         # Generated API client + React Query hooks
│   ├── api-spec/                 # OpenAPI specification
│   ├── api-zod/                  # Zod schemas from API spec
│   └── db/                       # Database schemas (Drizzle ORM)
│
├── api-server/                   # Express API server (proxy/BFF)
│
├── app.json                      # Expo configuration
├── metro.config.js               # Metro bundler config
├── tsconfig.json                 # TypeScript config
├── pnpm-workspace.yaml           # pnpm workspace definition
└── package.json                  # Root package (scripts, dependencies)
```

---

## Architecture

### Routing

The app uses **Expo Router v6** with file-based routing. Route files live in `app/` at the project root. Each route file is a thin wrapper that imports and re-exports the actual screen from `src/features/`.

```tsx
// app/(tabs)/home.tsx — thin wrapper example
export { default } from "@/features/home/screens/HomeScreen";
```

### Path Alias

`@/` is aliased to `./src/*` (configured in `tsconfig.json`). Use it for all imports from within `src/`:

```tsx
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
```

### State Management

- **AppContext** (`src/context/AppContext.tsx`): Global state for user session, theme (light/dark/system), and language (EN/AR).
- **React Query** (`@tanstack/react-query`): Server state management for API calls.
- **AsyncStorage**: Persistent storage for auth tokens, theme, and language preferences.

### Theming

- Light and dark themes defined in `src/theme/colors.ts`
- `useTheme()` hook provides current colors based on user preference
- Design follows HR-Mobile style: `#F5F6FA` background, `#2DAAAE` primary teal, white rounded cards

### Internationalization

- English and Arabic supported
- Translations in `src/config/i18n.ts`
- RTL layout support for Arabic via `I18nManager`
- Access via `const { t } = useApp()` → `t("keyName")`

---

## Key Conventions

### Adding a New Feature

1. Create the feature folder: `src/features/<feature-name>/`
2. Add screens: `src/features/<feature-name>/screens/`
3. Add services: `src/features/<feature-name>/services/`
4. Create route wrapper in `app/`: re-export the screen
5. Register navigation (tab, stack, etc.) in the appropriate layout file

### Component Standards

- **Action buttons**: 42×42px, `borderRadius: 12`, `backgroundColor: '#E6F7F9'`, Feather icon size 18
- **Cards**: White background, `borderRadius: 16`, subtle shadow
- **Fonts**: Inter (400 Regular, 500 Medium, 600 SemiBold, 700 Bold)
- **Animations**: `react-native-reanimated` with `FadeInDown.springify()` patterns

### Screen Template

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";

export default function MyScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

---

## Building for Production

### EAS Build (iOS/Android)

```bash
# Install EAS CLI
pnpm add -g eas-cli

# Configure (first time)
eas build:configure

# Build for iOS (TestFlight)
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

### Web Build

```bash
pnpm exec expo export --platform web
```

---

## API Server

A local Express-based API server (BFF) runs at port 3000. It's in `api-server/` and acts as a proxy/backend-for-frontend layer.

```bash
# Start API server separately
PORT=3000 pnpm --filter @workspace/api-server run dev
```

---

## Workspace Packages

This is a **pnpm monorepo**. Shared packages live in `lib/`:

| Package | Purpose |
| ------- | ------- |
| `@workspace/api-client-react` | Auto-generated API client with React Query hooks |
| `@workspace/api-spec` | OpenAPI specification |
| `@workspace/api-zod` | Zod validation schemas from API spec |
| `@workspace/db` | Drizzle ORM database schemas |

### Type Checking

```bash
# Check mobile app types
pnpm run typecheck

# Check library types
pnpm run typecheck:libs
```

---

## Troubleshooting

### "Unmatched Route" Error
Clear the Metro/Expo cache:
```bash
rm -rf .expo node_modules/.cache
pnpm run dev
```

### Metro Bundler Crash
If Metro crashes with `ENOENT` errors, clear caches and restart:
```bash
rm -rf .expo node_modules/.cache /tmp/metro-* /tmp/haste-map-*
pnpm run dev
```

### Font Loading Issues on Web
Fonts are loaded via `expo-font` with a CSS injection fallback on web. If fonts don't appear, hard-refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`).

### Package Version Warnings
The following version mismatches are known and non-blocking:
- `expo-local-authentication` — canary version used
- `react-native-keyboard-controller` — newer version installed

---

## Git Workflow

- **Main branch**: `main`
- **Remote**: `https://github.com/Riyada-Solutions/goconnect_nurse.git`
- Always use `pnpm` for dependency changes (never `npm` or `yarn`)
- Run `pnpm run typecheck` before pushing
