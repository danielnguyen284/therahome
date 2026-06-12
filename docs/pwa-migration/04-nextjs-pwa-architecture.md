# Next.js PWA Architecture

## Target stack

- Next.js 16 App Router, matching admin panel generation.
- React 19.
- TypeScript.
- Tailwind CSS.
- Zustand for local app/session/onboarding state.
- Recharts for charts, consistent with admin panel.
- Lucide React for icons.
- `qrcode.react` or compatible package for QR display.
- Browser camera QR scanner library for activation scanning.
- Service Worker + Web App Manifest + Web Push support.

## Folder proposal

```text
pwa-app/
  app/
    layout.tsx
    page.tsx
    globals.css
    manifest.ts
    (auth)/
      login/
      callback/
    (onboarding)/
      ...
    (app)/
      layout.tsx
      home/
      posture/
      explore/
      library/
      profile/
      chat/
      devices/
      exercises/
      settings/
    activate-device/
    notifications/
    workout-plans/
    workout-sequence/
  components/
    app-shell/
    auth/
    onboarding/
    workout/
    device/
    notifications/
    ui/
  lib/
    api.ts
    auth.ts
    storage.ts
    pwa.ts
    web-push.ts
  services/
    exercises.ts
    workoutPlans.ts
    painLogs.ts
    water.ts
    notifications.ts
    dailyContent.ts
    feedback.ts
  stores/
    authStore.ts
    onboardingStore.ts
    exerciseStore.ts
    painStore.ts
  types/
    index.ts
  public/
    icons/
    images/
    sw.js
```

## Rendering model

Most app screens should be client components because:

- Auth token initially lives in browser storage.
- PWA capabilities require browser APIs.
- Existing mobile logic is hook-heavy and interactive.

Server components can still be used for:

- Static legal pages.
- Public shell metadata.
- SEO-safe pages if needed.

## Auth state

Initial parity strategy:

- Store JWT in `localStorage` key `therahome_token`.
- Store user cache in `localStorage` key `therahome_user`.
- On app load, call `/api/auth/me` to validate token.
- On 401, clear storage and redirect to `/login`.

Future hardening:

- Move JWT to httpOnly cookie through Next route handler if deployment/domain setup allows.
- Keep only non-sensitive UI cache in localStorage.

## Guest onboarding draft

Mobile behavior must be preserved:

- A guest user is created before login.
- Onboarding collects profile fields in local state.
- Login merges backend user with guest draft.
- PWA calls `/api/auth/profile/sync` or `/api/auth/profile` after login to persist draft.
- Pending activation code from QR/manual entry is activated after auth.

Recommended store:

- `authStore`: token, user, auth lifecycle.
- `onboardingStore`: draft fields, current step, pending activation code, migration helpers.
- Persist onboarding draft to localStorage so browser refresh does not lose progress.

## Navigation

Use App Router route groups instead of Expo groups:

- `(onboarding)` for full sequential flow.
- `(app)` for protected shell and bottom tabs.
- Dedicated route guards in client layout:
  - Guest or no token can access onboarding and login.
  - Authenticated user with `onboarding_completed` routes to `/home`.
  - Authenticated incomplete user routes to current onboarding step.

## PWA installability

Must include:

- Manifest with name `TheraHome`, icons, theme color, display standalone, orientation portrait preference.
- Service Worker registration.
- App icons copied from Expo assets and normalized to standard sizes.
- Offline fallback page or shell.
- HTTPS in production because push/camera require secure context.

## Styling and components

Migration should not attempt React Native syntax compatibility. Prefer rebuilding UI with web-native components:

- Tailwind for layout and responsive styles.
- Accessible buttons, dialogs, tabs, switches, sliders.
- Lucide React icons.
- CSS animations or Framer Motion only where valuable.
- Avoid fixed mobile-only dimensions that break desktop.

## API layer

Use a web version of `src/services/api.ts`:

- `NEXT_PUBLIC_API_URL`.
- Browser fetch with bearer token.
- JSON error parsing matching mobile behavior.
- 401 global handling.
- Upload/media handling if later required.

Keep service modules close to mobile names so route migration can be mechanical:

- `services/auth.ts`
- `services/exercises.ts`
- `services/workoutPlans.ts`
- `services/painLogs.ts`
- `services/water.ts`
- `services/notifications.ts`

## Deployment assumptions

Need confirm during implementation:

- Same domain or separate domain from backend.
- CORS allows PWA origin.
- HTTPS is available.
- VAPID public key exposed to browser through env.
- Service Worker path is root-scoped for push/install behavior.

