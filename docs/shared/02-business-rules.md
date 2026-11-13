<!-- SHARED DOCUMENT: identical in ohmycoach-mobile, ohmycoach-backend, ohmycoach-web-admin and ohmycoach-marketplace. Do not edit in a single repository. -->

# 02. Business Rules

> Functional source of truth for the MVP. Each rule cites the decision that created it (`05-decision-log.md`). If a rule and a decision disagree, the decision log wins and this document must be fixed.
> Roles are defined in `03-roles-and-permissions.md`; the workout data model in `04-workout-block-model.md`.

## 1. Surfaces

- **Mobile app (`ohmycoach-mobile`)**: athlete-facing only. Used to consult programming, log sessions and scores, capture PRs, check in, book specialists, and follow the Marketplace programs the account already has (D-003, D-069). The app has no Marketplace shelf, purchase flow, prices or purchase prompts.
- **Web admin (`ohmycoach-web-admin`)**: management for `OWNER`, `COACH`, `SPECIALIST` and `SUPER_ADMIN`. A single account can use both surfaces. Athlete roles cannot enter the web admin.
- **Marketplace storefront (`ohmycoach-marketplace`)**: public website for browsing, buying, managing subscriptions and redeeming coach codes (athletes), and for publishers to manage their sold programs (D-069). The same account works in all three surfaces.
- Staff who sign into the mobile app see the athlete experience with the `ADVANCED` program available, because they are automatic members of the advanced group (D-017, D-046).
- Mobile is one app with a dynamic theme per tenant, not one build per gym.

## 2. White-label

- At the owner's first login in the web admin, the tenant theme is configured: logo, primary/accent color, background color, text color and typeface (D-043).
- Tenant colors are `#RRGGBB` (no alpha). The wizard warns when a color pair fails WCAG AA but lets the owner save; the backend validates the format only (D-070).
- The typeface is chosen from the curated set of 8 families bundled inside the app (D-061, keys in `theme/theme-tokens.json`), stored as `font_family` in the tenant configuration; the default is `inter`. No external fonts are downloaded. The backend rejects values outside the set.
- When a user linked to a gym signs in on mobile, the app applies the tenant theme at runtime.
- Users without a gym (`OPEN_ATHLETE`, coaches without gym) see the default "Fitness Dark Theme" (palette in `theme/theme-tokens.json`, D-061). A user who leaves a gym stops seeing that gym's theme (D-006).
- Status colors are not part of the tenant theme. Light tenant backgrounds use the `status_on_light` colors in `theme/theme-tokens.json`; every status uses one of four tones (success, adjusted, error, neutral) and always carries a label or an icon (D-063).
- The web admin onboarding includes a responsive preview that simulates the mobile app.

## 3. Gym membership

### Codes (D-042, D-050)
- A gym has a **box code**; a publisher has a **coach code**. They share one global namespace; the system resolves which kind was typed. The mobile app has one field that accepts **gym codes only**; a coach code is redeemed in the storefront (D-069).
- Format: lowercase letters, digits and underscore, starting with a letter, 4 to 24 characters, case-insensitive (for example `balerion_ags`). Reserved words (`admin`, `ohmycoach`, `support`, `api`, and similar) are blocked.
- The owner or publisher proposes the code and `SUPER_ADMIN` approves it during manual provisioning (D-012). Codes are not self-editable; `SUPER_ADMIN` changes one and the old code is retired permanently.
- The gym has **one printed static QR** (downloaded from the web admin) that encodes only the box code. A member who scans it checks in; a non-member who scans it sends a join request.

### Joining
- Entering or scanning a **box code** creates a **pending join request**. The owner or a coach approves or rejects it from the web admin inbox (D-014). Until approved the user keeps their current role (usually `OPEN_ATHLETE`). On approval the user becomes `NORMAL_USER` of that gym.
- A **coach code** is redeemed only in the Marketplace storefront and starts a trial (section 13). The mobile app reports it as not valid.
- A user belongs to **one gym at a time** (D-006). Joining another gym while a member requires leaving the first.

### Leaving
- When a user leaves a gym or is removed, they keep their account, personal data, PRs and history, become `OPEN_ATHLETE` (`tenant_id` null) and see the default theme (D-006, D-046).
- Membership status (`PAID`, `PENDING`, `OVERDUE`) is a manual record kept by the owner in the CRM; it never blocks access or demotes the athlete (D-048).

