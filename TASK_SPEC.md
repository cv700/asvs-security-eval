# Split-Verifier Task Specification

## Architecture

Each task is a self-contained cybersecurity coding problem with three layers:

```
Authority Documents  →  define requirements and their rationale
Visible Tests        →  agent sees these, confirms basic compliance
Hidden Tests         →  agent never sees these, check purpose recovery
```

The agent receives a repository snapshot containing broken source code, 2-4 authority documents (design specs, incident reports, data classification guides), and a visible test suite. The agent must fix the code to pass the visible tests while satisfying all requirements in the authority documents.

Hidden tests run after the agent submits. They check requirements that are stated in the authority documents but not covered by visible tests — specifically, requirements whose correct implementation depends on understanding *why* the requirement exists, not just *what* it says.

## What's In Each Task

| Component | Description | Agent Sees? |
|-----------|-------------|-------------|
| `repo_snapshot/` | Source code with a security vulnerability | Yes |
| `repo_snapshot/*.md` | 2-4 authority documents (design docs, policies, incident reports) | Yes |
| `repo_snapshot/public.test.js` | 5-7 visible tests confirming basic functionality | Yes |
| `grader/hidden_test.js` | 3 hidden tests checking purpose recovery | No |
| `candidates/bad/` | Reference solution: passes visible, fails hidden | Calibration |
| `candidates/good/` | Reference solution: passes visible and hidden | Calibration |

Runtime: Node.js. Zero external dependencies beyond `node:test` and `node:assert/strict`.

## Three-State Calibration

Every task ships with three verified states:

| State | Visible | Hidden | Purpose |
|-------|---------|--------|---------|
| Baseline (broken code) | FAIL | FAIL | Confirms tests detect the bug |
| Bad candidate | PASS | FAIL | Confirms hidden tests discriminate |
| Good candidate | PASS | PASS | Confirms the task is solvable |

The bad candidate is the critical calibration artifact. It proves the hidden tests catch a *specific* failure mode: a plausible fix that satisfies visible tests but misses the authority documents' deeper requirements.

## Grading

Each task produces a 2x1 outcome:

| Visible | Hidden | Interpretation |
|---------|--------|----------------|
| FAIL | FAIL | Cannot apply rules at all |
| PASS | FAIL | Applies rules but misses purpose |
| PASS | PASS | Recovers purpose from authority documents |

Hidden test pass rate conditional on visible test pass is the primary metric. This measures purpose recovery, not general coding ability.

## What Makes a Task Diagnostic

The strongest tasks have **conflicting requirements** across authority documents. Two rules are both valid, both applicable, and the correct resolution depends on understanding what each rule is protecting in the specific context. The visible tests do not probe the conflict zone.

Example (ASVS-AUTHZ-0001): Principle 3 requires clear error messages for unauthorized field updates. Principle 4 requires opaque "Not found" responses for cross-tenant access. A same-tenant unauthorized field update activates both principles. The correct answer (clear rejection, not opaque response) depends on understanding that Principle 4 protects against tenant existence leakage, which is not at risk in a same-tenant context.

## The 17-Task Battery

**1 stable-hard** (all models fail): AUTHZ
Requires resolving conflicts between authority documents by reasoning about what each rule protects. Both Sonnet and Opus cite the conflicting requirements and implement the wrong one. pass@8 = 0/8.

**2 Sonnet-hard** (Sonnet fails, Opus mostly passes): TLS, PRIVACY
Require restraint against the visible objective. PRIVACY shows non-monotonic scaling: Haiku passes, Sonnet fails, Opus mostly passes (2/3).

**6 variance** (mixed results for at least one model): CORS, PKCE, HEADER, RATE, FORGOT, SCOPE
Require the model to choose the less obvious implementation option. FORGOT is inverted: Opus (2/3) trails Sonnet (3/3).

**8 control** (both models pass consistently): COOKIE, CSP, CRYPTO, INJECT, LOG, MIGRATE, SESSION, REFRESH
Pattern application suffices. Rules are unambiguous or resolvable from general security knowledge.

## Human Baseline (n=1)

Participant: college freshman, intermediate JS, no security experience. 3 tasks (AUTHZ, TLS, RATE).

| Task | Human | Sonnet | Opus |
|------|-------|--------|------|
| AUTHZ | 2/3 | 0/4 | 0/4 |
| TLS | 3/3 | 0/4 | 3/3 |
| RATE | 3/3 | 2/4 | 3/3 |

The human's one failure was a judgment call on error-handling strategy (silent rejection vs thrown error). The model failures are blind spots — requirements read, cited, and not implemented.

## Reproducibility

Tasks follow the METR Task Standard. Each `task.yaml` specifies all file paths, test commands, and grading criteria. No API keys, no external services, no network access required. A full run of all 17 tasks across one model takes approximately 30 minutes.

Suite root: `proof/asvs_security_lab/`
