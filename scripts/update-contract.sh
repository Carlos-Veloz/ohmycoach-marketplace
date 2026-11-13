#!/usr/bin/env bash
# Pins the backend API contract from a release of ohmycoach-backend.
# Usage: scripts/update-contract.sh <tag>   (for example contract-v0.6.0)
# Needs a signed-in `gh` session with read access to the backend repository.
# Then run `npm run generate:api` and commit contracts/ and src/api/generated/ together.
set -euo pipefail
cd "$(dirname "$0")/.."
TAG="${1:?Usage: scripts/update-contract.sh <tag>}"
REPO="Carlos-Veloz/ohmycoach-backend"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
gh release download "$TAG" --repo "$REPO" --dir "$TMP" \
  --pattern openapi.json --pattern VERSION --pattern CHANGELOG.md
if [ "$(tr -d '[:space:]' < "$TMP/VERSION")" != "$TAG" ]; then
  echo "VERSION in the release does not match $TAG" >&2
  exit 1
fi
mkdir -p contracts
cp "$TMP/openapi.json" "$TMP/VERSION" "$TMP/CHANGELOG.md" contracts/
echo "Pinned contracts/ to $TAG"
