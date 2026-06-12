# Open Questions And Decisions

## Decisions already confirmed

- New folder: `pwa-app`.
- Replacement target: PWA replaces mobile app completely.
- Scope: no feature removal, no shortened onboarding.
- Auth: Google first.
- Notifications: web push required.
- Device activation: both QR camera scan and manual code input required.

## Decisions to make during implementation

### JWT storage

Initial recommendation:

- Use `localStorage` for parity with admin panel and mobile AsyncStorage behavior.

Decision still needed:

- Should PWA later move user JWT to httpOnly cookie through a Next auth bridge?

Tradeoff:

- `localStorage` is faster to port and matches current admin panel.
- httpOnly cookie is safer against token theft but needs backend/Next route architecture.

### Web push schema

Decision needed:

- Store web subscription in existing `notification_tokens.token` as JSON string, or create a proper web push subscriptions table?

Recommendation:

- Create a dedicated table or Json field. Web push subscriptions are structurally different from Expo push tokens.

### Deployment topology

Decision needed:

- Will `pwa-app`, `admin-panel`, and `backend` be deployed on same domain/subdomains?

Why it matters:

- CORS.
- OAuth allowed origins.
- Service Worker scope.
- Cookie strategy if adopted.

### Styling system

Decision needed:

- Build custom Tailwind components, or introduce a web component primitive library?

Recommendation:

- Start with Tailwind + local reusable components to keep visual control close to mobile design.

### Legacy native app support window

Decision needed:

- How long will Expo app remain active while PWA is rolled out?

Why it matters:

- Backend notification dispatcher may need to support both Expo and Web Push during transition.
- Activation and auth flows should remain backward compatible.

### Facebook login

Decision needed after Google PWA release:

- Add backend `/api/auth/facebook` and PWA Facebook UI, or remove Facebook from final PWA scope?

Current state:

- Mobile code has Facebook flow.
- Backend currently has no Facebook auth route.

### Offline behavior depth

Decision needed:

- Shell-only offline support, or offline data entry with later sync?

Recommendation:

- First release: shell/offline fallback plus clear retry states.
- Later release: cache read-only content and queue writes for pain/water logs if product needs it.

## Immediate next implementation order

1. Scaffold `pwa-app`.
2. Copy assets with normalized filenames.
3. Build API/auth/storage foundation.
4. Implement Google login and `/auth/me` session restore.
5. Port onboarding draft and first few onboarding routes.
6. Add route-by-route parity checklist as code progresses.

