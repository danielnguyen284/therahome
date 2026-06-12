# TheraHome PWA Migration Overview

## Muc tieu

Migrate `TheraEase-APP` tu Expo React Native sang mot Next.js PWA moi, nam rieng trong folder `pwa-app`, de thay the hoan toan mobile app hien tai. Backend Express + PostgreSQL + Prisma se duoc giu lam API chinh.

## Quyet dinh da chot

- Tao app moi trong folder rieng: `pwa-app`.
- PWA thay the hoan toan app mobile Expo, khong chi la MVP song song.
- Khong rut gon onboarding va khong bo tinh nang hien co.
- Auth uu tien Google truoc.
- Can co web push notification.
- Activate device can ho tro ca scan QR bang camera va nhap ma thu cong.

## Repo hien tai

- `backend`: Express REST API, Prisma 7, PostgreSQL, JWT auth.
- `admin-panel`: Next.js 16 App Router admin dashboard, da dung REST API qua `NEXT_PUBLIC_API_URL`.
- `TheraEase-APP`: Expo Router mobile app, React Native, Zustand, React Native Paper, Expo native APIs.

## Nguyen tac migrate

- Port full feature parity truoc khi retire Expo app.
- Dung backend API hien tai toi da, chi mo rong khi platform web bat buoc can contract moi.
- Reuse domain model va type shape tu mobile app de giam sai lech voi backend.
- Mobile-first UI vi PWA thay the mobile app, nhung layout phai chay tot tren desktop/tablet.
- Khong migrate native dependency 1:1 neu web co primitive tot hon.
- Tach ro code platform-specific: camera, push, storage, install prompt, browser permissions.

## Tieu chi hoan thanh

- User co the install PWA va dung luong chinh tren mobile browser.
- Google sign-in tao hoac lay user, tra JWT, load profile, resume session.
- Onboarding day du chay tu guest draft den persist profile.
- Tabs chinh, workout flow, pain/water/device tracking, library, posture, chat, notification inbox deu hoat dong.
- QR camera scan va manual activation deu di qua API `/api/codes/validate` va `/api/codes/activate`.
- Web push subscription duoc dang ky, backend co the gui notification den browser.
- Offline/poor-network behavior duoc xu ly toi thieu: shell load duoc, error state ro rang, retry duoc.

## Rui ro lon

- Web push khong dung chung Expo push token. Backend hien tai co `notification_tokens` voi `token/platform`, can thiet ke them Web Push subscription.
- Backend co `/api/auth/google` nhung chua co `/api/auth/facebook`; pham vi da chot la Google truoc.
- Expo haptics, notification scheduler, screen orientation va native video control can thay bang web equivalents hoac graceful fallback.
- Mobile app hien co co nhieu man hinh onboarding va mot so logic guest draft nam truc tiep trong screen, can tach lai de port an toan.
- Mot so file hien tai co text bi mojibake do encoding cu. Khi port sang PWA can dung UTF-8 ro rang.
