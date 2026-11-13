# ohmycoach-marketplace

Public Marketplace website of OhMyCoach (D-069): athletes browse, buy, cancel and redeem coach codes; publishers manage the programs they sell. React 18 + TypeScript + Vite SPA.

Product rules live in `docs/shared/` (synced from `ohmycoach-docs`, never edited here). The decision log `docs/shared/05-decision-log.md` wins over every other document.

## Requirements

- Node 22 (`.nvmrc`)
- A signed-in `gh` session to pin a new API contract

## Commands

```bash
npm install
cp .env.example .env.local    # VITE_API_BASE_URL and VITE_APP_ENV only
npm run dev                   # http://localhost:5174
npm run lint && npm run typecheck && npm test
npm run check:locales         # es.json has exactly the keys of en.json
npm run e2e                   # Playwright against the production build on :4174
npm run build
```

## API contract

The backend owns the contract. `contracts/` pins a release of `ohmycoach-backend` and `src/api/generated/` is generated from it; never edit either by hand.

```bash
npm run update:contract -- contract-v0.6.0   # download openapi.json, VERSION, CHANGELOG.md
npm run generate:api                          # regenerate src/api/generated/schema.d.ts
```

CI fails when the generated client does not match the pinned contract.

## Shared docs

`docs/shared/` is a copy of `ohmycoach-docs/docs/shared/`. Sync it from the docs repository with `scripts/sync-shared-docs.sh`; the `Check shared docs` workflow compares it with the master and needs the repository secret `DOCS_REPO_TOKEN` (fine-grained, read-only Contents on `ohmycoach-docs`).

## Deployment

`deploy-staging.yml` builds and uploads to S3 + CloudFront (`market.<domain>`). It stays disabled until the repository variable `DEPLOY_ENABLED` is `true`.
