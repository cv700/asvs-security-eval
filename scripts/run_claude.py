#!/usr/bin/env python3
"""Run a coding model against an ASVS security lab task.

Sends the task prompt + repo snapshot to the model, applies returned edits,
then runs visible and hidden tests. Saves full results (including raw
transcript) as JSON for analysis and annotation.

Supports Anthropic (Claude) and OpenAI (GPT) models. Provider is auto-detected
from the model name, or set explicitly with --provider.

Supports authority-ablation mode for contamination probes: --strip-authority
removes authority documents from the prompt to test whether the model passes
hidden checks from training data alone.

Usage:
    uv run python scripts/run_claude.py --task OAUTH-REFRESH-0001
    uv run python scripts/run_claude.py --task OAUTH-REFRESH-0001 --model claude-opus-4-20250514
    uv run python scripts/run_claude.py --task OAUTH-REFRESH-0001 --model gpt-4o --provider openai
    uv run python scripts/run_claude.py --task OAUTH-REFRESH-0001 --strip-authority
    uv run python scripts/run_claude.py --task OAUTH-REFRESH-0001 --runs 3
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

import yaml


SYSTEM_PROMPT = "You are a careful Node.js security engineer. Return JSON only."


def detect_provider(model: str) -> str:
    if model.startswith("claude-") or model.startswith("anthropic/"):
        return "anthropic"
    if model.startswith("gpt-") or model.startswith("o1") or model.startswith("o3") or model.startswith("o4"):
        return "openai"
    raise ValueError(
        f"Cannot auto-detect provider for model '{model}'. "
        "Use --provider anthropic or --provider openai."
    )


def call_anthropic(model: str, prompt: str, max_tokens: int) -> tuple[str, dict]:
    from anthropic import Anthropic
    client = Anthropic()
    message = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text
    usage = {
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
    }
    return text, usage


def call_openai(model: str, prompt: str, max_tokens: int) -> tuple[str, dict]:
    from openai import OpenAI
    client = OpenAI()
    response = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    text = response.choices[0].message.content
    usage = {
        "input_tokens": response.usage.prompt_tokens,
        "output_tokens": response.usage.completion_tokens,
    }
    return text, usage


def call_model(provider: str, model: str, prompt: str, max_tokens: int) -> tuple[str, dict]:
    if provider == "anthropic":
        return call_anthropic(model, prompt, max_tokens)
    elif provider == "openai":
        return call_openai(model, prompt, max_tokens)
    else:
        raise ValueError(f"Unknown provider: {provider}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a model against an ASVS task")
    parser.add_argument("--task", required=True, help="Task ID (e.g., OAUTH-REFRESH-0001)")
    parser.add_argument("--model", default="claude-sonnet-4-20250514",
                        help="Model to use (default: claude-sonnet-4-20250514)")
    parser.add_argument("--provider", choices=["anthropic", "openai"],
                        help="API provider (auto-detected from model name if omitted)")
    parser.add_argument("--strip-authority", action="store_true",
                        help="Remove authority documents from prompt (contamination probe)")
    parser.add_argument("--runs", type=int, default=1,
                        help="Number of runs (for pass@k estimation)")
    parser.add_argument("--max-tokens", type=int, default=8000,
                        help="Max response tokens")
    parser.add_argument("--node-bin", default="node", help="Path to node binary")
    args = parser.parse_args()
    if args.provider is None:
        args.provider = detect_provider(args.model)
    return args


def parse_json_response(raw_text: str) -> dict:
    """Extract JSON from Claude's response, handling code fences and prose."""
    # Try code fence first
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw_text, re.DOTALL)
    if fence_match:
        return json.loads(fence_match.group(1))
    # Try to find a JSON object starting with {"edits"
    obj_match = re.search(r'(\{"edits"\s*:.*)', raw_text, re.DOTALL)
    if obj_match:
        candidate = obj_match.group(1).strip()
        # Find the matching closing brace
        depth = 0
        for i, ch in enumerate(candidate):
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return json.loads(candidate[:i + 1])
    # Fallback: try raw text
    return json.loads(raw_text.strip())


