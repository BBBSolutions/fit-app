# Bug-Fix + Cross-Platform UI/UX Plan (Android, iOS, Web)

## What I reviewed
- Navigation setup and route registration.
- Shared layout wrappers and input components.
- Entry/auth screens that shape first-use UX.
- Notification and chat infrastructure with platform-specific behavior.
- Supabase client/auth configuration.

## Key issues to fix first (high impact)

1. **Authentication/client state can drift due to duplicate Supabase clients**
   - There are two Supabase clients created in different files (`src/config/supabaseAuth.js` and `src/services/supabaseClient.js`), and `ChatContext` uses both.
   - This can cause subtle session/channel cleanup inconsistencies and auth-state drift across screens.

2. **Production secrets are hard-coded in app source**
   - `SUPABASE_ANON_KEY` is committed directly in `src/config/supabaseConfig.js`.
   - Even if anon keys are “public-ish”, this blocks safe environment promotion and makes rotation/error handling harder.

3. **Bottom tabs are likely to clash with safe areas and small screens**
   - Both tab navigators use fixed height + absolute positioning (`height: 70`, `position: 'absolute'`) without safe-area-aware padding.
   - Risk: overlap/cutoff on iPhones with home indicator, Android gesture nav, and web responsive layouts.

4. **Global wrapper ignores bottom safe-area edge**
   - `ScreenWrapper` only applies `edges={['top', 'left', 'right']}`.
   - Forms/content near the bottom can be obscured by tab bars or system gestures.

5. **Login and welcome flows are not fully responsive/accessibility friendly**
   - `LoginScreen` is still basic buttons-only placeholder.
   - `WelcomeScreen` has desktop-like centered layout but no `ScrollView`, no keyboard handling, and no explicit accessibility metadata for actions.

6. **Notification UX has noisy blocking alerts and no web path**
   - Setup currently uses `alert(...)` in several failure/success paths.
   - Web explicitly exits without graceful in-app fallback/banners/preferences.

## Cross-platform execution plan

## Phase 0 — Stabilize architecture (1–2 days)
- Consolidate to a **single Supabase client module** and update all imports.
- Move config to Expo env (`app.config.js`/EAS secrets) with runtime validation and helpful startup errors.
- Add a thin platform/config diagnostic utility to expose build-time misconfiguration clearly.

**Definition of done**
- One Supabase client source of truth.
- No secret values hard-coded in JS source.
- App fails fast with clear message when env vars are missing.

## Phase 1 — Fix critical UI shell behavior (2–3 days)
- Refactor tab bar styles to be safe-area aware:
  - use `useSafeAreaInsets()` for bottom padding,
  - remove hard absolute assumptions,
  - verify label/icon scaling.
- Update `ScreenWrapper` to include bottom edge where needed and allow per-screen override.
- Standardize status bar handling per-platform (`dark-content`/`light-content`) and avoid translucent overlap surprises.

**Definition of done**
- No content overlap with tab bar/system gestures on Android and iOS.
- Web layout remains usable at narrow widths (mobile web).

## Phase 2 — Upgrade auth/onboarding UX for mobile + web (3–4 days)
- Replace placeholder login screen with full responsive/auth-first flow.
- Wrap welcome/auth views in `ScrollView` + keyboard-safe container.
- Add accessibility and interaction polish:
  - `accessibilityRole`, `accessibilityLabel`, focus order,
  - larger hit targets,
  - consistent CTA hierarchy.
- Remove dead/unused imports/constants and route anti-patterns (e.g., inline `require` route component).

**Definition of done**
- New and returning users can complete auth smoothly on Android, iOS, and web.
- No clipped content at 320px width and large text scaling.

## Phase 3 — Notifications and messaging hardening (2–3 days)
- Replace blocking alerts with non-blocking toasts/banners.
- Implement explicit platform strategy:
  - native push registration (Android/iOS),
  - web fallback (in-app notifications + polling/realtime badges).
- Add instrumentation for push registration failures and permission states.

**Definition of done**
- Push setup doesn’t interrupt user flow.
- Web users still receive meaningful message indicators.

## Phase 4 — QA matrix + regression protection (ongoing, start immediately)
- Add targeted test coverage:
  - unit tests for auth/config bootstrapping,
  - integration tests for route transitions,
  - snapshot/visual checks for tabs and auth screens.
- Manual QA matrix by platform:
  - Android (small + large), iOS (notch + non-notch), Web (mobile + desktop breakpoints).
- Include accessibility checks (screen reader labels, contrast, touch target sizing).

**Definition of done**
- Repeatable checklist with pass/fail per platform.
- No P0/P1 layout regressions for auth, tabs, chat badges.

## Suggested backlog (prioritized)

### P0 (do now)
- [ ] Single Supabase client consolidation.
- [ ] Env-based secret/config wiring.
- [ ] Safe-area fixes for bottom tabs + screen wrapper.
- [ ] Replace login placeholder with production-ready UI.

### P1
- [ ] Notification flow redesign (non-blocking).
- [ ] Welcome/auth responsive + accessibility pass.
- [ ] Remove dead imports and dynamic route require usage.

### P2
- [ ] Design token consistency pass across admin/member/trainer screens.
- [ ] Add web-specific interaction improvements (hover/focus states, keyboard nav).
- [ ] Performance tuning (initial render, bundle splitting where possible).

## Platform compatibility checklist (acceptance)
- Android: gesture navigation, keyboard overlap, back behavior, push permission flow.
- iOS: safe-area insets, notch/home indicator, status bar contrast, push permission timing.
- Web: responsive breakpoints, keyboard-only navigation, focus states, no blocking native-only UX.
