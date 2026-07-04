#!/usr/bin/env bash
set -euo pipefail

echo "Running backend smoke tests"
bash test/backend/smoke.sh

echo
echo "Running frontend smoke tests"
bash test/frontend/smoke.sh

echo
echo "All smoke tests passed."