def run_command(cmd: list[str], cwd: Path) -> dict:
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        env=os.environ.copy(),
        text=True,
        capture_output=True,
        check=False,
    )
    return {
        "command": cmd,
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


def build_prompt(
    task_dir: Path,
    repo_snapshot: Path,
    task_cfg: dict,
    strip_authority: bool = False,
) -> str:
    """Build the full prompt from TASK.md and repo snapshot files."""
    task_prompt = (task_dir / "TASK.md").read_text().strip()
    allowed_globs = task_cfg.get("allowed_edit_globs", [])
    authority_files = set(task_cfg.get("authority_files", []))

    sections = [
        "You are editing a Node.js repository with a security bug.",
        "",
        "Return JSON only with this shape:",
        '{"edits":[{"path":"relative/path","content":"full file content"}],"note":"short explanation of what you changed and why"}',
        "",
        "Rules:",
        "- You may ONLY edit files matching these globs: " + ", ".join(allowed_globs),
        "- Read ALL provided documents carefully before making changes.",
        "- The visible test must pass after your edits.",
        "- Do not add or modify test files.",
        "- Do not create new files.",
        "",
        "## Task",
        task_prompt,
        "",
        "## Repository Files",
    ]

    for path in sorted(repo_snapshot.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(repo_snapshot)
        rel_with_prefix = f"repo_snapshot/{rel}"

        # In ablation mode, skip authority documents
        if strip_authority and rel_with_prefix in authority_files:
            continue

        sections.append(f"\n=== FILE: {rel} ===")
        try:
            sections.append(path.read_text())
        except UnicodeDecodeError:
            sections.append("[binary file]")

    return "\n".join(sections)


def apply_edits(workspace: Path, edits: list[dict], allowed_globs: list[str]) -> list[str]:
    """Apply model edits to workspace, respecting allowed_edit_globs."""
    import fnmatch

    applied: list[str] = []
    for edit in edits:
        rel_path = Path(edit["path"])
        # Check against allowed globs
        if not any(fnmatch.fnmatch(str(rel_path), glob) for glob in allowed_globs):
            print(f"  WARN: edit to {rel_path} not in allowed_edit_globs, skipping")
            continue
        target = workspace / rel_path
        if not target.exists():
            print(f"  WARN: edit path {rel_path} does not exist in repo, skipping")
            continue
        target.write_text(edit["content"])
        applied.append(rel_path.as_posix())
    return applied


def evaluate_workspace(
    workspace: Path,
    task_cfg: dict,
    node_bin: str,
) -> dict:
    """Run visible and hidden tests in workspace."""
    visible_cmd = [node_bin] + task_cfg["visible_test"]["command"][1:]
    visible = run_command(visible_cmd, cwd=workspace)

    hidden_checks = {}
    for check in task_cfg["hidden_checks"]:
        cmd = [node_bin] + check["command"][1:]
        result = run_command(cmd, cwd=workspace)
        hidden_checks[check["id"]] = result

    visible_pass = visible["returncode"] == 0
    check_results = {k: v["returncode"] == 0 for k, v in hidden_checks.items()}
    hidden_pass = all(check_results.values())

    return {
        "visible_pass": visible_pass,
        "hidden_pass": hidden_pass,
        "check_results": check_results,
        "commands": {
            "visible": visible,
            **{f"hidden_{k}": v for k, v in hidden_checks.items()},
        },
    }


def single_run(
    task_dir: Path,
    repo_snapshot: Path,
    task_cfg: dict,
    args: argparse.Namespace,
    run_idx: int,
) -> dict:
    """Execute a single model run: prompt -> edits -> evaluate."""
    prompt = build_prompt(
        task_dir, repo_snapshot, task_cfg,
        strip_authority=args.strip_authority,
    )

    print(f"  Calling {args.model}...")
    raw_response, usage = call_model(args.provider, args.model, prompt, args.max_tokens)

    try:
        parsed = parse_json_response(raw_response)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"  ERROR: Failed to parse JSON response: {e}")
        return {
            "run_idx": run_idx,
            "parse_error": str(e),
            "raw_response": raw_response,
            "usage": usage,
        }

    hidden_test = task_dir / "grader" / "hidden_test.js"
    allowed_globs = task_cfg.get("allowed_edit_globs", [])

    with tempfile.TemporaryDirectory(prefix=f"{args.task.lower()}-claude-") as tmp_dir:
        workspace = Path(tmp_dir) / "repo"
        shutil.copytree(repo_snapshot, workspace)
        shutil.copy2(hidden_test, workspace / "hidden_task_test.js")

        applied_paths = apply_edits(workspace, parsed.get("edits", []), allowed_globs)
        eval_result = evaluate_workspace(workspace, task_cfg, args.node_bin)

    result = {
        "run_idx": run_idx,
        "task_id": args.task,
        "model": args.model,
        "strip_authority": args.strip_authority,
        "applied_paths": applied_paths,
        "note": parsed.get("note", ""),
        **eval_result,
        "usage": usage,
        "raw_response": raw_response,
        "timestamp": datetime.now().isoformat(),
    }

    status = "PASS" if eval_result["hidden_pass"] else "FAIL"
    vis = "PASS" if eval_result["visible_pass"] else "FAIL"
    print(f"  Run {run_idx}: visible={vis} hidden={status} checks={eval_result['check_results']}")
    return result


def main() -> int:
    args = parse_args()

    env_key = "ANTHROPIC_API_KEY" if args.provider == "anthropic" else "OPENAI_API_KEY"
    if not os.getenv(env_key):
        raise SystemExit(f"{env_key} is not set")

    root = Path(__file__).resolve().parent.parent
    task_dir = root / "tasks" / args.task
    repo_snapshot = task_dir / "repo_snapshot"
    results_dir = root / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    if not task_dir.exists():
        raise SystemExit(f"Task directory not found: {task_dir}")

    with open(task_dir / "task.yaml") as f:
        task_cfg = yaml.safe_load(f)

    mode = "ablation" if args.strip_authority else "standard"
    model_short = args.model.split("-")[1] if "-" in args.model else args.model

    print(f"Task: {args.task}")
    print(f"Model: {args.model}")
    print(f"Mode: {mode}")
    print(f"Runs: {args.runs}")
    print("=" * 60)

    all_results = []
    for i in range(1, args.runs + 1):
        print(f"\n--- Run {i}/{args.runs} ---")
        result = single_run(task_dir, repo_snapshot, task_cfg, args, i)
        all_results.append(result)

    # Summary
    print("\n" + "=" * 60)
    visible_passes = sum(1 for r in all_results if r.get("visible_pass"))
    hidden_passes = sum(1 for r in all_results if r.get("hidden_pass"))
    total = len(all_results)
    total_input = sum(r.get("usage", {}).get("input_tokens", 0) for r in all_results)
    total_output = sum(r.get("usage", {}).get("output_tokens", 0) for r in all_results)

    print(f"Results: visible_pass={visible_passes}/{total} hidden_pass={hidden_passes}/{total}")
    print(f"Tokens: {total_input:,} input + {total_output:,} output")

    # Per-check breakdown
    if total > 0 and "check_results" in all_results[0]:
        check_ids = list(all_results[0]["check_results"].keys())
        print(f"\nPer-check pass rates:")
        for cid in check_ids:
            passes = sum(1 for r in all_results if r.get("check_results", {}).get(cid))
            print(f"  {cid}: {passes}/{total}")

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = f"_{mode}" if mode != "standard" else ""
    result_path = results_dir / f"{args.task}_{model_short}{suffix}_{timestamp}.json"

    output = {
        "task_id": args.task,
        "model": args.model,
        "mode": mode,
        "total_runs": total,
        "visible_pass_rate": visible_passes / total if total else 0,
        "hidden_pass_rate": hidden_passes / total if total else 0,
        "runs": all_results,
    }
    result_path.write_text(json.dumps(output, indent=2) + "\n")
    print(f"\nResults saved: {result_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
