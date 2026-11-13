# API contract changelog

Changes to `contracts/openapi.json`. The version is `info.version` (SemVer), defined in `app/version.py`; `contracts/VERSION` holds the matching release tag (`contract-v<version>`), generated with the document. Mobile and web pin a commit or version of `openapi.json` and regenerate their clients from it.

## 0.6.0 (rest lines in the workout schema, D-071)

- **Workout document schema** regenerated from `docs/shared/workout-schema/workout.schema.json`: new `WorkoutRestLine` (`{ "rest": WorkoutRest }`, no other fields) and `WorkoutSequenceItem` (`WorkoutMovementLine` or `WorkoutRestLine`). The `movements` lists of `WOD` versions, `ROUNDS` parts and `INTERVALS` groups now take `WorkoutSequenceItem`. Clients that read those lists must handle items without `name`.
- Validation: the extra rules skip rest lines. A rest line in a scored `AMRAP` does not break `amrap_reps_not_fixed`, and rest lines never carry catalog keys. A rest line with any other field fails the schema (422 `WORKOUT_SCHEMA_INVALID`).
- The `workout_movements` index ignores rest lines.
- New example `competition.json` (seven examples), accepted by `PUT /programs/{program_id}/workouts/{date}`.
- Scoring (M4, not yet in the document): a scored `FOR_TIME` with rest lines scores the total clock time, rests included, with the time cap on the same clock; rest lines never count as repetitions, also for `CAP + N`.

## 0.5.0 (Marketplace storefront, D-069)

- **New client `STOREFRONT`** in `ClientType` (login, refresh, logout) for the Marketplace website (Q-045). Same rules as `WEB` with its own refresh cookie `ohmycoach_market_refresh` (HttpOnly, SameSite=Strict, path `/api/v1/auth`, Secure except local) and the header `X-OhMyCoach-Client: STOREFRONT` on refresh (403 `ORIGIN_NOT_ALLOWED` otherwise). The web admin keeps `WEB` and `ohmycoach_refresh`. Refresh and logout act only on the caller's own cookie, so the two websites keep separate sessions in one browser. A token issued to one client is rejected by the others.
- **New error codes for M6** (raised once the Marketplace endpoints exist, listed now so the storefront can generate its client): `ALREADY_SUBSCRIBED` (409), `QUOTE_CHANGED` (409) and `IDEMPOTENCY_KEY_REUSED` (422) (Q-042, Q-043).
- Specified for M6, not yet in the document: `GET /marketplace/programs/{id}/quote`; `POST /subscriptions` with the required `Idempotency-Key` header and `expected_amount_cents`; public catalog endpoints without a token (60 per minute per IP, `Cache-Control: public, max-age=60`). See `docs/03-api-contract.md` and `docs/05-payments-and-subscriptions.md`.

## 0.4.0 (M2: catalogs and programs)

- **Workout document schema** embedded from `docs/shared/workout-schema/workout.schema.json`: `WorkoutDocument` plus one `Workout<Name>` component per `$defs` entry (for example `WorkoutBlock`, `WorkoutRange`).
- Catalogs: `GET /catalog/movements` (`q`, `include_inactive`, cursor pagination) and `GET /catalog/prs` for any authenticated user; `POST`/`PATCH /catalog/movements/{movement_key}` and `POST`/`PATCH /catalog/prs/{pr_key}` for `SUPER_ADMIN`. Entries expose `is_active`.
- Programs (`OWNER`, `COACH`): `GET /programs`, `POST /programs` (`CUSTOM` only, for an athlete of the gym), `PATCH /programs/{program_id}` (name, description). `CUSTOM` plans carry `assigned_coach_id` (default the creator; changed only by the owner or the current assigned coach; must be an owner or coach of the gym).
- Workouts (`OWNER`, `COACH`):
  - `GET /programs/{program_id}/workouts?from=&to=` (at most 21 days, drafts included).
  - `PUT /programs/{program_id}/workouts/{date}` with `{ status, document }`. The server writes `workout_id`, `program_id`, `date` and `status` into the document and returns it. `revision` increases when a published workout is saved. A published workout cannot go back to `DRAFT` (400 `cannot_unpublish`).
  - `POST /workouts/{workout_id}/publish`, `POST /programs/{program_id}/publish-week` (`week_start` is a Sunday), `POST /workouts/{workout_id}/duplicate`, `DELETE /workouts/{workout_id}` (soft delete).
  - `notify_athletes` is accepted and has no effect until M5. Saving never notifies.
