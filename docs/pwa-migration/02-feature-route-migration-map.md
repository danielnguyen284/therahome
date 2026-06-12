# Feature And Route Migration Map

## Target route convention

Target folder: `pwa-app`.

Recommended Next.js App Router groups:

- `app/(public)`: splash, marketing-like onboarding intro, terms, privacy.
- `app/(auth)`: login and OAuth callback.
- `app/(onboarding)`: full onboarding sequence.
- `app/(app)`: authenticated app shell with bottom tabs.
- `app/api`: optional Next proxy routes only when browser platform requires server help.

## Root flow

| Expo route | Next route | Notes |
| --- | --- | --- |
| `app/index.tsx` | `/` | Boot route. Load auth state, guest draft, redirect. |
| `app/_layout.tsx` | `app/layout.tsx` + providers | Theme, auth, query/cache, PWA shell. |
| `app/(tabs)/_layout.tsx` | `app/(app)/layout.tsx` | Bottom navigation, floating chatbot, protected shell. |

## Auth and onboarding

| Expo route | Next route | Required behavior |
| --- | --- | --- |
| `(auth)/splash` | `/splash` or `/onboarding/splash` | Entry for guest/new user. |
| `(auth)/start` | `/onboarding/start` | Preserve visual flow and navigation. |
| `(auth)/welcome` | `/onboarding/welcome` | Continue profile draft. |
| `(auth)/warning` | `/onboarding/warning` | Preserve params and state. |
| `(auth)/understanding` | `/onboarding/understanding` | Preserve content. |
| `(auth)/thera-home` | `/onboarding/thera-home` | Preserve device/product pitch. |
| `(auth)/target-area` | `/onboarding/target-area` | Update `focus_area`/pain fields. |
| `(auth)/pain-level` | `/onboarding/pain-level` | Persist selected pain level. |
| `(auth)/pain-time` | `/onboarding/pain-time` | Persist pain duration/time. |
| `(auth)/previous-methods` | `/onboarding/previous-methods` | Preserve choices. |
| `(auth)/method-effectiveness` | `/onboarding/method-effectiveness` | Preserve choices. |
| `(auth)/medical-history` | `/onboarding/medical-history` | Preserve medical history. |
| `(auth)/complications` | `/onboarding/complications` | Preserve symptom/limitation data. |
| `(auth)/goals` | `/onboarding/goals` | Map to `primary_goal`. |
| `(auth)/gender` | `/onboarding/gender` | Map to `gender`. |
| `(auth)/age` | `/onboarding/age` | Map to `age`. |
| `(auth)/occupation` | `/onboarding/occupation` | Map to `occupation`. |
| `(auth)/exercise-time` | `/onboarding/exercise-time` | Map to `preferred_time`, only editable before onboarding completed per backend. |
| `(auth)/discovery` | `/onboarding/discovery` | Preserve current UI. |
| `(auth)/best-version` | `/onboarding/best-version` | Preserve current UI. |
| `(auth)/ai-analysing` | `/onboarding/ai-analysing` | Preserve timed/animated transition. |
| `(auth)/plan-ready` | `/onboarding/plan-ready` | Preserve transition to plan/home. |
| `(auth)/device-offer` | `/onboarding/device-offer` | Preserve product offer path. |
| `(auth)/special-offer` | `/onboarding/special-offer` | Preserve offer and external link behavior. |
| `(auth)/activate-device` | `/activate-device` or `/onboarding/activate-device` | Camera QR scan plus manual code input. |
| `(auth)/reviews` | `/onboarding/reviews` | Uses `/api/reviews`. |
| `(auth)/login` | `/login` | Google sign-in first. Facebook intentionally deferred. |
| `(auth)/onboarding` | `/onboarding/profile` | Legacy combined onboarding screen, keep if still reachable. |

## App tabs

| Expo tab | Next route | Notes |
| --- | --- | --- |
| `(tabs)/home` | `/home` | Main dashboard, recommendations, stats summary, device status, smart notifications. |
| `(tabs)/posture` | `/posture` | Public-ish posture list currently calls `/api/postures` without auth on backend. |
| `(tabs)/explore` | `/explore` | Discovery content and navigation hub. |
| `(tabs)/library` | `/library` | Uses `/api/library`. |
| `(tabs)/profile` | `/profile` | Profile, pro/device, notification toggles, sign out. |
| `(tabs)/chat` | `/chat` | Hidden tab today, still feature parity. |
| `(tabs)/devices` | `/devices` | Hidden tab today, still feature parity. |
| `(tabs)/exercises` | `/exercises` | Hidden tab today, still feature parity. |
| `(tabs)/settings` | `/settings` | Hidden tab today, still feature parity. |

## Standalone screens

| Expo screen | Next route | Notes |
| --- | --- | --- |
| `about` | `/about` | Static app info. |
| `terms` | `/terms` | Static/legal. |
| `privacy` | `/privacy` | Static/legal. |
| `daily-recommendations` | `/daily-recommendations` | Uses recommendations/tips APIs. |
| `device-recommendation` | `/device-recommendation` | Preserve device guidance. |
| `device-usage` | `/device-usage` | Uses `/api/device-usage`. |
| `edit-profile` | `/profile/edit` | Uses `/api/auth/profile`. |
| `edit-symptoms` | `/profile/symptoms` | Uses `/api/auth/profile`. |
| `exercise-detail` | `/exercises/[id]` | Uses `/api/exercises/:id`. |
| `notification-settings` | `/notifications/settings` | Toggle backend profile field and web push subscription. |
| `notifications` | `/notifications` | Uses notification inbox APIs. |
| `pain-analysis` | `/pain-analysis` | Uses pain logs and recommendation data. |
| `pain-input` | `/pain-input` | Uses `/api/pain-logs`. |
| `product-assessments` | `/product-assessments` | Uses `/api/product-assessments` and product reviews. |
| `recommendations` | `/recommendations` | Preserve recommendation UI. |
| `statistics` | `/statistics` | Uses workout history and pain logs. |
| `water-tracking` | `/water-tracking` | Uses `/api/water`. |
| `workout-plans` | `/workout-plans` | Uses `/api/workout-plans`. |
| `workout-plan-detail` | `/workout-plans/[id]` | Plan overview. |
| `workout-sequence` | `/workout-sequence` or `/workout-plans/[id]/sequence` | Video playback, progress logging, feedback. |

## Phasing without dropping features

Feature parity is required, but implementation can be staged:

1. Foundation routes and providers.
2. Auth and guest/onboarding draft.
3. Full onboarding route-by-route.
4. App shell and tab navigation.
5. Home, profile, device activation.
6. Workout plans, details, exercise detail, workout sequence.
7. Pain, water, statistics, daily recommendations.
8. Library, posture, explore, product assessments, chat.
9. Notifications: inbox first, then web push registration and backend dispatch.
10. QA, installability, performance, accessibility, release checklist.

