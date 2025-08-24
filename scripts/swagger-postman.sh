#!/bin/bash
set -e

# Monorepo root = one level up from scripts/
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs/api"

# Ensure docs/api exists
mkdir -p "$DOCS_DIR"

# Export swagger.json from running API
echo "Fetching Swagger JSON from API..."
curl http://localhost:5001/docs/api/json -o "$DOCS_DIR/swagger.json"

# Convert Swagger -> Postman collection
echo "Converting Swagger -> Postman collection..."
npx openapi-to-postmanv2 -s "$DOCS_DIR/swagger.json" -o "$DOCS_DIR/postman_collection.json" -p

echo "✅ Docs generated at $DOCS_DIR"
