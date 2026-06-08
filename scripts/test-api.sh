#!/usr/bin/env bash
# Smoke-test the Ticket API (run after: pnpm --filter @workspace/api-server run dev)
set -euo pipefail

BASE="${API_BASE_URL:-http://localhost:8080}"

echo "==> API root"
curl -sf "$BASE/api" | head -c 500
echo -e "\n"

echo "==> Health"
curl -sf "$BASE/api/healthz"
echo -e "\n"

echo "==> Admin login"
TOKEN=$(curl -sf -X POST "$BASE/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"glory2026"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
echo "Token received (${#TOKEN} chars)"

echo "==> Stats"
curl -sf -H "Authorization: Bearer $TOKEN" "$BASE/api/stats/summary"
echo -e "\n"

echo "==> List tickets"
curl -sf -H "Authorization: Bearer $TOKEN" "$BASE/api/tickets?limit=3"
echo -e "\n"

echo "All API smoke tests passed."
