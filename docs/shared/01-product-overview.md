<!-- SHARED DOCUMENT: identical in ohmycoach-mobile, ohmycoach-backend, ohmycoach-web-admin and ohmycoach-marketplace. Do not edit in a single repository. -->

# 01. Product Overview

> Repositories: `ohmycoach-mobile` (Flutter), `ohmycoach-backend` (FastAPI) and `ohmycoach-web-admin` (React + Vite).
> Source of truth for decisions: `05-decision-log.md`. Functional rules: `02-business-rules.md`. Roles: `03-roles-and-permissions.md`. Workout data model: `04-workout-block-model.md`.
> All project documentation is **English only** (D-001): no Spanish and no Spanglish in documents, identifiers, enum values, endpoints, database objects or file names. User-facing copy lives in i18n locale files (D-053).

## 1. What OhMyCoach is

OhMyCoach is a multi-tenant, multi-platform SaaS for functional-fitness and CrossFit-style boxes, independent coaches and athletes. Unlike gym software that stores workouts as static text or PDFs, OhMyCoach models every training day as **structured, modular JSON blocks**. The mobile app and the backend can compute on that structure in real time: percentage-to-load calculation, scoring, alerts and progress tracking.

Three audiences use it, on three surfaces (mobile app, web admin and the Marketplace storefront website, D-069):

| Audience | What they need | Where they work |
| :-- | :-- | :-- |
| Box owners | Retain members, brand the app, manage staff and groups, see attendance, publish announcements | Web admin |
| Coaches (gym coaches and independent publishers) | Program fast without format limits, follow athletes, receive performance alerts, sell programs | Web admin (programming, alerts) and Marketplace storefront (selling) |
| Athletes | Clear workouts, no manual percentage math, quick post-workout log, PRs, check-in, specialists | Mobile app; Marketplace storefront to find and buy programs |

Specialists (therapists, nutritionists) manage availability and appointment requests in the web admin.

## 2. Problems solved

1. **No real-time load calculation.** Athletes compute percentages of their 1RM mentally during intense sessions. OhMyCoach computes the exact load from the athlete's Personal Records and shows percentage or real weight on a toggle.
2. **Rigid programming formats.** Text or PDF workouts cannot be parsed, linked to videos or personalized per set. Blocks, parts, sets, intervals and media are first-class data.
3. **Disconnect between performance and coach.** A rule-based engine alerts coaches about accumulated fatigue and recurring failures on a movement.
4. **Fragmented tooling.** Boxes pay separately for QR access, programming, branding and (later) billing. OhMyCoach unifies them.

## 3. MVP scope

### Inside the MVP
- Authentication, roles and feature flags (`03-roles-and-permissions.md`).
- White-label theme per gym (logo, colors, typeface) in a single mobile app; default "Fitness Dark Theme" when the user has no gym.
- Visual workout builder in the web admin and block-based rendering in the mobile app (`04-workout-block-model.md`).
- Automatic percentage-to-load calculation from Personal Records (Strength and Weightlifting 1RM only).
- Programs per gym: `CLASS`, `ADVANCED` (audience: an athlete group) and `CUSTOM` (one athlete); Marketplace programs owned by publishers.
- Athlete session flow: per-block completion checkboxes, progress bar, "Finish workout" with overall status and affected movements, and score entry for scored metcons with RX/SCALED leaderboards.
- Rule-based performance alerts (Phase 1) delivered to an in-app inbox in the web admin.
- Announcements with optional push and emoji reactions.
- QR check-in, weekly attendance streak (goal 5 sessions), presence view for owners.
- Specialist appointments (web admin for specialists, mobile for athletes).
- Marketplace (separate storefront website, D-069): publisher profiles, programs sold as monthly subscriptions, coach-code trials; the mobile app only follows the programs the account has (read-only My Programs).
- Athlete groups in the CRM and join requests approved by the gym.
- Mocked payments behind a provider interface.
- Offline-first mobile client.
- Android and iOS from day one (single Flutter codebase); first store release is Android (D-052).

### Outside the MVP
- Real payment processing: Stripe, direct debit, B2B subscription per active athlete, Stripe Connect, gym membership charging in the app, Marketplace commission and the `SUPER_ADMIN` revenue monitor (D-048, D-049). See `06-monetization-post-mvp.md` in the backend repository.
- Class booking and capacity control (check-in only records attendance).
- Rich-text programming and text parsers.
- Alert Phase 2 (rolling baselines), monthly streaks and milestone messages (the data model must allow them, D-054).
- Turnstile and electronic door integration.
- Selling a gym's own `CLASS`, `ADVANCED` or `CUSTOM` programs (D-007).
- Gym employee selling with revenue sharing (D-011).
- 3RM/5RM Personal Records, gymnastics skill flags and running PRs (D-047).
- Scoring of interval-style WODs and Tabata (D-027, D-037).
- Loads derived from another set of the same session (D-037).

## 4. Key differentiators

1. **Modular JSON blocks**: parts, sets, ramp-ups, intervals, RX and SCALED versions, coaching notes, media links.
2. **Zero-math loads**: percentage of a chosen PR, converted to the athlete's unit (kg or lb) and rounded to plates.
3. **Rule-based preventive alerts** (not AI): deterministic rules evaluated by a scheduled job (D-025, D-041). No language model or machine learning in the MVP.
4. **Multi-tenant white-label**: logo, colors and typeface per `tenant_id`, applied at login.
5. **Offline-first**: local SQLite (Drift) with a sync queue against the API.
6. **Marketplace and open athletes**: athletes without a gym can follow independent publishers' programs and keep their history if they change gym.

## 5. Glossary

| Term | Meaning |
| :-- | :-- |
| Tenant | A gym (box). Identified by `tenant_id` and a `BOX_CODE`. |
| Program | An ordered collection of workouts with an audience. Types: `CLASS`, `ADVANCED`, `CUSTOM` (gym programs) and `MARKETPLACE`. Every workout belongs to a program. |
| Workout | One training day inside a program, made of ordered blocks. |
| Block | One numbered section of a workout (for example "Strength"), with a type and one or more parts. |
| Part | A lettered sub-section of a block (A, B, C) with its own structure, videos and optional flag. |
| Metcon | A metabolic conditioning block. May be scored (`FOR_TIME` or `AMRAP`) and has `RX` and `SCALED` versions. |
| PR | Personal Record: the athlete's manually captured 1RM for a catalog movement. |
| Percentage reference | The PR key a part's percentages are calculated from. |
| Group | A named set of athletes in a gym. The `ADVANCED` program's audience is one group. |
| Publisher | A user whose publisher profile was activated by `SUPER_ADMIN`; can sell Marketplace programs. |
| Performance alert | A rule-based alert about fatigue or a blocked movement. Not an announcement. |
| Announcement | An informational message from a gym to its members or a group. |
| Session | One calendar day with a gym check-in or a finished workout; used for streaks. |
| Coach code | A publisher's code that gives an athlete a 3-day trial of one of the publisher's programs. |
| Box code | A gym's code (also encoded in the printed QR) used to join the gym and to check in. |