## 4. Groups and program audiences (D-046)

- Owners and coaches create **groups** of athletes in the CRM (name and members). Groups also filter the CRM and target announcements.
- Every approved member of the gym sees the `CLASS` program with no group needed.
- The gym's `ADVANCED` program is assigned to **one group**, its audience. A member of that group is a `PRO_ATHLETE`. Staff (`COACH`, `OWNER`, `SPECIALIST`) are automatic members, shown with a staff badge, and are removed when they stop being staff.
- An athlete can ask a coach to leave the advanced group at any time. They stay in the gym as `NORMAL_USER` and only see `CLASS`. The coach can add them again.
- If an athlete leaves the gym, they leave the group and become `OPEN_ATHLETE`. If they join another customer gym, they are `OPEN_ATHLETE` until the join request is approved, and start there as `NORMAL_USER`.

## 5. Programs and programming

### Program types (D-007, D-033)
| Type | Owner | Audience | Notes |
| :-- | :-- | :-- | :-- |
| `CLASS` | Gym | All approved members | One per gym. No checkboxes, no feedback form. Score entry allowed. |
| `ADVANCED` | Gym | The advanced group (and staff) | One per gym. Checkboxes, progress bar, "Finish workout" and feedback. |
| `CUSTOM` | Gym | One athlete | Created and assigned by a coach from the athlete's CRM profile. Checkboxes and feedback. |
| `MARKETPLACE` | A publisher (a person, `tenant_id` null) | Subscribers | Sold as a monthly subscription. Checkboxes and feedback. |

- A program is a first-class entity and every workout belongs to a program.
- Gym programs (`CLASS`, `ADVANCED`, `CUSTOM`) belong to the tenant and **cannot be sold**. A publisher sells separate Marketplace programs; duplicating a day from a gym program into a Marketplace program is allowed and the two programs stay independent (D-059).
- A special day (for example a "Competitors Track") is a normal workout with an optional `track_label`, not a separate program (D-033).

### `CUSTOM` plans (D-058)
- A coach creates a `CUSTOM` program for one athlete from the CRM and assigns it. Payment between the athlete and the gym happens outside the app in the MVP.
- A gym member without a `CUSTOM` plan sees a **locked card** with the legend *"Get in touch with your coach to find out how we can help you reach your goals"* and a button that sends an in-app **personalized plan request** to the gym inbox (owner and coaches). One open request per athlete at a time; any recipient can mark it handled. `OPEN_ATHLETE` does not see the card.

