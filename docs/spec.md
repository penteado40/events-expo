# Spec: events-expo, members' mobile app (liquid glass design)

> Canonical spec. Copies in Jira PROJ-84 and GitHub #1 are snapshots; edit this file. Stories live in Jira under epic PROJ-84 (PROJ-85 … PROJ-92). Architecture: [ADR-0001](adr/0001-estrutura-por-feature.md), [ADR-0002](adr/0002-mock-backend-compartilhado.md). App terms: [`CONTEXT.md`](../CONTEXT.md).

## Problem Statement

Members of Events (Owners, Managers, Viewers) and the platform's Super admin have no mobile way to follow their Events. Today they can't see who RSVP'd, what's on the Registry, or — most importantly — do the **Verification** of Contributions that Guests marked as paid via Pix. A Guest marking a Contribution as `PAID` is only a declaration, not proof (ADR-0004): someone with the right role has to check the Pix and mark it `VERIFIED` or `REJECTED`, and there's no convenient place to do that from a phone.

On top of that, the backend (`penteado40/events-api`) only exposes auth today (`POST /auth/login`, `GET /me`). The `events`, `members`, `rsvp` and `registry` modules are planned (issues #5, #6, #10, #13, #17 there) but don't exist yet, so any app built now must work before those endpoints land and switch to them without rework.

## Solution

A members' mobile app (Expo + expo-router, TypeScript strict, runs in Expo Go) that recreates the high-fidelity "liquid glass" design handoff (`design_handoff_events_app_glass`): dark background with fixed colored orbs and a 32 pt grid, glass materials (Card, Card accent, Pill, Sheet), IBM Plex Sans/Mono, UI in pt-BR.

The member logs in with their real events-api account (during development, they can also enter Demo mode, with no network), sees the Events they can access with a "Para conferir" total, opens an Event to see a Summary, RSVPs, the Registry ("Presentes") and the Contributions to check ("Conferir"), and — if they are Owner, Manager or Super admin — verifies or rejects a `PAID` Contribution from a floating bottom sheet, optionally opening the Receipt first. Viewers see everything read-only.

Data comes through repository interfaces that mirror the planned API contract. A mock implementation (built from the prototype's sample data) backs them today; each module switches to HTTP by adding it to a list of live modules once its backend endpoints exist. Demo mode always uses the mock, and exists only in development builds.

## User Stories

### Session and login
1. As a member, I want to log in with my events-api email and password, so that I can access my Events from my phone.
2. As a member, I want the "Entrar" button to show "Entrando…" while the login is in progress, so that I know the app is working.
3. As a member, I want to see a clear message when login fails (e.g. "Email ou senha inválidos."), so that I understand what went wrong.
4. As a member, I want a connection message ("Não foi possível conectar. Verifique sua internet e tente de novo.") when the server is unreachable, so that I can tell a connection problem apart from wrong credentials.
5. As a member, I want my session kept on the device securely, so that I don't have to log in every time I open the app.
6. As a member, I want the app to open straight into my Events when I have a saved session, so that startup is fast.
7. As a member, I want the app to re-check my session in the background on startup, so that a revoked or expired session sends me back to login.
8. As a member whose password changed or whose 12 h JWT expired, I want any `401 UNAUTHENTICATED` response to log me out and return me to login, so that I'm never stuck in a broken session.
9. As a member, I want the email I last typed and signed in with through "Entrar" to still be there after I tap "Sair" (even after restarting the app), so that logging back in is quicker. Entering through "Modo demo" never reads or changes this saved email; after "Sair" from Demo mode the field is empty.
10. As a developer, I want a "Modo demo" button on the login screen in development builds (`__DEV__`) only, which lets me pick the demo Super admin, the demo User or the demo Manager, so that I can explore the app as any of those roles with no network. Release builds have no Demo mode; a stored demo Session is dropped at startup.
11. As a demo user, I want my demo session restored when I reopen the app, so that I can continue exploring.
12. As a member, I want to know there's no sign-up in the app, so that I understand only a Super admin creates Users.

### Events list
13. As a Super admin, I want to see all Events on the platform, so that I can oversee every Event.
14. As a User, I want to see only the Events I'm a member of, so that I only deal with what's mine.
15. As a member, I want the header to show how many Events I see and whether that's "super admin" or "seus eventos", so that I know the scope of the list.
16. As a member, I want a "Para conferir" hero with the total of `PAID` Contributions across all my visible Events, so that I know at a glance how much Verification work is waiting.
17. As a member, I want each Event card to show date and time (`dd.mm.aa · HH:MM`), my role (Owner, Manager, Viewer or Super admin, plus "· principal" if I'm the Primary owner), the Event name, its type and city (just the type when the Event has no city), so that I can identify it quickly.
18. As a member, I want a chip with "N pendentes" on Events that have `PAID` Contributions, so that I know where to go first.
19. As a member, I want archived Events shown with reduced opacity and an "arquivado" chip, so that I can tell they're no longer active.
20. As a User who isn't a member of any Event, I want a clear empty state ("Nenhum evento ainda." / "Um Super admin precisa te adicionar como membro.") without the hero, so that I understand why the list is empty.
21. As a member, I want glass skeletons while Events load, so that the screen doesn't jump when data arrives.
21a. As a member, I want to pull the Events list to refresh it, and the app to refresh it when I come back to it, so that the "Para conferir" total is current.
22. As a member, I want a data error shown with its message and a "Tentar de novo" button, so that I can recover from a failed load.
23. As a member, I want tapping an Event card to open its detail on the Summary tab, so that I can dig in.

### Event detail
24. As a member, I want a back button and a `#{id} · {papel}` label at the top, so that I know which Event and role I'm acting as.
25. As a member, I want the Event name, date, type label (Casamento, Aniversário, Corporativo, Chá de bebê, Festa, Outro) and venue (`venueName · city`, whichever exist) at the top, and to tap the venue with a "↗" to open it in maps when the Event has a `mapsUrl`, so that I have context and can find the place.
26. As a member of an archived Event, I want "ARQUIVADO · site não aceita escritas" shown, so that I know the Site is read-only.
27. As a member, I want segmented tabs (Resumo · RSVPs · Presentes · Conferir) that stay pinned while scrolling, so that I can switch sections anytime.
28. As a member, I want a lime dot on "Conferir" when there are `PAID` Contributions, so that I notice pending work.
29. As a member, I want the Summary to show how many Guests confirmed ("Confirmados", the number of RSVPs, one full-width card), the total `VERIFIED` amount in the Event's currency, and the number to check (`paidContributionCount`, the same number as the "Conferir" dot, the chip and the hero), so that I get the Event's status at a glance.
30. As a member, I want the Summary to show the Event's Site URL (without `https://`) and to tap it ("↗") to open the Site in the browser, archived Events included, so that I can reference the public Site.
31. As a member, I want the Summary to list the Event's members with their roles (Primary owner first, then Owner → Manager → Viewer, by name within each role; "Nenhum membro." when there are none), so that I know who else manages it.
32. As a member, I want the RSVPs tab to list each Guest who confirmed, with name, email and the date (`dd/mm` in the Event's timezone), most recent first, so that I can follow attendance. An RSVP is only a confirmation: there's no "não vou", and whoever isn't going isn't listed (events-api ADR-0015). With no RSVPs, "Nenhum RSVP.".
32a. As a Manager or Viewer of an archived Event, I want the RSVPs tab to show "ARQUIVADO · só Owners veem os convidados." instead of the list, and the Summary's "Confirmados" to show "—", so that I understand why Guest data is gone (events-api ADR-0011: after archiving, only Owners and the Super admin see Guest data; the others see the Event summary).
33. As a member, I want the Presentes tab to show each Registry item's image (striped placeholder when there's none or it fails to load), name, number of Contributions ("1 contribuição" / "N contribuições" / "nenhuma contribuição"; counts `PAID` + `VERIFIED`) and reference price, in the API's order, so that I can follow the Registry. Registry items hold no Guest data, so the tab stays visible on archived Events.
34. As a member of an Event without a Registry, I want "Sem lista de presentes.", so that the empty tab isn't confusing.
35. As a member, I want the Conferir tab to list Contributions with `PAID` first, oldest `paidAt` first (a queue), then `VERIFIED` and `REJECTED` together, most recent first (history), each showing the Guest, amount, Registry item (a skeleton bar while the Registry loads; "—" when it isn't in the Registry or the Registry failed to load) and status (pendente / verificada / rejeitada), so that the pending ones are on top. With none, "Nenhuma contribuição.".
35a. As a Manager or Viewer of an archived Event, I want the Conferir tab to show "ARQUIVADO · só Owners veem os convidados." instead of the list (the "Conferir" dot still follows `paidContributionCount`), so that the rule is the same as the RSVPs tab's.
36. As a Viewer, I want a notice "VIEWER · somente leitura. A conferência cabe a Managers e Owners." at the top of the Conferir tab (empty list included; on an archived Event the archived notice replaces it), so that I understand why I can't act.
37. As a member, I want to return to the Events list without losing its scroll position, so that I don't have to find my place again.
37a. As a member, I want to pull the Event detail to refresh the Event and the active tab, so that I can check whether a new Pix arrived.
37b. As a member, I want switching tabs after scrolling past the header to keep the tabs pinned and start the new tab at its top, so that I never land in the middle of another list.

### Contribution sheet and Verification
38. As a member, I want tapping a Contribution to open a floating bottom sheet, so that I can see its details without leaving the Event.
39. As a member, I want the sheet to show `Contribuição #{id}`, its status, the amount, the Guest, the Registry item, when it was marked paid and whether a Receipt is attached, so that I have everything needed to check the Pix.
39a. As a member opening a Contribution that isn't in the Event's list (a stale link, a `PENDING` one), I want "Contribuição não encontrada." inside the sheet, so that a bad link doesn't break the screen.
40. As a member, I want to tap "anexado ↗" to open the Receipt in the in-app browser ("abrindo…" while its short-lived URL loads; a failure shows only its message below the table), so that I can compare it with my bank statement before deciding. Without a Receipt, "não anexado" is plain text.
41. As an Owner, Manager or Super admin, I want "Verificar Pix" and "Rejeitar" buttons on a `PAID` Contribution, so that I can complete the Verification. On an archived Event only Owners and the Super admin verify (events-api ADR-0011, refinement "o Owner ainda faz a Verification"); a Manager can't even see its Contributions.
42. As a verifier, I want the hero total, the "Conferir" dot and the "Verificado" stat to update immediately after I verify or reject, so that the app feels instant.
43. As a verifier, I want a failed Verification to roll back the optimistic change and show the error, so that the screen never lies about the real state.
44. As a Viewer opening a `PAID` Contribution, I want "Viewers não fazem a conferência." instead of buttons, so that the rule is explicit.
45. As a member, I want to close the sheet by tapping outside it or swiping it down, so that it's quick to dismiss.
46. As a member, I want the sheet to have its own route, so that a Contribution can be linked to directly.

### Profile and navigation
47. As a member, I want a floating tab bar with "Eventos" and "Perfil" on the main screens (hidden in the Event detail), so that I can move between them.
48. As a member, I want the Profile to show my initials avatar and name, so that I know who is signed in. As a developer in Demo mode, I want a small `demo` chip next to the name, so that I never mistake sample data for real data.
49. As a member, I want the Profile to show my email, "Papel · Super admin" if I'm a Super admin, and "Membro desde" with the date I was created, so that I can check my account.
50. As a member, I want a "Sair" button that clears my session and returns to login, so that I can switch accounts.

### Look and feel
51. As an iOS 26+ user, I want native liquid glass on cards, pills, tab bar and sheet, so that the app feels native.
52. As a user on older iOS, I want a frosted blur fallback with the same tint, border and highlight, so that the design holds.
53. As an Android user, I want real blur on floating elements (tab bar, sticky tabs, sheet, back button) and tinted glass on list cards, so that the app looks right without hurting scroll performance.
54. As a member, I want a subtle press feedback (scale 0.98 and stronger top highlight) on glass elements, and the active pill sliding between tabs, so that interactions feel alive.

### Developer
55. As a developer, I want every data access to go through repository interfaces that mirror the events-api contract, so that swapping mock for HTTP touches one place.
56. As a developer, I want to turn a module to HTTP by adding it to the list of live modules, so that backend modules can land one at a time.
57. As a developer, I want the mock to simulate ~300 ms latency in dev, so that loading states get exercised before the real API exists.
58. As a developer, I want the API base URL in `EXPO_PUBLIC_API_URL` (default `http://localhost:3000/api/v1`), so that I can point to the local backend, the Android emulator host or a device on the LAN.
59. As a developer, I want screens forbidden (by lint) from importing the mock directly, so that the data seam can't be bypassed.
60. As a developer, I want `tsc --noEmit`, lint and unit tests to pass cleanly, so that the codebase stays healthy.

## Implementation Decisions

**Project & tooling**
- Standalone Expo project in this repo (`penteado40/events-expo`), separate from the NestJS backend, scaffolded with `npx create-expo-app@latest --template default` followed by `npm run reset-project` (leftover example `components/`, `hooks/`, `constants/` removed). Expo SDK 57 (the newest supported by Expo Go); moving to SDK 58 is its own Jira task once Expo Go moves to it. Target is Expo Go (no dev build unless something forces it). npm as package manager.
- TypeScript strict, alias `@/` → `src/`. `expo lint` (eslint-config-expo, flat config) + Prettier using the backend's `.prettierrc.json`; `npm run lint` runs both. Module boundaries are enforced with `eslint-plugin-boundaries` (see Architecture).
- All code, routes, file names and identifiers in English; only user-facing copy in pt-BR. Domain terms follow the events-api `CONTEXT.md` (Event, EventMember, RSVP, Registry item, Contribution, Receipt, Verification, Primary owner).
- Dark mode only, portrait only.
- Workflow: one `feat|fix/proj-<n>` branch per Jira ticket, PR to `main`. CI (`.github/workflows/ci.yml`, Node from `.nvmrc`) runs on every PR and push to `main`: `checks` (`npm ci`, typecheck, lint, test) and `gitleaks`, both required by the protection on `main` (admins included). `expo-doctor` runs as a separate job that is not required: it compares against the versions Expo recommends that day, so it can turn red with no code change; bumping flagged patches (`npx expo install --fix`) is a deliberate commit. Agents push only the ticket's branch and open the PR; the owner merges.
- User-facing copy never exposes where data comes from or backend internals: no endpoints, hosts, API vs. mock, raw error codes, raw field names or raw values (e.g. `SUPER_ADMIN`, ISO dates). Codes stay on `ApiError` for logic and tests only. The one exception is the `demo` chip on Perfil, which exists only in development builds.

**Architecture (ADR-0001)**
- Feature-based layout: `src/features/<feature>/` (`api.ts`, `repository.ts`, `mock.ts`, `schemas.ts`, `hooks/`, `components/`), shared code in `src/shared/` (`components/ui`, `lib`, `theme`, `session`), routes in `src/app/` that only compose screens from features, with no business logic.
- Boundaries (`eslint-plugin-boundaries`): `app` imports `features` and `shared`; a feature imports only itself and `shared`; `shared` imports only `shared`; a feature's `mock.ts` is imported only by its own `api.ts` and by its own tests; `shared/mock-backend/` is imported only by features' `mock.ts` files and by tests (ADR-0002).
- Server state: TanStack Query. Every API call goes through the feature's `api.ts` and is exposed through custom hooks (`useX` / `useXMutation`).
- Client state: Zustand, only for global UI/session state.
- Validation and types: Zod with inferred types (`z.infer`); the same schemas validate mock and HTTP responses. Forms with React Hook Form + `zodResolver`.
- Features in the first slices: `auth` (`AuthRepository = { login, me }`, `useLogin`, `useMe`, `useSessionCheck` called by the root layout, login form) and `profile` (screen over the Session; no `api.ts`).

**Routes (expo-router, under `src/app/`)**
- `(auth)/login`, `(tabs)/events`, `(tabs)/profile`, `events/[id]`, `events/[id]/contributions/[cid]`. `events/[id]` starts in PROJ-87 as the detail's top bar only (back button, `#{id} · {papel}`, the Event name, via `get(id)`); PROJ-88 grows it into the full detail.
- Auth gate at the root layout redirects based on the session state.
- `(tabs)` uses expo-router `Tabs` with a custom floating tab bar (220 wide, centered, bottom 28, Pill material, active pill sliding via Reanimated ~250 ms ease-out). Detail is outside `(tabs)` so the tab bar is hidden there; native push transition.
- The Event detail's segmented tabs (Resumo/RSVPs/Presentes/Conferir) are local state, sticky on scroll (one `ScrollView`, `stickyHeaderIndices`); returning from the sheet keeps the current tab and scroll. Switching tabs past the header scrolls to where the tabs sit pinned, so the new tab starts at its top; before that the offset stays. Pull-to-refresh refetches the Event and the active tab's queries.
- The detail composes features through slots (ADR-0001: features don't import each other): `features/events` exports `EventDetailScreen` (top bar, header, archived notice, sticky tabs, tab state, pull-to-refresh) taking each tab's content as a prop; the route builds the Resumo from `RsvpStats` (`rsvps`), `ContributionStats` (`contributions`), `SiteCard` (`events`) and `MembersCard` (`members`), each with its own skeleton and error box. Tabs not built yet show "Em breve.". A failed Event query replaces the header and tabs with the error box.
- The Contribution sheet is a route presented as `transparentModal`, rendering `@gorhom/bottom-sheet` in detached mode (8 pt inset sides/bottom, radius 40, Sheet material, `rgba(0,0,0,.35)` backdrop, tap-outside closes, spring animation). With no `GET` for one Contribution, the sheet reads the Event's Contributions list query (from cache when it comes from Conferir; fetched on a direct link) and finds `cid` in it; the Event itself comes from `get(id)`. For a Manager or Viewer of an archived Event it doesn't call the list and shows the archived notice.
- Registry item names reach Conferir and the sheet through the route (ADR-0001): the route builds an `id → name` map from `registry`'s query (`useRegistryItemNames`: undefined while loading, empty if the load failed) and passes it to `contributions`' components.

**UI kit**
- Design tokens (colors, type scale, radii, spacing) from the handoff README, as one module.
- A single `Glass` component with variants `card | accent | pill | sheet` choosing the implementation with `isLiquidGlassAvailable()`: `GlassView` (`regular`, tintColor = the material's tint) on iOS 26+; `BlurView` (tint dark, intensity ~20) under tint/border/top highlight on older iOS; on Android real blur (`dimezisBlurView`) only for floating elements (pill/sheet variants: tab bar, sticky tabs, sheet, back button) and tint + border + highlight without blur for card variants. Shadows via RN `boxShadow`.
- Fixed background: `#07080a`, three radial orbs via `react-native-svg` `RadialGradient`, 32 pt grid of 1 px `rgba(255,255,255,.05)` lines; does not scroll.
- Fonts: `@expo-google-fonts/ibm-plex-sans` (400/500/600) and `@expo-google-fonts/ibm-plex-mono` (400/500); splash held until fonts and the stored session are loaded.
- Press feedback: scale 0.98 + stronger top highlight (Reanimated).
- Loading: glass skeletons shaped like the real cards, pulsing (`SkeletonBlock`); a value still loading inside something already drawn (a stat's number, a Registry item name in Conferir and the sheet) gets its own skeleton bar too. No loading spinner anywhere: the only spinner is pull-to-refresh's, which means "refreshing". "—" means only "nothing to show" (the value doesn't exist, its source failed to load, or the viewer can't see it), never "loading". Query errors: the login's error box (message only) plus "Tentar de novo".
- Money formatted with `Intl` pt-BR using the Event's `currency`, always with centavos ("R$ 1.090,00"): `formatMoney(amount, currency)` in `shared/domain/money.ts`. Amounts are decimals in reais until the backend modules land.
- External links (the venue's `mapsUrl`, the Site) open with `Linking` and carry a "↗".
- Event dates and times are shown in the Event's own `timezone` (the time on the invitation), never the device's: `formatEventDate(startsAt, timezone)` in `shared/domain/events.ts`, via `Intl.DateTimeFormat` with `timeZone`. The mock stores the prototype's local times as UTC with `timezone: 'America/Sao_Paulo'`.
- Receipt opens with `expo-web-browser`.
- Remote images (Registry items) load with `expo-image` (disk cache, so refetches don't flicker) over the striped placeholder (`react-native-svg` pattern, 48×48, radius 14), which shows while loading, without an image and on error.
- Each tab owns its queries and fetches lazily when first shown (no prefetch from the detail); RSVPs come from cache when the Resumo already loaded them.

**Session**
- The Session lives in `src/shared/session/`: two Zustand stores persisted with the `persist` middleware and a SecureStore adapter: `useSession` (`{ token, user, live }`) and `useLastEmail`. "Sair" clears only the Session. The email is saved when the person signs in through "Entrar" (mock or HTTP); "Modo demo" never reads or writes it. The splash waits for both stores to hydrate.
- Startup is optimistic: splash only until storage is read; with a live session the app enters immediately and calls `GET /me` in the background. Demo sessions are restored too.
- Any `UNAUTHENTICATED` error from any repository calls `expireSession()` in `shared/session`, which clears the Session once (however many requests fail in parallel); `Stack.Protected` then returns to Login, silently, with no message. Only the `UNAUTHENTICATED` code triggers it, never the 401 status alone (a wrong password is `401 INVALID_CREDENTIALS`). "Sair" and expiry both clear the TanStack Query cache.
- Background `GET /me` on startup (`useSessionCheck`, once per cold start, Live sessions only): 200 replaces `session.user` with the fresh data; `UNAUTHENTICATED` expires the Session; `NETWORK` or any other error keeps the saved Session silently.
- Demo users live in the mock backend (`src/shared/mock-backend/`, ADR-0002), next to the memberships that reference their ids. Two since PROJ-87: the Super admin `{ id: 1, name: 'Admin Local', email: 'admin@local.test', role: 'SUPER_ADMIN', createdAt: '2026-01-01T12:00:00.000Z' }` and the handoff's User `{ id: 7, name: 'Cláudia Lima', email: 'claudia.lima@gmail.com', role: 'USER', createdAt: '2026-09-27T22:58:10.000Z' }`. The mock backend also holds the other Event members of the sample data, and a User who is a member of no Event (the empty list); only the Super admin has a password for the mock's "Entrar". Since PROJ-89 a third demo user, the archived Offsite Kora's Manager `{ id: 8, name: 'Otávio Kern' }`, shows an archived Event without Guest data. Tapping "Modo demo" swaps the button for three pills, "Super admin", "Cláudia Lima · user" and "Otávio Kern · manager"; the chosen one opens the Demo mode Session. Perfil shows Email, Papel ("Super admin", only for `SUPER_ADMIN`; no row for `USER`) and "Membro desde" (`createdAt` formatted pt-BR, e.g. "28 de set. de 2026"), labels and values in Plex Sans; no `id` row, no `name` row (the name is in the header).
- "Modo demo" is rendered only when `__DEV__`. Once `auth` is in `LIVE_MODULES` (PROJ-86), "Entrar" always calls the HTTP `POST /auth/login` and opens a Live session, in development and release alike; without the backend running, development uses "Modo demo". Every Session is either a Live session or Demo mode. The mock login (`admin@local.test / admin123`; otherwise `INVALID_CREDENTIALS`) remains the reference for the contract suite.
- The login form validates with the same Zod schema before the request (`VALIDATION_ERROR` · "Dados inválidos."); the API's own `VALIDATION_ERROR` message shows only if invalid input gets through.

**Data layer (the main seam)**
- Repository interfaces, one per feature in its `repository.ts` (re-exported by `api.ts`, which picks the implementation), mirroring the events-api contract (issues #5, #6, #10, #13, #17 there):
  - `AuthRepository`: `login({ email, password })` → `POST /auth/login` → `{ token, user }`; `me()` → `GET /me`.
  - `EventsRepository`: `list()` → `GET /events` (all for Super admin, member's Events otherwise); `get(id)` → `GET /events/:id`. Both return the same item: the Event plus the requester's `membership: { role, isPrimaryOwner } | null` (null for the Super admin, who is never an Event member; shipped by events-api PROJ-55 under that name, since **Viewer** is already a role) and `paidContributionCount`, so the list needs no per-Event requests. `paidContributionCount` is requested on events-api PROJ-67; `events` can't join `LIVE_MODULES` before it lands.
  - `MembersRepository`: `list(eventId)` → `GET /events/:id/members`.
  - `RsvpsRepository`: `list(eventId)` → `GET /events/:id/rsvps`.
  - `RegistryRepository`: `list(eventId)` → `GET /events/:id/registry-items`.
  - `ContributionsRepository`: `list(eventId)` → `GET /events/:id/contributions`; `verify` / `reject` → `PATCH /events/:id/contributions/:cid/verify|reject` (only from `PAID`; Viewer → `403 FORBIDDEN`); `getReceiptUrl(eventId, contributionId)` → `GET /events/:id/contributions/:cid/receipt` → `{ url }`, a short-lived signed URL (events-api ADR-0005), never cached: each tap asks again (no Receipt, or a Contribution not in the list → `404 NOT_FOUND`; Guest data, so archived-Event rules apply). The mock answers a placeholder image URL.
- Archived Events (events-api ADR-0011): only Owners and the Super admin see Guest data; for a Manager or Viewer, `GET /events/:id/rsvps` (and, from PROJ-90, `/contributions`) answers `FORBIDDEN`. The app decides with `canSeeGuests(event)` (its `status` and the viewer's `membership`) and doesn't even call those endpoints when it says no; numbers that would come from them show "—" until the backend has an Event summary. Registry items aren't Guest data and stay visible.
- Types follow the backend issues over the README where they differ: `Event { id, name, slug, type: 'WEDDING'|'BIRTHDAY'|'CORPORATE'|'BABY_SHOWER'|'PARTY'|'OTHER', status: 'ACTIVE'|'ARCHIVED', startsAt, endsAt?, timezone, locale, currency, venueName?, venueAddress?, city?, mapsUrl?, siteUrl, membership: { role: 'OWNER'|'MANAGER'|'VIEWER', isPrimaryOwner } | null, paidContributionCount }`; `EventMember { userId, name, role: 'OWNER'|'MANAGER'|'VIEWER', isPrimaryOwner }`; `Rsvp { name, email, createdAt }` (only confirmations, events-api ADR-0015; the mock drops the prototype's "não vai" answers); `RegistryItem { id, name, price, imageUrl: string | null, contributionCount }` (image optional per events-api #13; `contributionCount` counts `PAID` + `VERIFIED`; the mock counts them from its Contributions' `registryItemId` since PROJ-90, and uses `picsum.photos/seed/…/96` images plus one `null` and one 404 to exercise the fallback); `Contribution { id, guestName, registryItemId, amount, status: 'PENDING'|'ABANDONED'|'PAID'|'VERIFIED'|'REJECTED', paidAt, hasReceipt }` (the app lists `PAID`, `VERIFIED`, `REJECTED`; `GET /events/:id/contributions` returns only those). Members, RSVPs and Contributions follow `get(id)`'s visibility: `FORBIDDEN` for a non-member (missing Event included), `NOT_FOUND` only for the Super admin. Field names get reconciled when each backend module lands.
- A shared HTTP client (`src/shared/lib/http.ts`): base URL from `EXPO_PUBLIC_API_URL` (default `http://localhost:3000/api/v1` in development builds only; a release build without it fails loudly at startup), Bearer token, unwraps `{ data }`, maps `{ error: { code, message, details? } }` to a typed `ApiError`, maps fetch failures and a 15 s timeout (`AbortController`) to code `NETWORK` with the message "Não foi possível conectar. Verifique sua internet e tente de novo." (never the host), emits the session-expired signal on `UNAUTHENTICATED`. `ApiError.code` keeps the known codes as a union but accepts any string, so backend codes the app doesn't list (e.g. `403 USER_PENDING` for a Pending user) pass through with the API's message; a body that isn't the envelope becomes `INTERNAL_ERROR` with the HTTP status in `details`.
- Perfil doesn't show which backend it talks to. The Session doesn't store which API it was opened against; a token from another backend gets a 401 on the background `/me` and returns to Login.
- `.env.example` (committed; `.env` is ignored) documents `EXPO_PUBLIC_API_URL` for the iOS simulator (`localhost`), the Android emulator (`10.0.2.2`) and a device on the LAN (the Mac's IP).
- Mock implementation: a shared in-memory mock backend (`src/shared/mock-backend/`, ADR-0002) built from the prototype's `EVENTS` constant (Ana & Rafael, Chá da Júlia, Marcos 40, Festa de fim de ano Vera Cruz, Offsite Kora 2026 archived) with memberships keyed by user id, and each feature's `mock.ts` a thin adapter over it, calling it with the Session's User (a Live session's token means nothing to the mock, and a User unknown to the sample data is a member of no Event); enforces the same visibility and permission rules and returns the same error codes as the real API; ~300 ms latency in dev; Verification results live in memory only (reset on reload).
- Implementation selection, inside each feature's `api.ts`: Demo mode → always mock; Live session → HTTP for modules listed in `LIVE_MODULES` (`src/shared/lib/live-modules.ts`; `auth` joins in PROJ-86), mock for the rest. The mock is only ever selected in development builds.
- TanStack Query for fetching and caching; verify/reject use optimistic updates driven by the domain reducer, with rollback on error. The reducer also decrements the Event's `paidContributionCount` in the cached list and detail, so the hero and chip update at once.
- Freshness (every query): `staleTime` 30 s, and TanStack's `focusManager` wired to `AppState` in `shared/lib`, so data refetches when the app returns to the foreground (e.g. back from the bank app). Lists get pull-to-refresh (`RefreshControl`, lime spinner); glass skeletons only on the first load, never on a refetch.
- Retry policy on the `QueryClient` (`shouldRetry` in `shared/lib`): queries retry once, only on `NETWORK` or `INTERNAL_ERROR`; every other `ApiError` fails at once, then "Tentar de novo". Mutations (login, verify/reject) never retry automatically.

**Domain module (second seam)**
- Pure functions used by the screens; rules needed by more than one feature (e.g. `canVerify`) live in `src/shared/domain/`, one file per concept (`roles.ts`, `contributions.ts`, `events.ts`), no React. A rule used by one feature only stays in that feature, as a pure module at its root (e.g. `features/profile/account-rows.ts`), and moves to `shared/domain/` when a second feature needs it. The planned rules: `canVerify(event)` (its `status` and the viewer's `membership`, like `canSeeGuests`: Super admin and Owner always, Manager only on an active Event, Viewer never; the Viewer notices key on the role, not on `!canVerify`), viewer role label (`roleLabel(membership)`: the membership role, with "· principal" for the Primary owner; "Super admin" when there is no Membership, which the API sends only to the Super admin), Contribution ordering (`sortContributions`: `PAID` by `paidAt` ascending, then `VERIFIED`/`REJECTED` by `paidAt` descending), counters (hero total across visible Events, per-Event pending count for the chip/dot, `VERIFIED` sum), the Events list order (`sortEvents`: active by `startsAt` ascending, then archived by `startsAt` descending; the app sorts, not the API), the `VERIFIED` sum (`verifiedAmount`), the member label (`memberRoleLabel`), `formatMoney`, archived handling (`canSeeGuests(event)` (its `status` and the viewer's `membership`): an archived Event's Guest data only for Owners and the Super admin), the RSVP/Contribution day (`formatEventDay(iso, timezone)`: `dd/mm` in the Event's timezone) and the sheet's "Marcada paga" (`formatEventDayTime`: `dd/mm HH:MM` in the Event's timezone), and the optimistic verify/reject reducer. Single-feature rules from PROJ-88: the members' order (`sortMembers`, `features/members/member-order.ts`); from PROJ-89: the RSVPs' order (`sortRsvps`, `createdAt` descending, `features/rsvps/rsvp-order.ts`) and the Registry item's count label (`contributionCountLabel`, `features/registry/contribution-count-label.ts`).

## Testing Decisions

- Good tests exercise external behavior through the two agreed seams and the hooks/Session store; they don't assert on internals, component trees, or styles. A test should survive swapping the mock for HTTP and refactoring the screens.
- **Seam 1 — repository contract suites** (`jest-expo`): one suite per interface, run today against the mock and, as each module joins `LIVE_MODULES`, against the HTTP implementation with `fetch` stubbed. Covers login and `/me`, error envelope → typed error, network failure → `NETWORK`, `UNAUTHENTICATED` → session-expired signal, Event visibility by role, an archived Event's Guest data only for Owners and the Super admin, verify/reject only from `PAID`, Viewer → `FORBIDDEN`, Receipt missing → `NOT_FOUND`.
- **Seam 2 — domain module**: role label, `canVerify`, `PAID`-first ordering, counters, archived handling, and the optimistic reducer's before → after state (hero, badge, "Verificado").
  - Since PROJ-90, `canVerify` is tested across role × Event status (Owner, Manager, Viewer, Super admin; active and archived).
- **Hooks and Session store** (React Native Testing Library `renderHook`): login, Session restore on reopen, "Sair" clears the Session but keeps the saved email, Demo mode never touches the saved email.
- Not tested automatically yet: components, `Glass`, navigation, animations. RNTL is installed; screen tests come when a screen carries a rule (e.g. Verification buttons hidden for Viewers). Validated manually on an iPhone (Expo Go) day to day, and in the iOS 26 simulator before a story closes.
- Prior art: this repo has none yet. The backend (`events-api`) uses Vitest with pure unit tests for policy modules (e.g. AccessPolicy/MembershipRules matrices); follow the same style of table-driven role matrices.

## Out of Scope

- Validating on an Android emulator (no Android SDK installed yet): Android must compile and keep its fallback isolated in `Glass`, but "done" is the iOS simulator (iOS 26+ runtime, native glass).
- Dev builds / EAS / store publishing.
- Snapshot and E2E tests; component tests until a screen carries a rule.
- Any write besides Verification: creating/editing Events, members, Registry items, RSVPs; archiving; password change / user activation (events-api #4).
- Sign-up (only the Super admin creates Users).
- Demo mode in release builds.
- Persisting mock Verification results; offline support beyond the demo.
- Light mode, landscape, tablets, haptics, push notifications, i18n beyond pt-BR.
- Pagination (events-api #29, V2) and automatic Pix verification via PSP (events-api #27).
- Any change to the events-api backend.

## Further Notes

- Design source of truth: `docs/design/` (README with tokens, screens, states; `Events App Glass.dc.html` prototype, open in Chromium; its `EVENTS`, `view()` and `lensMap()` document mock data, role rules and refraction). The HTML is a reference, not code to copy. The handoff's original `PROMPT.md` is superseded by this spec.
- Domain: glossary and ADRs live in `penteado40/events-api` (`CONTEXT.md`, ADR-0003 roles/Primary owner, ADR-0004 Contributions — "paid" is a Guest declaration, not proof; ADR-0008 API contract).
- Backend dependencies that unblock switching modules to HTTP: events-api #5 (Events + AccessPolicy, with `membership` on each Event; Jira PROJ-55), #17's `paidContributionCount` on `GET /events` (Jira PROJ-67), #6 (members), #10 (RSVP), #13 (Registry items), #17 (Verification + Receipt).
- CORS in the backend is localhost-only outside production; irrelevant for native, matters only for `expo start --web`.
- Local setup needed before PROJ-85 closes: install Xcode, an iOS 26+ simulator runtime, and `sudo xcode-select -s /Applications/Xcode.app`. Real login test: backend `npm run dev` with `admin@local.test / admin123`.
- Slices (Jira, epic PROJ-84): PROJ-85 walking skeleton · PROJ-86 real login · PROJ-87 events list · PROJ-88 event detail · PROJ-89 RSVPs and Presentes · PROJ-90 Conferir and read-only sheet · PROJ-91 Verification · PROJ-92 fidelity review.

