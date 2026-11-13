#!/usr/bin/env bash
# CI check: fails when docs/shared in the current repository differs from the master.
# Usage (inside a repository): MASTER_DIR=/path/to/master/docs/shared scripts/check-shared-docs.sh
set -euo pipefail
: "${MASTER_DIR:?Set MASTER_DIR to the master docs/shared folder}"
diff -r -q --exclude '06-monetization-post-mvp.md' "$MASTER_DIR" docs/shared && echo "Shared docs are in sync."
