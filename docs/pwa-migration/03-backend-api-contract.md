# Backend API Contract For PWA

## Base

Backend base should remain environment-driven:

- Local: `http://localhost:5001/api`
- PWA env: `NEXT_PUBLIC_API_URL`

All protected requests use:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

## Auth

### Existing endpoints

- `POST /api/auth/google`
  - Body: `{ "idToken": string }`
  - Response: `{ token, user }`
  - Backend validates against `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`.

- `GET /api/auth/me`
  - Protected.
  - Response: formatted user.

- `PUT /api/auth/profile`
  - Protected.
  - Updates profile fields.
  - `preferred_time` can only be changed while `onboarding_completed !== true`.

- `POST /api/auth/profile/sync`
  - Protected.
  - Used for background/guest draft persistence after login.

- `POST /api/auth/admin-login`
  - Admin only login for `admin-panel`, not the user PWA login path.

### PWA decisions

- Implement Google first.
- Defer Facebook until backend exposes `/api/auth/facebook`.
- Preserve guest draft flow before login. After Google auth, merge guest draft into returned backend user and call profile sync.

### Open backend note

Current mobile `auth.ts` references Facebook access token exchange, but backend does not expose this route. Do not build Facebook UI in PWA initial release unless backend support is added.

## User/profile shape

Fields used by mobile and expected by PWA:

- `id`
- `email`
- `full_name`
- `avatar_url`
- `role`
- `is_pro`
- `age`
- `occupation`
- `gender`
- `height`
- `weight`
- `target_weight`
- `primary_goal`
- `focus_area`
- `limitations`
- `diet_type`
- `pain_areas`
- `symptoms`
- `surgery_history`
- `preferred_time`
- `notifications_enabled`
- `personalized_plan_started_at`
- `personalized_plan_completed_at`
- `personalized_plan_unlock_at`
- `onboarding_completed`
- `owned_devices`
- `created_at`

## Activation codes and devices

- `POST /api/codes/validate`
  - Public.
  - Body: `{ "code": string }`
  - Supports general activation code and product instance code.
  - Use before login when QR/manual code is entered during onboarding.

- `POST /api/codes/activate`
  - Protected.
  - Body: `{ "code": string }`
  - Activates PRO or claims product device.
  - Response may include `user`, `device`, `is_pro`.

PWA implementation:

- Manual input path calls validate, then stores pending activation code in onboarding state until login if needed.
- QR scan path decodes code, normalizes uppercase/trim, then follows same validate/activate flow.

## Exercises and workouts

- `GET /api/exercises`
- `GET /api/exercises?category=<category>`
- `GET /api/exercises/:id`
- `POST /api/exercises/workout-log`
- `PUT /api/exercises/workout-log/:id`
- `GET /api/exercises/workout-history/:userId?limit=<n>`
- `GET /api/exercises/user-behavior/:userId`

Workout plans:

- `GET /api/workout-plans`
- `GET /api/workout-plans?is_pro=true|false`
- `GET /api/workout-plans/:id`
- `GET /api/workout-plans/:id/exercises`
- `GET /api/workout-plans/:planId/progress/:userId`

Feedback:

- `POST /api/workout-feedback`
- `GET /api/workout-feedback?limit=<n>`

## Pain, water, statistics

Pain logs:

- `GET /api/pain-logs/today`
- `GET /api/pain-logs?days=<n>`
- `POST /api/pain-logs`
- `PUT /api/pain-logs/:id`

Water:

- `GET /api/water/today`
- `PUT /api/water/today`
- `POST /api/water/increment`
- `GET /api/water/week`

Device usage:

- `POST /api/device-usage`
- `GET /api/device-usage`

Statistics screen can compose:

- Workout history.
- Pain log history.
- Water week data if needed.
- Device usage logs if shown.

## Content and AI

- `GET /api/ai-prompts?prompt_type=<type>`
- `GET /api/chat-history?limit=<n>`
- `POST /api/chat-history`
- `DELETE /api/chat-history`
- `GET /api/daily-recommendations?date=<YYYY-MM-DD>`
- `POST /api/daily-recommendations`
- `GET /api/health-tips?category=<category>&limit=<n>`
- `GET /api/nutrition-tips?limit=<n>`
- `GET /api/library`
- `GET /api/postures`
- `GET /api/products`
- `GET /api/product-reviews`
- `GET /api/product-reviews/my-feed`
- `POST /api/product-reviews/my`
- `GET /api/product-assessments/mine`
- `GET /api/product-assessments/product/:productId`
- `POST /api/product-assessments`

## Notifications

Existing backend:

- `POST /api/notification-token`
  - Body today: `{ token, platform }`
  - Designed around one token per user.

- `GET /api/notifications?limit=<n>`
  - Notification inbox.

- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `POST /api/notifications/preview`

PWA requirement:

- Web Push subscription contains `endpoint`, `keys.p256dh`, `keys.auth`, expiration, and browser metadata.
- Existing schema `notification_tokens(token, platform)` is not enough unless token stores serialized subscription JSON.

Recommended backend extension:

- Accept `POST /api/notification-token` with either legacy `{ token, platform }` or web:

```json
{
  "platform": "web",
  "subscription": {
    "endpoint": "...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

- Store web subscription as JSON or introduce a dedicated table with unique `(user_id, endpoint)`.
- Dispatcher should route:
  - Expo token to Expo push.
  - Web subscription to `web-push` with VAPID keys.

## Backend cleanup items for migration

- Update outdated comments/docs that still say MongoDB/Supabase.
- Add web push subscription support.
- Decide whether JWT should stay in browser localStorage or move to httpOnly cookie via a Next/API auth bridge.
- Add `/api/auth/facebook` only after Google PWA release if Facebook remains required.

