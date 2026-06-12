# Migration Phases And Checklist

## Phase 0: Preparation

- Create `pwa-app` with Next.js 16, TypeScript, Tailwind.
- Copy normalized assets into `pwa-app/public`.
- Configure env:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Add CORS origin for PWA dev/prod URLs in backend.
- Update stale project docs/comments that still mention MongoDB/Supabase where they affect migration decisions.

## Phase 1: Foundation

- Implement root layout, theme provider, app providers.
- Implement API client.
- Implement storage wrapper.
- Implement auth store.
- Implement onboarding draft store with persistence.
- Implement protected route shell and redirect rules.
- Add PWA manifest and basic service worker registration.

Acceptance:

- App boots.
- Can navigate public/onboarding routes.
- Can read/write local draft.
- Can call `/api/health` or protected API with clear auth error.

## Phase 2: Google auth

- Add Google Identity Services integration.
- Exchange ID token via `/api/auth/google`.
- Store JWT/user.
- Load `/api/auth/me` on refresh.
- Sign out clears storage and returns to login/onboarding.
- Merge guest draft into user after login.

Acceptance:

- New user Google login works.
- Existing user Google login works.
- Expired/invalid token clears session.
- Guest draft survives login and profile sync.

## Phase 3: Full onboarding

- Port every `(auth)` route from Expo.
- Preserve route order, params, state updates and visuals.
- Preserve device offer, special offer and activate-device path.
- Implement manual activation code validation.
- Implement QR scan activation.
- Persist `onboarding_completed`.

Acceptance:

- User can start as guest, finish onboarding, login, persist profile, land on home.
- Refresh in middle of onboarding resumes draft.
- Activation code works both before and after login.

## Phase 4: App shell and tabs

- Implement bottom navigation.
- Implement floating chatbot entry.
- Implement `/home`, `/posture`, `/explore`, `/library`, `/profile`.
- Implement hidden-but-required routes: `/chat`, `/devices`, `/exercises`, `/settings`.

Acceptance:

- All tab routes are reachable.
- Protected app shell redirects unauthenticated users.
- Profile reflects backend user and pro/device status.

## Phase 5: Workout and exercise flows

- Port exercises list and filters.
- Port exercise detail.
- Port workout plans.
- Port workout plan detail.
- Port workout sequence video player.
- Implement workout log create/update.
- Implement workout feedback modal/flow.

Acceptance:

- User can complete a workout sequence.
- Logs appear in history/statistics.
- YouTube and direct video URLs both work.

## Phase 6: Tracking and recommendations

- Port pain input.
- Port pain analysis.
- Port water tracking.
- Port daily recommendations.
- Port device recommendation and usage.
- Port statistics charts.

Acceptance:

- Pain and water upserts match backend.
- Recommendation generation/read flow works.
- Charts render on mobile and desktop widths.

## Phase 7: Content, product, chat

- Port library.
- Port posture.
- Port product assessments.
- Port product reviews/my feed if used.
- Port chat history and AI prompt usage.
- Port terms, privacy, about.

Acceptance:

- All standalone screens from Expo have a PWA route.
- No mobile-only imports remain in PWA.

## Phase 8: Web push

- Add service worker push event handling.
- Add PushManager subscription.
- Extend backend `/api/notification-token` for web subscription.
- Add backend Web Push dispatcher with VAPID.
- Port notification settings and inbox.
- Implement notification preview if needed.

Acceptance:

- User can enable notifications.
- Subscription is saved.
- Backend can send a test notification to browser.
- Notification inbox still updates from dispatch logs.

## Phase 9: QA and release

- Test on Chrome Android, Safari iOS, desktop Chrome.
- Test installability and standalone display.
- Test camera permissions on HTTPS.
- Test push permission and delivery.
- Test all protected route redirects.
- Test slow/offline network states.
- Run Next build and lint.
- Regression test backend API flows.

Acceptance:

- PWA can replace Expo app for all defined user workflows.
- Known limitations are documented and not feature omissions.

