<!-- SHARED DOCUMENT: identical in ohmycoach-mobile, ohmycoach-backend, ohmycoach-web-admin and ohmycoach-marketplace. Do not edit in a single repository. -->

# 03. Roles and Permissions

> Decisions: D-003, D-007, D-008, D-012, D-016, D-017, D-046, D-059, D-069. Behavior of each capability is in `02-business-rules.md`.

## 1. Roles

The role enum is English and identical in tokens, database and APIs.

| Enum (`role`) | Who | `tenant_id` | Surface | Mobile experience |
| :-- | :-- | :-- | :-- | :-- |
| `NORMAL_USER` | Approved member of a gym who is not in the advanced group | gym | Mobile, storefront | `CLASS`, locked `CUSTOM` card, subscribed Marketplace programs (bought in the storefront) |
| `PRO_ATHLETE` | Member of the gym's advanced group | gym | Mobile, storefront | `CLASS` plus `ADVANCED`, assigned `CUSTOM`, subscribed Marketplace programs |
| `OPEN_ATHLETE` | Athlete without a gym | null | Mobile, storefront | Home with the Marketplace programs the account has, Personal Records, timer; default theme |
| `COACH` | Gym staff coach, a publisher, or both | gym, or null for a coach without a gym | Web admin, storefront if publisher (and mobile as athlete) | Athlete view with `ADVANCED` available |
| `SPECIALIST` | Therapist or nutritionist added by an owner | gym | Web (and mobile as athlete) | Athlete view with `ADVANCED` available, gym theme |
| `OWNER` | Gym owner and tenant administrator | gym | Web (and mobile as athlete) | Athlete view with `ADVANCED` available |
| `SUPER_ADMIN` | Platform administrator | null (global) | Web | None |

Notes:
- There is a single `COACH` role. Gym tools are available when the coach belongs to a tenant; Marketplace tools are available when the user has a **publisher profile**. A coach can have both, one or (for a pure publisher) only the profile (D-008).
- **Selling is a capability, not a role** (D-007). A publisher profile can be held by a `COACH` or an `OWNER`; it is activated manually by `SUPER_ADMIN` (D-012, D-059). Publishers sell from the storefront publisher panel; their Marketplace workouts are built in the web admin, which has no "My Marketplace" context (D-069).
- `OWNER` is separate from `COACH` because it carries tenant administration (staff, white-label, alert recipients). An owner has all gym `COACH` capabilities.
- `PRO_ATHLETE` is **derived**: it means "member of the advanced group" (D-046). The role is computed when issuing the token and is not a manually toggled field. Short-lived access tokens (about 15 minutes) make group changes take effect on the next refresh.
- Staff (`COACH`, `OWNER`, `SPECIALIST`) are automatic members of the advanced group with a staff badge (D-046).
- A user who leaves a gym becomes `OPEN_ATHLETE` and keeps their account and history.

## 2. Token claims

The JWT sent as `Authorization: Bearer <token>` carries:

| Claim | Meaning |
| :-- | :-- |
| `sub` | `user_id` |
| `tenant_id` | Gym id, or null |
| `role` | One value of the enum above |
| `is_publisher` | True when the user has an active publisher profile |
| `exp` | Short expiry (about 15 minutes) |

The backend derives the tenant, the coach and the user from the token. Client-supplied `tenant_id` or `coach_id` parameters are never trusted (D-043). Only `SUPER_ADMIN` and users without a gym bypass tenant filtering.

## 3. Permission matrix

Legend: ✅ allowed, ➖ not allowed, 🔸 only for own records or own scope.

### Athlete experience (mobile)
| Capability | NORMAL | PRO | OPEN | COACH / SPECIALIST / OWNER |
| :-- | :-: | :-: | :-: | :-: |
| See `CLASS` program | ✅ | ✅ | ➖ | ✅ |
| See `ADVANCED` program | ➖ | ✅ | ➖ | ✅ (automatic group member) |
| See assigned `CUSTOM` plan / locked card | ✅ | ✅ | ➖ | ➖ |
| Checkboxes, progress bar, Finish workout (not in `CLASS`) | 🔸 | ✅ | ✅ | ✅ |
| Score entry and leaderboard | ✅ | ✅ | 🔸 Marketplace only | ✅ |
| Personal Records | ✅ | ✅ | ✅ | ✅ |
| QR check-in | ✅ | ✅ | ➖ | ✅ (as gym member) |
| Request appointments with specialists | ✅ | ✅ | ➖ | ➖ |
| See the Marketplace programs the account has, read-only My Programs | ✅ | ✅ | ✅ | ✅ |
| Browse, buy, cancel, redeem coach code | ➖ in the app (storefront only, D-069) | ➖ | ➖ | ➖ |
| Join a gym by code / QR (pending request) | 🔸 leave first | 🔸 leave first | ✅ | ➖ |

