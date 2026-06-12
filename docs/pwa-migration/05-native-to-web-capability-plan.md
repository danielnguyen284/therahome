# Native To Web Capability Plan

## Storage

Mobile:

- AsyncStorage stores token, user, theme, notification toggle.

PWA:

- Use `localStorage` for initial parity.
- Use a typed `storage.ts` wrapper so future cookie/IndexedDB changes do not touch every feature.
- Persist onboarding draft separately from authenticated user.

## Google auth

Mobile:

- `expo-auth-session/providers/google` gets `id_token`, backend exchanges it for app JWT.

PWA:

- Use Google Identity Services to get an ID token.
- Send `{ idToken }` to `/api/auth/google`.
- Store returned JWT/user.
- Merge guest onboarding draft and sync profile.

Required backend/env:

- `GOOGLE_WEB_CLIENT_ID` must be configured in backend.
- Browser origin must be allowed in Google OAuth config.

## Camera QR scan

Mobile:

- `expo-camera` `CameraView`.

PWA:

- Use `navigator.mediaDevices.getUserMedia`.
- Decode QR with a browser QR scanner library.
- Require HTTPS in production.
- Provide manual input always as fallback.
- Normalize code with `trim().toUpperCase()` before validate/activate.

Failure states:

- Permission denied.
- No camera.
- Insecure context.
- Scanner cannot decode.
- Backend code invalid or already used.

## Notifications

Mobile:

- `expo-notifications` gets Expo push token and sends to `/api/notification-token`.
- Backend notification dispatcher is server-driven.

PWA:

- Register Service Worker.
- Ask Notification permission only after user intent.
- Subscribe PushManager with VAPID public key.
- Send web subscription to backend.
- Keep notification inbox UI using existing `/api/notifications` APIs.

Backend required work:

- Store web subscriptions.
- Send Web Push using VAPID keys.
- Keep Expo token support only if native app is still supported during transition.

## Haptics

Mobile:

- `expo-haptics` used widely for taps/success/error.

PWA:

- Optional wrapper:
  - `navigator.vibrate(10)` for light.
  - `navigator.vibrate([20, 30, 20])` for success/error patterns.
  - No-op on unsupported browsers.

Do not block UX on haptic availability.

## Video playback

Mobile:

- `expo-av` for direct video.
- `react-native-youtube-iframe` for YouTube.

PWA:

- Use HTML5 `<video>` for direct video URLs.
- Use YouTube iframe/player API for YouTube URLs.
- Preserve:
  - Play/pause.
  - Seek.
  - Duration/current time.
  - Completion detection.
  - Workout log creation/update.

## Screen orientation and fullscreen

Mobile:

- `expo-screen-orientation`.

PWA:

- Use responsive layout and optional Fullscreen API.
- Screen Orientation API support varies; treat as progressive enhancement.
- Workout sequence should remain usable in portrait without requiring orientation lock.

## Charts

Mobile:

- `react-native-chart-kit`.

PWA:

- Use Recharts because admin panel already depends on it.
- Rebuild pain, workout, water and statistic charts with responsive containers.

## SVG/body map

Mobile:

- `react-native-svg`, custom body components.

PWA:

- Convert to inline SVG React components or plain HTML/SVG.
- Preserve click/tap hit targets for pain areas.
- Ensure pointer and keyboard accessibility for selectable body parts.

## External links and deep links

Mobile:

- `expo-linking`, `expo-web-browser`.

PWA:

- Use `window.open`, normal anchor tags, and route handlers.
- OAuth callback should be browser route based, not native scheme based.
- Pending activation code can be stored in query param or local draft.

## Push permission UX

Recommended sequence:

1. User enables notifications in profile/settings.
2. Browser permission prompt appears.
3. PWA registers service worker.
4. PWA subscribes PushManager.
5. Backend stores subscription.
6. UI reflects enabled state only after backend success.

Do not request push permission during first page load.

