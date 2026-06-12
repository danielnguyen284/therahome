# Current Mobile App Audit

## Tong quan

`TheraEase-APP` la Expo Router app voi file entry `expo-router/entry`. App hien tai dung:

- React Native 0.81, React 19.
- Expo SDK 54.
- Expo Router cho stack, auth group, tabs.
- Zustand cho auth, exercise, pain state.
- React Native Paper cho UI controls.
- Lucide React Native cho icons.
- Reanimated, Moti, Expo Haptics cho motion/tactile feedback.
- Expo Notifications, Camera, AV, WebBrowser, AuthSession.
- AsyncStorage lam token/user/theme storage.

## App routing hien tai

Root:

- `app/_layout.tsx`: ThemeProvider, PaperProvider, notification handler, root stack.
- `app/index.tsx`: boot route, init auth, tao guest user neu chua login, redirect sang onboarding hoac home.

Auth/onboarding group:

- `app/(auth)/splash.tsx`
- `app/(auth)/start.tsx`
- `app/(auth)/welcome.tsx`
- `app/(auth)/warning.tsx`
- `app/(auth)/understanding.tsx`
- `app/(auth)/thera-home.tsx`
- `app/(auth)/target-area.tsx`
- `app/(auth)/pain-level.tsx`
- `app/(auth)/pain-time.tsx`
- `app/(auth)/previous-methods.tsx`
- `app/(auth)/method-effectiveness.tsx`
- `app/(auth)/medical-history.tsx`
- `app/(auth)/complications.tsx`
- `app/(auth)/goals.tsx`
- `app/(auth)/gender.tsx`
- `app/(auth)/age.tsx`
- `app/(auth)/occupation.tsx`
- `app/(auth)/exercise-time.tsx`
- `app/(auth)/discovery.tsx`
- `app/(auth)/best-version.tsx`
- `app/(auth)/ai-analysing.tsx`
- `app/(auth)/plan-ready.tsx`
- `app/(auth)/device-offer.tsx`
- `app/(auth)/special-offer.tsx`
- `app/(auth)/activate-device.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/reviews.tsx`
- `app/(auth)/onboarding.tsx`

Tabs:

- `app/(tabs)/home.tsx`
- `app/(tabs)/posture.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/library.tsx`
- `app/(tabs)/profile.tsx`
- Hidden but still used: `chat`, `devices`, `exercises`, `settings`.

Standalone screens:

- `about`
- `daily-recommendations`
- `device-recommendation`
- `device-usage`
- `edit-profile`
- `edit-symptoms`
- `exercise-detail`
- `notification-settings`
- `notifications`
- `pain-analysis`
- `pain-input`
- `privacy`
- `product-assessments`
- `recommendations`
- `statistics`
- `terms`
- `water-tracking`
- `workout-plans`
- `workout-plan-detail`
- `workout-sequence`

## State va storage

Main store:

- `src/stores/authStore.ts`: user, token, loading, authenticated state, guest user, profile refresh.
- `src/stores/exerciseStore.ts`: exercise/workout-related state.
- `src/stores/painStore.ts`: pain state.

Storage hien tai:

- `therahome_token`
- `therahome_user`
- `theme_mode`
- `notificationsEnabled`
- Mot so screen doc `user_email`.

PWA can thay AsyncStorage bang browser storage hoac cookie strategy. Vi admin panel dang dung `localStorage`, co the dung localStorage giai doan dau de parity, sau do can nhac httpOnly cookie neu muon tang security.

## Service layer

Mobile service files can port thanh `pwa-app/src/services`:

- `api.ts`: base fetch client, bearer token, JSON error handling.
- `auth.ts`: Google token exchange, profile, sync, sign out.
- `exercises.ts`: exercises, workout log, history, behavior.
- `workoutPlans.ts`: plans and plan exercises.
- `painLogs.ts`: today, create, update, history.
- `water.ts`: today, week, increment.
- `dailyContent.ts`: health tips, nutrition tips, recommendations.
- `notifications.ts`: native push registration and notification scheduling, can not port 1:1.
- `feedback.ts`: workout feedback.
- `groq.ts`: prompt fetch and AI/chat support.
- `profileSync.ts`, `profileByEmail.ts`, `onboardingProfile.ts`: profile persistence helpers.
- `videos.ts`: video APIs.

## Native dependencies can anh xa sang web

- `@react-native-async-storage/async-storage`: replace with `localStorage`, IndexedDB, or cookie backed session.
- `expo-auth-session`, `expo-web-browser`: replace with Google Identity Services or OAuth redirect flow.
- `expo-camera`: replace with `getUserMedia` plus QR scanner library.
- `expo-notifications`: replace with Web Push API, Service Worker, PushManager, Notifications API.
- `expo-haptics`: optional `navigator.vibrate` fallback where supported.
- `expo-av` and `react-native-youtube-iframe`: replace with HTML5 video and YouTube iframe/player API.
- `expo-screen-orientation`: replace with CSS fullscreen/orientation hints where possible.
- `react-native-svg`: replace with SVG React components or plain SVG.
- `react-native-chart-kit`: replace with Recharts or another web chart lib. Admin already uses Recharts.
- `react-native-paper`: replace with web components built with Tailwind and accessible primitives.
- `react-native-qrcode-svg`: replace with `qrcode.react` or equivalent. Admin already uses `qrcode.react`.

## Assets

Assets in `TheraEase-APP/assets` should be copied or referenced into `pwa-app/public`:

- Brand: `TheraHome_logo_white.png`, `TheraHome_logo_black.png`, `logo-thera-ai-1.png`, `logo-thera-ai-2.png`.
- App icons: `icon.png`, `adaptive-icon.png`, `favicon.png`, `notification-icon.png`, `splash.png`.
- Backgrounds: `background_login.png`, `welcome-bg.jpg`, `best-version-bg.png`, `thera-home-bg.png`, `yoga-candles-bg*.png`.
- Product images: `theraneck.png`, `theraback.png`, plus non-ASCII TheraNECK product image filenames that should be normalized.
- Onboarding images with Vietnamese filenames should be normalized during copy to avoid deploy/file-system encoding issues.

## Observations

- Backend and root `GEMINI.md` still mention MongoDB/Supabase in places, but actual backend now uses Prisma/PostgreSQL.
- `auth.ts` includes Facebook token flow, but backend currently only exposes Google and admin login.
- Notifications are now mostly server-driven on backend, but mobile registration still stores Expo push token.
- Onboarding has guest-user draft behavior before login. PWA must preserve this exactly because user can complete part of flow before auth.
