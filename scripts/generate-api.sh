#!/usr/bin/env bash
# Regenerates the typed API client from the pinned backend contract.
# Usage: scripts/generate-api.sh [path-or-url-to-openapi.json]
# Default source: contracts/openapi.json (version in contracts/VERSION).
# Generated files are never edited by hand (docs/04 section 1).
set -euo pipefail
cd "$(dirname "$0")/.."
SOURCE="${1:-contracts/openapi.json}"
OUT_DIR="src/api/generated"
mkdir -p "$OUT_DIR"
npx --no-install openapi-typescript "$SOURCE" --output "$OUT_DIR/schema.d.ts"
echo "API types generated from $SOURCE"
