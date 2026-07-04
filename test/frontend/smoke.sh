#!/usr/bin/env bash
set -euo pipefail

# Simple frontend smoke test for NILETRON
# Usage: BASE_URL=http://localhost:3000 ./test/frontend/smoke.sh

BASE_URL=${BASE_URL:-http://localhost:3000}
echo "Frontend smoke tests against $BASE_URL"

echo -n "Checking / (root) ... "
root_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$root_code" = "200" ]; then
  echo "OK"
else
  echo "FAIL (status=$root_code)"
  exit 1
fi

echo "Frontend smoke tests passed."