- Athlete feed (athlete roles and staff): `GET /workouts/feed?date=` and `GET /workouts/feed/range?from=&to=` (at most 7 days). Published workouts of the visible gym programs (`CLASS`, `ADVANCED`, own `CUSTOM`). Nothing after the Saturday of the caller's current Sunday-to-Saturday week (400 `WEEK_NOT_VISIBLE` (reason `future_week`)); past dates allowed. `my_log` is null and `my_scores` empty until M4.
- Document errors: 422 `WORKOUT_SCHEMA_INVALID` with document paths for schema failures and the extra rules (`duplicate_block_id`, `duplicate_part_id`, `unknown_movement_key`, `inactive_movement_key`, `unknown_pr_key`, `inactive_pr_key`, `amrap_reps_not_fixed`).
- New error codes: `CATALOG_KEY_TAKEN`, `CUSTOM_PROGRAM_EXISTS`, `WORKOUT_DATE_TAKEN` (409) and `WEEK_NOT_VISIBLE` (400, a feed date after the current week).
- `contracts/VERSION` (`contract-v0.4.0`) is generated with the document, checked by CI and attached to the release, so clients can copy the three contract files together.

## 0.3.1 (M1 follow-up)

No schema changes; behavior only.

- `POST /auth/change-password` now revokes the refresh tokens of the user's other sessions; the calling session stays. Other devices get 401 `INVALID_REFRESH_TOKEN` on their next refresh.
- The access token adds the `sid` claim (the session). Clients must not read it.
- The registration rate limit is now 30 per IP per hour (was 10).
- Provisioning names the default programs `Clase` (CLASS) and `Avanzado` (ADVANCED), and the advanced group `Avanzado` (D-062).

## 0.3.0 (M1: identity and tenancy)

First version for mobile (A0) and web admin (W0) to generate their clients from.

- Bearer authentication (`HTTPBearer` security scheme).
- `POST /auth/register` (201, `UserProfile`, rate limited per IP), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password`.
  - Login and refresh take `client: WEB | MOBILE`. MOBILE receives `refresh_token` in the body; WEB receives it only in the `ohmycoach_refresh` cookie (HttpOnly, SameSite=Strict, path `/api/v1/auth`, Secure except local) and the field is absent. WEB refresh requires `X-OhMyCoach-Client: WEB` and an allowed `Origin`.
  - Refresh tokens rotate on every refresh; reuse of a rotated token revokes the session, except the immediately previous token within 30 seconds.
- `GET /me` (`UserProfile`, including `must_change_password`), `GET /tenants/me/config`.
- `POST /admin/tenants`, `GET /admin/tenants` (cursor pagination), `POST /admin/users/{user_id}/temporary-password`.
- While `must_change_password` is true every endpoint answers 403 `PASSWORD_CHANGE_REQUIRED`, except `POST /auth/change-password`, `POST /auth/logout` and `GET /me`.
- New error codes: `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN` (401); `INVALID_CURRENT_PASSWORD`, `CODE_RESERVED` (400); `PASSWORD_CHANGE_REQUIRED`, `TENANT_INACTIVE`, `ORIGIN_NOT_ALLOWED` (403); `EMAIL_ALREADY_REGISTERED`, `CODE_ALREADY_TAKEN` (409).

## 0.2.0 (M0 follow-up: error catalog)

- `ErrorCode` adds `PAYLOAD_TOO_LARGE` (413), `UNSUPPORTED_MEDIA_TYPE` (415) and `RATE_LIMITED` (429).
- `ErrorBody.code` also accepts the generic pattern `HTTP_<status>` (`^HTTP_4[0-9]{2}$`) for any other 4xx produced by the framework, for example `HTTP_406`. A framework 400 without a business rule is `HTTP_400`; `VALIDATION_ERROR` is reserved for business rules.
- Every error response, including CORS preflight rejections, uses the `ErrorResponse` format.

## 0.1.0 (M0 Foundation)

- Infrastructure endpoints at the root: `GET /health`, `GET /health/ready`, `GET /openapi.json`.
- Business endpoints are served under `servers: [{ url: "/api/v1" }]` (none yet).
- Shared error format `ErrorResponse` and the `ErrorCode` enum.