### Authoring and publishing (D-004, D-043)
- Programming is captured **only as structured JSON blocks** in the web admin builder: "+ Add block" buttons with drag-and-drop used for reordering. There is no rich-text editor and no text parser.
- Workouts have `status` `DRAFT` or `PUBLISHED`. Saving a draft sends no notification. Pressing **Publish** can send a push notification (FCM) to the program's athletes (`notify_athletes`), so coaches can edit freely without spamming.
- **Publish week** publishes every draft of one program's calendar week at once and sends at most one push. The backend sends at most one programming push per program, per athlete, per local day, never for a week the athlete cannot see yet, and never for edits of a published workout (D-066).
- Coaches and publishers can program any number of weeks ahead. Athletes see only the published workouts of their current week (Sunday to Saturday, athlete's time zone); future weeks stay hidden until they start, past weeks stay visible read-only (D-064).
- A published workout cannot be unpublished in the MVP; it is edited or deleted instead (D-064).
- A published workout can be edited at any time. It carries a `revision` counter; `block_id` values stay stable so athletes' logs remain attached to their block. There is no version history in the MVP.
- Deleting is soft (`deleted_at`) and never cascades to athlete logs (D-043).
- The movement catalog is global and edited only by `SUPER_ADMIN`; each catalog movement may carry a `pr_family` that only pre-selects the PR in the builder (D-029, D-038). A coach may type a free-text movement; it has no load calculation, no movement alerts and no `pr_family`, but appears by name in the feedback picker.
- `Clean` means Squat Clean and `Snatch` means Squat Snatch; power variations are always named explicitly (D-031).

## 6. Personal Records and load calculation (D-024, D-035, D-047)

- **Personal Records** (Profile -> Personal Records, formerly "Benchmarks") are captured manually by the athlete. Only 1RM loads are stored, in two sections: `STRENGTH` and `WEIGHTLIFTING`. The catalog is `workout-schema/seed_pr_catalog.json`; `SUPER_ADMIN` can extend it.
- Each update is a new record (value, unit, date); the latest is current. History feeds passive progress charts.
- A part with percentages carries `percentage_reference`, a PR key chosen by the coach (the builder suggests the movement's `pr_family`). The movement performed is independent of the reference. Only `STRENGTH` and `WEIGHTLIFTING` keys can be references.
- **Calculation:** `load = 1RM x percentage`, converted to the user's `weight_unit_preference` (1 kg = 2.20462 lb) and rounded to the nearest plate increment (0.5 kg or 2.5 lb by default). A UI toggle switches between percentage and real weight.
- **No PR captured:** the app shows the raw percentage and a legend inviting the athlete to capture the PR in Profile -> Personal Records.
- RPE, athlete-chosen loads and absolute weights are displayed as prescribed and never calculated.
- Loads are the only quantities that convert between lb and kg; distances and heights keep their prescribed unit.
- `rx_standard` (`MEN` or `WOMEN`) is a profile field chosen at registration and editable. It selects which prescription column is displayed; the user's sex is not stored (D-028).

## 7. Athlete session flow (D-021, D-022, D-026, D-034)

Applies to `ADVANCED`, `CUSTOM` and Marketplace programs. `CLASS` has no checkboxes or feedback form.

1. Each non-optional block has **one completion checkbox**; parts add none. Optional blocks and parts are excluded from the count.
2. A progress bar is pinned under the top app bar: `completed / checkable blocks` with a label such as "3 of 7 · 43%". At 100% it turns into a "Finish workout" action. The inline button at the end of the list is always available. One bar per workout and program.
3. **Finish workout** opens the feedback form: overall status `SUCCESS`, `ADJUSTED` or `FAILED`, plus an optional comment. If the status is `ADJUSTED` or `FAILED`, the athlete selects which movements of that day were affected. The athlete may finish with unchecked blocks; they are recorded as not completed and do not trigger alerts.
4. Warm-up and cool-down text lines have no `movement_key` and do not appear in the picker.
5. Checkboxes and the form are stored locally and synced through the offline queue.

## 8. Scoring and leaderboards (D-027, D-051, D-060)

- Only `METCON` blocks flagged `scored` by the coach, with format `FOR_TIME` or `AMRAP`, capture results. `INTERVALS` WODs and Tabata work-rest parts are not scored. Days without a scored block have no result capture and no leaderboard.
- The athlete picks `RX` or `SCALED` with a selector on the metcon; it also switches the displayed prescription. If only RX is defined there is no selector and the result is `RX`.
- **`FOR_TIME`:** the athlete enters the time, which cannot exceed the cap. When the workout has rest lines (for example "6 rounds, each round for time, rest 2:00"), the time is the total clock time with the rests included (D-071). If the athlete does not finish, the result is `CAP + N`, where `N` is the number of repetitions remaining, only when every movement of the scored version is rep-based. If the version includes distance or calories (for example a run), a capped athlete is recorded as plain `CAP`. `CAP + N` requires the total repetitions to be computable from the structured prescription.
- **`AMRAP`:** the athlete enters completed rounds, the last movement reached and the repetitions done in it, bounded by the prescription. The total repetitions are computed. An `AMRAP` can be scored only with fixed repetitions per round.
- **Leaderboards** exist per day and per program, visible to the program's audience: `CLASS` to all approved members, `ADVANCED` to the advanced group (including staff, who carry a staff badge), each Marketplace program to its subscribers.
- Each leaderboard has two sections, `RX` first and then `SCALED`, each ranked separately with its own Top 10. `FOR_TIME` ranks finishers by time ascending, then capped athletes by fewest remaining repetitions; plain `CAP` results tie at the end of the section. `AMRAP` ranks by total repetitions.
- Leaderboards show the athlete's display name only. Athletes can hide themselves in profile settings. Owners and coaches can remove a result.

## 9. Performance alerts (D-010, D-013, D-025)

- The engine is **rule-based and deterministic**, not AI. A scheduled job (EventBridge-triggered task, D-041) runs the rules daily.
- **Phase 1 rules, fixed in configuration:**
  - *Global fatigue* (`GLOBAL_FATIGUE`): 3 consecutive logged sessions with `ADJUSTED` or `FAILED`.
  - *Movement block* (`TRANSVERSAL_MOVEMENT_BLOCK`): `ADJUSTED` or `FAILED` on the same `movement_key` in 3 consecutive weeks in which that movement was programmed.
  - Rules are evaluated **per athlete and per program**. Free-text movements do not count.
  - The alert suggests a deload or a mobility/physiotherapy evaluation.
- Only programs with a feedback form produce alerts (`ADVANCED`, `CUSTOM`, Marketplace). Logs of staff on the athlete view never generate alerts and staff do not count as active athletes (D-043).
- **Recipients:** gym programs have a recipient list editable only by the `OWNER`. Defaults are the program creator and the owner. A `CUSTOM` plan alerts its assigned coach (`assigned_coach_id`, by default its creator, editable by the owner or that coach; falls back to the owner when the coach leaves, D-067). An empty list falls back to the owner. Marketplace program alerts go to the publisher. A coach sees only the alerts of programs where they are a recipient; the owner sees all alerts of the tenant but is notified only where they are a recipient.
- Alerts are delivered to the **in-app inbox of the web admin** only; no web push and no email (D-014). Alert states: `NEW`, `READ`, `RESOLVED`.
- Alerts contain health data, so visibility is need-to-know.
- Phase 2 (rolling 3-month baselines, drops of 20% or more) is post-MVP and needs 6+ months of history and the actual weight lifted.

## 10. Announcements (D-056)

- Owners and coaches publish informational announcements (for example a holiday schedule) to all members or to a group, from the web admin.
- An announcement has an optional **"notify athletes"** push, off by default. Athletes can react with emojis.
- Announcements are separate from performance alerts.

## 11. Attendance and streaks (D-044, D-045, D-054)

### QR check-in
- The athlete scans the gym's printed QR with the app. The app sends one minimal request over mobile data: user, gym, time and coordinates.
- The server accepts the check-in only if the athlete is an **approved member** of that gym, the position is within about **150 m** of the gym location (set once by the owner), and no check-in exists yet that day for that gym.
- Offline scans are queued with the real scan time and synced later.
- Check-in records **entry only** and does not reserve a spot. Turnstile and door integration are out of the MVP.
- The owner's web dashboard shows who is **present now**: check-in within the last 60 minutes, refreshed by polling every 30 to 60 seconds.

### Weekly streak
- A **session** is one distinct calendar day with a gym check-in or a finished workout of a program that has "Finish workout"; several events on the same day count once. Check-in is the path for members who only follow `CLASS`; finishing a workout counts for every athlete, including `OPEN_ATHLETE` and a `NORMAL_USER` subscribed to a Marketplace program.
- A week runs Sunday to Saturday in the user's local time zone (D-065). The weekly goal is **5 sessions** (a global setting); Saturday and Sunday are not required but count and can make up for a missed weekday. The streak is the number of consecutive completed weeks that reached the goal; the current week never breaks it.
- The model stores one record per athlete per session day with its source, derives streaks with a period type (`WEEK` now, `MONTH` later) and a goal, and keeps a generic achievements/milestones concept so monthly streaks and milestone messages can be added without a migration.

## 12. Specialist appointments (D-016 to D-020)

- A gym's specialists are added by the owner. The appointments entry is shown to athletes only when the gym has an active specialist, and is **hidden** otherwise. With specialists but no published availability it shows an empty state. `OPEN_ATHLETE` has no access.
- Specialists manage everything in the web admin: publish and block availability slots, and accept or reject requests from the inbox. They have no CRM, programming or alerts.
- Athlete flow: request a slot (no preselected time; the booking is created only when pressing "Book") -> specialist accepts or rejects -> the athlete gets a push.
- Limits: one appointment per day per specialist, and never the same slot with two specialists.
- An athlete can cancel until the appointment takes place (`CANCELLED` frees the slot and appears in the specialist's inbox). No cancellation window.
- Removing a specialist cancels all their future appointments and notifies the athletes.
- No charging in the MVP.

## 13. Marketplace (D-007 to D-012, D-048, D-055, D-057, D-059, D-060, D-069)

The Marketplace lives in the **storefront website** (`ohmycoach-marketplace`). The mobile app and the web admin contain no catalog, purchase or pricing screens.

- **Publishers:** a user (coach or owner) with a publisher profile activated by `SUPER_ADMIN` creates Marketplace programs in the **storefront publisher panel** (name, description, discipline, price, listing, trial switch) and sees their subscribers there. The **workouts** of those programs are built and published in the web admin builder, and their performance alerts arrive in the web admin inbox. Employee selling with revenue sharing is out of the MVP.
- **Browsing:** anyone can browse the public catalog (search, filters by discipline, program detail, publisher profile). Buying requires an account. Each tenant has `marketplace_visible` (default `true`) so an owner can hide the catalog from the members of that gym; `OPEN_ATHLETE` always sees it.
- **Pricing:** a program must have a price above a platform minimum; programs cannot be free (D-055).
- **Subscription (D-048):** a monthly subscription aligned to the calendar month.
  - Buying mid-month charges `price x remaining days / days in month` (purchase day included) and gives access until the end of the month; on day 1 of each month it renews for the full month unless cancelled.
  - Cancelling is allowed at any time, in the storefront; access lasts until month end; no refund of the current month.
  - An athlete can hold several programs at once, including several advanced ones. Each has its own subscription; buying a new program never cancels another.
  - Statuses: `ACTIVE`, `CANCELLED`, `EXPIRED`. When expired the content is hidden; logs, scores and PRs are kept.
  - **My Programs** lists the subscriptions in the storefront (with cancel) and, read only, in the mobile app (status and access end date, no prices).
- **Coach-code trial (D-057):** redeeming a publisher's coach code in the storefront starts a 3-day free trial of one of that publisher's programs, once per athlete per program. The program appears in the app. When it ends it disappears from the app without any prompt; the storefront offers to subscribe. The trial is reachable only through the code; the publisher can switch it off per program.
- **Experience in the app:** Marketplace programs have checkboxes, progress bar, "Finish workout", feedback, scoring, and a leaderboard among their subscribers (D-060). Alerts go to the publisher.
- **App-store safety rule (D-069):** the mobile app never shows buy buttons, prices, subscribe prompts, "visit our website" text or external purchase links, and its empty states never mention buying.

## 14. Payments (D-002, D-048, D-049)

- All payments are mocked in the MVP behind a **payment provider interface**; the mock always approves, including renewals. The storefront shows a clear "test mode, no real charge" label wherever a price or purchase appears.
- The real subscription cycle (period start and end, statuses, proration) is implemented in the MVP so the full behavior can be tested with users.
- Post-MVP: gym membership payment in the app through the payment provider, recurring charge to a card on file, with card data handled only by the provider's hosted fields; neither OhMyCoach nor gym staff ever see card numbers. Owners set plans and prices and see only payment status. Marketplace sales are web checkout in the storefront only (D-069); see `06-monetization-post-mvp.md` in the backend repository.

## 15. Notifications

| Audience | Channel | Events |
| :-- | :-- | :-- |
| Athletes | Mobile push (FCM) | Published programming (optional, at most one per program per day, D-066), announcements with "notify athletes", appointment accepted/rejected/cancelled, join request approved/rejected |
| Staff | In-app inbox in the web admin only | Performance alerts, join requests, personalized plan requests, specialist appointment requests and cancellations |

## 16. Offline behavior (D-043)

- Reads are cache-first from the local SQLite database; workouts and tenant configuration are read-only on the device and the server wins.
- The device caches only the current week of workouts; past weeks are fetched online on demand and not stored (D-064).
- Athlete-owned records (checkbox state, feedback, scores, PRs, check-ins) are created on the device with client-generated UUIDs, stored in a `PENDING_SYNC` queue and sent with idempotent requests. If the same record is edited on two devices, the last write wins.

## 17. Data lifecycle, security and privacy (D-043)

- All tenant data is filtered by the `tenant_id` of the JWT, never by a client-supplied identifier. `SUPER_ADMIN` and users without a gym are the exceptions.
- Web admin session: short-lived access token (about 15 minutes) kept in memory plus a refresh token in an `httpOnly`, `Secure`, `SameSite` cookie issued by the backend (panel and API share a parent domain). Mobile uses the system secure storage.
- Privacy: a privacy notice (LFPDPPP) and explicit consent at registration; collect only necessary data; an account-deletion endpoint removes personal data and anonymizes logs. A legal review is recommended before launch. GDPR is not targeted until there are users outside Mexico.
- Secrets come from a secrets manager, not from example files.

## 18. Account provisioning (D-012)

- `OWNER` accounts and publisher profiles are provisioned manually by `SUPER_ADMIN` (sales-led onboarding). Owners add their own staff (coaches, specialists) from the web admin. Athletes self-register.
