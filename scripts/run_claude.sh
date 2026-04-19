#!/usr/bin/env bash
set -euo pipefail

# Run Claude against ASVS security lab tasks.
#
# Usage:
#   ./scripts/run_claude.sh OAUTH-REFRESH-0001                          # Single run, Sonnet
#   ./scripts/run_claude.sh OAUTH-REFRESH-0001 --model claude-opus-4-20250514  # Single run, Opus
#   ./scripts/run_claude.sh OAUTH-REFRESH-0001 --strip-authority        # Contamination probe
#   ./scripts/run_claude.sh OAUTH-REFRESH-0001 --runs 3                 # 3 runs for pass@k
#
# Run the 5 strongest tasks:
#   for t in OAUTH-REFRESH-0001 ASVS-AUTHZ-0001 ASVS-CSP-0001 ASVS-COOKIE-0001 ASVS-TLS-0001; do
#     ./scripts/run_claude.sh "$t"
#     ./scripts/run_claude.sh "$t" --model claude-opus-4-20250514
#   done
#
# Run contamination probes:
#   for t in OAUTH-REFRESH-0001 ASVS-COOKIE-0001 ASVS-AUTHZ-0001; do
#     ./scripts/run_claude.sh "$t" --strip-authority
#   done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASK_ID="${1:?Usage: run_claude.sh TASK-ID [--model MODEL] [--strip-authority] [--runs N]}"
shift

if command -v uv >/dev/null 2>&1; then
  PYTHON_CMD=(uv run python)
else
  PYTHON_CMD=(python3)
fi

cd "$ROOT"
"${PYTHON_CMD[@]}" scripts/run_claude.py --task "$TASK_ID" "$@"
