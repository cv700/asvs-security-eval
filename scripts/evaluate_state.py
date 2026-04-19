#!/usr/bin/env python3
"""Evaluate a local ASVS task state (baseline / bad / good).

Reads hidden_checks and visible_test from task.yaml so the script works
for any task in the suite.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import yaml


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a local ASVS task state")
    parser.add_argument("--task", required=True)
    parser.add_argument("--state", default="baseline", choices=["baseline", "bad", "good"])
    parser.add_argument("--node-bin", default="node")
    return parser.parse_args()


def overlay_tree(src: Path, dst: Path) -> None:
    for item in src.rglob("*"):
        rel = item.relative_to(src)
        target = dst / rel
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)


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


def main() -> int:
    args = parse_args()

    root = Path(__file__).resolve().parent.parent
    task_dir = root / "tasks" / args.task
    repo_snapshot = task_dir / "repo_snapshot"
    hidden_test = task_dir / "grader" / "hidden_test.js"
    overlay = task_dir / "candidates" / args.state
    results_dir = root / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    with open(task_dir / "task.yaml") as f:
        task_cfg = yaml.safe_load(f)

    visible_cmd = task_cfg["visible_test"]["command"]
    hidden_checks_cfg = task_cfg["hidden_checks"]
    candidate_states = task_cfg["candidate_states"]
    exp = candidate_states[args.state]["expected"]

    with tempfile.TemporaryDirectory(prefix=f"{args.task.lower()}-") as tmp_dir:
        workspace = Path(tmp_dir) / "repo"
        shutil.copytree(repo_snapshot, workspace)

        if args.state != "baseline":
            overlay_tree(overlay, workspace)

        shutil.copy2(hidden_test, workspace / "hidden_task_test.js")

        node_bin = args.node_bin

        # Replace the runtime name in the command with the actual binary
        vcmd = [node_bin] + visible_cmd[1:]
        visible = run_command(vcmd, cwd=workspace)

        hidden_checks = {}
        for check in hidden_checks_cfg:
            cmd = [node_bin] + check["command"][1:]
            result = run_command(cmd, cwd=workspace)
            hidden_checks[check["id"]] = result

    visible_pass = visible["returncode"] == 0
    check_results = {k: v["returncode"] == 0 for k, v in hidden_checks.items()}
    hidden_pass = all(check_results.values())

    result = {
        "task_id": args.task,
        "state": args.state,
        "visible_pass": visible_pass,
        "hidden_pass": hidden_pass,
        "check_results": check_results,
        "expected": exp,
        "matches_expected": (
            visible_pass == exp["visible_pass"]
            and hidden_pass == exp["hidden_pass"]
        ),
        "commands": {
            "visible": visible,
            **{f"hidden_{k}": v for k, v in hidden_checks.items()},
        },
    }

    result_path = results_dir / f"{args.task}_{args.state}.json"
    result_path.write_text(json.dumps(result, indent=2) + "\n")

    status = "PASS" if result["matches_expected"] else "FAIL"
    print(f"[{status}] state={args.state} visible_pass={visible_pass} hidden_pass={hidden_pass} checks={check_results}")
    return 0 if result["matches_expected"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
