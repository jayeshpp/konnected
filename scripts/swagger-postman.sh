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
jq '
  walk(
    if type == "object" and (.header? | type == "array") then
      .header |= map(
        if .key == "x-tenant-id"
        then .value = "{{tenantId}}"
        else .
        end
      )
    else .
    end
  )
' "$DOCS_DIR/postman_collection.json" > "$DOCS_DIR/postman_collection.tmp.json" \
  && mv "$DOCS_DIR/postman_collection.tmp.json" "$DOCS_DIR/postman_collection.json"

jq '
  walk(
    if type == "object" and (.raw? | type == "string") and (.raw | test("\"email\"")) then
      .raw |= sub("\"email\": \"[^\"]*\""; "\"email\": \"{{email}}\"")
    else .
    end
  )
' "$DOCS_DIR/postman_collection.json" > "$DOCS_DIR/postman_collection.tmp.json" \
  && mv "$DOCS_DIR/postman_collection.tmp.json" "$DOCS_DIR/postman_collection.json"


echo "✅ Docs generated at $DOCS_DIR"
