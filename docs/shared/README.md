<!-- SHARED DOCUMENT: identical in ohmycoach-mobile, ohmycoach-backend, ohmycoach-web-admin and ohmycoach-marketplace. Do not edit in a single repository. -->

# Shared documentation

This folder is the same in all four code repositories (the backend also keeps `06-monetization-post-mvp.md`) so that any one of them is self-contained for an AI coding agent. Do not edit it inside a repository: change the master, then run `scripts/sync-shared-docs.sh`.

| File | Content | Copied to |
| :-- | :-- | :-- |
| `01-product-overview.md` | Vision, scope, glossary | all repos |
| `02-business-rules.md` | Functional rules of the MVP | all repos |
| `03-roles-and-permissions.md` | Roles, token claims, permission matrix | all repos |
| `04-workout-block-model.md` | Workout/block/part model and catalogs | all repos |
| `05-decision-log.md` | Decisions D-001 to D-060 (source of truth) | all repos |
| `06-monetization-post-mvp.md` | Post-MVP payments and risks | backend only |
| `workout-schema/` | `workout.schema.json`, seven validated example workouts, seed catalogs, `validate.py` | all repos |

Reading order for an agent: 05 (decisions), 02, 03, 04, then the repository's own `docs/` folder.
