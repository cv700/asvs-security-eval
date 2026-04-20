# ASVS Security Lab

17 cybersecurity evaluation environments that test whether coding agents follow document-grounded operational requirements. Each environment contains a Node.js codebase with a security bug, 2-4 authority documents, visible tests (agent sees), and hidden tests (agent never sees).

## Quick Start

```bash
# Install Python dependencies
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Validate all three calibration states (no API key needed)
bash scripts/validate_all.sh

# Run a model against a task
export ANTHROPIC_API_KEY="sk-..."
python3 scripts/run_claude.py --task ASVS-AUTHZ-0001

# Run with specific model and multiple trials
python3 scripts/run_claude.py --task ASVS-AUTHZ-0001 --model claude-opus-4-20250514 --runs 3

# Run with OpenAI model
export OPENAI_API_KEY="sk-..."
python3 scripts/run_claude.py --task ASVS-AUTHZ-0001 --model gpt-4o

# Run authority-ablation (contamination probe)
python3 scripts/run_claude.py --task ASVS-AUTHZ-0001 --strip-authority
```

## Architecture

```
tasks/{TASK_ID}/
├── TASK.md                    # Agent-facing prompt (describes the visible bug)
├── task.yaml                  # Task metadata, file lists, test commands
├── repo_snapshot/             # Codebase with security bug + authority documents
│   ├── *.js                   # Source code to fix
│   ├── public.test.js         # Visible tests (agent sees these)
│   └── *.md                   # Authority documents (incident reports, policies, specs)
├── candidates/
│   ├── bad/                   # Passes visible tests, fails hidden tests
│   └── good/                  # Passes both visible and hidden tests
└── grader/
    └── hidden_test.js         # 3 hidden checks (agent never sees these)
```

## Three-State Calibration

Every task ships with three verified states:

| State | Visible | Hidden | What it proves |
|-------|---------|--------|----------------|
| Baseline (repo_snapshot) | FAIL | FAIL | Tests detect the bug |
| Bad candidate | PASS | FAIL | Hidden tests discriminate |
| Good candidate | PASS | PASS | Task is solvable |

Validate with: `bash scripts/validate_all.sh`

## The 17 Tasks

| Task | Domain | OWASP/OAuth |
|------|--------|-------------|
| ASVS-AUTHZ-0001 | Multi-tenant field-level authorization | ASVS v8 |
| ASVS-PRIVACY-0001 | Data deletion with legal hold + retention | ASVS v8 |
| ASVS-TLS-0001 | Certificate chain, OCSP, HSTS | ASVS v12 |
| ASVS-CORS-0001 | CORS with cache poisoning prevention | ASVS v3 |
| ASVS-COOKIE-0001 | Cookie security during HTTPS migration | ASVS v7 |
| ASVS-CSP-0001 | Content Security Policy with CDN | ASVS v3 |
| ASVS-CRYPTO-0001 | Dual-algorithm crypto migration | ASVS v8 |
| ASVS-FORGOT-0001 | Password reset token lifecycle | ASVS v6 |
| ASVS-HEADER-0001 | Security headers behind reverse proxy | ASVS v3 |
| ASVS-INJECT-0001 | SQL injection + output encoding | ASVS v1 |
| ASVS-LOG-0001 | Security logging with PII masking | ASVS v16 |
| ASVS-MIGRATE-0001 | Transparent password rehash migration | ASVS v6 |
| ASVS-RATE-0001 | Rate limiting with mobile compatibility | ASVS v6 |
| ASVS-SESSION-0002 | Session management with MFA | ASVS v7 |
| OAUTH-PKCE-0001 | PKCE + implicit flow removal | OAuth 2.1 |
| OAUTH-REFRESH-0001 | Refresh token rotation + replay detection | OAuth 2.1 |
| OAUTH-SCOPE-0001 | Scope migration with backward compat | OAuth 2.1 |

## Grading

Each task produces a 2x1 outcome:

| Visible | Hidden | Interpretation |
|---------|--------|----------------|
| FAIL | FAIL | Cannot fix the bug |
| PASS | FAIL | Fixes the bug but misses operational requirements |
| PASS | PASS | Recovers purpose from authority documents |

Hidden test pass rate conditional on visible test pass is the primary metric.

## Results

Model run results are saved as JSON in `results/`. Each file contains the full transcript, applied edits, and per-check results.

```bash
# Result file naming: {TASK}_{model}_{timestamp}.json
# Ablation runs: {TASK}_{model}_ablation_{timestamp}.json
```

## Dependencies

- **Runtime**: Node.js 18+ (for `node:test` and `node:assert/strict`)
- **Harness**: Python 3.10+ with `pyyaml`, `anthropic`, `openai` (`pip install -r requirements.txt`)
- **API**: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` environment variable (provider auto-detected from model name)
- **Validation only**: Node.js + Python with `pyyaml` (no API key needed)

## Directory Layout

```
├── README.md              # This file
├── TASK_SPEC.md           # Normative specification for the split-verifier architecture
├── requirements.txt       # Python dependencies
├── suite.yaml             # Suite metadata
├── tasks/                 # 17 task environments
├── scripts/               # Run harness, validation, analysis tools
└── results/               # Model run outputs (JSON)
```

## License

CC BY-NC 4.0. Free for research and evaluation. For commercial licensing, contact coopveit@gmail.com.
