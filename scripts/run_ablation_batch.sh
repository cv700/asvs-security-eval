#!/usr/bin/env bash
# Run ablation (strip authority docs) on the 8 tasks missing ablation data.
# Estimated cost: ~$3-5 (8 Sonnet runs)
set -euo pipefail
cd "$(dirname "$0")/.."

TASKS=(
  ASVS-FORGOT-0001
  ASVS-HEADER-0001
  ASVS-INJECT-0001
  ASVS-LOG-0001
  ASVS-MIGRATE-0001
  ASVS-SESSION-0002
  ASVS-TLS-0001
  OAUTH-SCOPE-0001
)

echo "=== Ablation Batch: ${#TASKS[@]} tasks ==="
echo "Start: $(date)"

PASS=0
FAIL=0

for task in "${TASKS[@]}"; do
  echo ""
  echo "--- $task (ablation) ---"
  if python scripts/run_claude.py --task "$task" --strip-authority; then
    PASS=$((PASS + 1))
    echo "DONE: $task"
  else
    FAIL=$((FAIL + 1))
    echo "FAILED: $task"
  fi
done

echo ""
echo "=== Ablation Batch Complete ==="
echo "Passed: $PASS / ${#TASKS[@]}"
echo "Failed: $FAIL / ${#TASKS[@]}"
echo "End: $(date)"
