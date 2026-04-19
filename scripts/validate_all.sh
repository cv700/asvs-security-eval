#!/usr/bin/env bash
# Validate all tasks in the ASVS Security Lab across all candidate states.
set -euo pipefail
cd "$(dirname "$0")/.."

TASKS=$(ls tasks/)
STATES=(baseline bad good)
PASS=0
FAIL=0

for task in $TASKS; do
  for state in "${STATES[@]}"; do
    if python3 scripts/evaluate_state.py --task "$task" --state "$state" 2>&1; then
      PASS=$((PASS + 1))
    else
      FAIL=$((FAIL + 1))
    fi
  done
done

echo ""
echo "=== SUMMARY: $PASS passed, $FAIL failed ==="
exit $FAIL
