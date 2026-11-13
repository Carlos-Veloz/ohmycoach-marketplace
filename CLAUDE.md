# CLAUDE.md: ohmycoach-marketplace

Public Marketplace storefront of OhMyCoach (D-069). See `README.md` for commands.

## Shared docs: always check the master first

`docs/shared/` is a copy of the master in `../ohmycoach-docs/docs/shared/` (repository `Carlos-Veloz/ohmycoach-docs`). The `Check shared docs` workflow fails the CI whenever the copy differs from the master's `main`.

Before starting a task, and again before every commit or push:

1. Update the master: `git -C ../ohmycoach-docs pull --ff-only`.
2. Compare: `MASTER_DIR=../ohmycoach-docs/docs/shared scripts/check-shared-docs.sh`.
3. If it differs, sync first and commit it on its own as `sync shared docs`, then continue:
   ```bash
   rsync -a --delete --exclude '.DS_Store' --exclude '06-monetization-post-mvp.md' \
     ../ohmycoach-docs/docs/shared/ docs/shared/
   ```
4. If the sync changed `workout-schema/` or a decision affects the API, check whether the backend published a new contract (`npm run update:contract -- <tag>`, then `npm run generate:api`).

Never edit `docs/shared/` in this repository; changes go to `ohmycoach-docs` through a pull request.

## Rules

- The decision log `docs/shared/05-decision-log.md` wins over every other document. If something is not specified, ask or record an open question in `docs/05-open-questions.md`; do not invent behavior.
- English in code, identifiers, locale keys, file names, commits and docs. User-facing text lives in `locales/` and is shown in Spanish only, informal "tú" (D-062).
- Auth uses `client: STOREFRONT` (own refresh cookie `ohmycoach_market_refresh`, header `X-OhMyCoach-Client: STOREFRONT` on refresh, backend Q-045). Access token in memory only.
- Money comes from the API in integer cents; never compute prices in the client. Format only through `src/lib/format.ts`.
- API types are generated from the pinned `contracts/openapi.json`; never hand-write or edit them.