"🔸" for `NORMAL_USER` checkboxes means they exist only inside a program that has them (`CUSTOM`, Marketplace). Staff logs generate no alerts and do not count as active athletes (D-043).

### Management (web admin)
| Capability | OWNER | COACH (gym) | COACH (publisher) | SPECIALIST | SUPER_ADMIN |
| :-- | :-: | :-: | :-: | :-: | :-: |
| Build and publish `CLASS` / `ADVANCED` workouts | ✅ | ✅ | ➖ | ➖ | ➖ |
| Create and assign `CUSTOM` plans | ✅ | ✅ | ➖ | ➖ | ➖ |
| Build and publish the workouts of Marketplace programs | ✅ if publisher | ✅ if publisher | ✅ | ➖ | ➖ |
| Manage athlete CRM and groups | ✅ | ✅ | ➖ | ➖ | ➖ |
| Approve or reject join requests | ✅ | ✅ | ➖ | ➖ | ➖ |
| Attend personalized plan requests | ✅ | ✅ | ➖ | ➖ | ➖ |
| Performance-alert inbox | ✅ all of the tenant | 🔸 programs where recipient | 🔸 own programs | ➖ | ➖ |
| Configure alert recipients per program | ✅ | ➖ | ➖ | ➖ | ➖ |
| Publish announcements | ✅ | ✅ | ➖ | ➖ | ➖ |
| Remove a leaderboard result | ✅ | ✅ | 🔸 own programs | ➖ | ➖ |
| Staff management (coaches, specialists) | ✅ | ➖ | ➖ | ➖ | ✅ |
| White-label configuration | ✅ | ➖ | ➖ | ➖ | ✅ |
| Gym location, QR download, presence dashboard | ✅ | ✅ view | ➖ | ➖ | ➖ |
| Membership status records (`PAID`, `PENDING`, `OVERDUE`) | ✅ | ➖ | ➖ | ➖ | ✅ |
| Specialist availability and appointment requests | ➖ | ➖ | ➖ | ✅ | ➖ |
| `marketplace_visible` switch (hides the storefront catalog from the gym's members) | ✅ | ➖ | ➖ | ➖ | ✅ |
| Provision owners and publisher profiles, approve codes | ➖ | ➖ | ➖ | ➖ | ✅ |
| Edit global movement catalog, `pr_family` and PR catalog | ➖ | ➖ | ➖ | ➖ | ✅ |

Route guards: the three athlete roles are denied every web admin route. A `SPECIALIST` can reach only the availability and appointment inbox routes. `SUPER_ADMIN` has no mobile experience.

## 4. Visibility of sensitive data

- Performance alerts and feedback can contain health information. They are visible only to their recipients (need-to-know) and to the athlete who wrote them.
- Leaderboards show display names only and respect each athlete's "hide me" setting.
- Card data never reaches OhMyCoach servers or staff (D-049).

### Storefront (`ohmycoach-marketplace`, D-069)
| Capability | Athlete roles | COACH / OWNER with publisher profile | SUPER_ADMIN |
| :-- | :-: | :-: | :-: |
| Browse the public catalog | ✅ (hidden when the member's gym sets `marketplace_visible` to false) | ✅ | ➖ |
| Register, sign in, buy, cancel own subscriptions | ✅ | ✅ | ➖ |
| Redeem a coach code (3-day trial) | ✅ | ✅ | ➖ |
| Create and edit own Marketplace programs (name, description, price, listing, trial switch) | ➖ | ✅ | ➖ |
| See subscribers of own programs | ➖ | ✅ | ➖ |
| Activate a publisher profile | ➖ | ➖ | ✅ (web admin back-office) |
