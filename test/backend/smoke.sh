#!/usr/bin/env bash
set -euo pipefail

# Simple backend smoke test for NILETRON
# Usage: BASE_URL=http://localhost:4009 ./test/backend/smoke.sh

BASE_URL=${BASE_URL:-http://localhost:4009}
echo "Backend smoke tests against $BASE_URL"

echo -n "Checking /api/health ... "
health_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$health_code" = "200" ]; then
  echo "OK"
else
  echo "FAIL (status=$health_code)"
  exit 1
fi

echo -n "Checking / (root) ... "
root_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$root_code" = "200" ]; then
  echo "OK"
else
  echo "FAIL (status=$root_code)"
  exit 1
fi

echo "Backend smoke tests passed."
