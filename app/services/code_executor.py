"""Code execution service.

Uses Judge0 (https://judge0.com) to compile + run user code in a sandbox.
If no Judge0 credentials are configured, falls back to a local Python-only
subprocess runner so dev/test still works.
"""

from __future__ import annotations

import base64
import logging
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# Judge0 language IDs — see https://ce.judge0.com/languages
LANGUAGE_IDS = {
    "python": 71,        # Python 3.8.1
    "javascript": 63,    # Node.js 12.14.0
    "typescript": 74,    # TypeScript 3.7.4
    "java": 62,          # Java OpenJDK 13.0.1
    "cpp": 54,           # C++ GCC 9.2.0
    "c": 50,             # C GCC 9.2.0
    "go": 60,            # Go 1.13.5
    "rust": 73,          # Rust 1.40.0
}


@dataclass
class TestRun:
    passed: bool
    actual_stdout: str
    expected_stdout: str
    stderr: str
    runtime_ms: float | None
    status: str


@dataclass
class ExecutionReport:
    passed_count: int
    total_count: int
    runtime_ms: float | None
    status: str  # accepted | wrong_answer | runtime_error | compile_error | tle | error
    stderr: str | None
    runs: list[TestRun]


def execute(
    *,
    language: str,
    code: str,
    test_cases: list[dict],
) -> ExecutionReport:
    if not test_cases:
        return ExecutionReport(0, 0, None, "error", "No test cases configured", [])

    if settings.judge0_api_key:
        runs = [_run_judge0(language=language, code=code, tc=tc) for tc in test_cases]
    elif language == "python":
        runs = [_run_local_python(code=code, tc=tc) for tc in test_cases]
    else:
        return ExecutionReport(
            0, len(test_cases), None, "error",
            f"No executor configured for language={language}. Set JUDGE0_API_KEY.",
            [],
        )

    passed = sum(1 for r in runs if r.passed)
    total = len(runs)
    runtime = max((r.runtime_ms for r in runs if r.runtime_ms is not None), default=None)

    if any(r.status == "compile_error" for r in runs):
        status = "compile_error"
    elif any(r.status == "tle" for r in runs):
        status = "tle"
    elif any(r.status == "runtime_error" for r in runs):
        status = "runtime_error"
    elif passed == total:
        status = "accepted"
    else:
        status = "wrong_answer"

    stderr = next((r.stderr for r in runs if r.stderr), None)
    return ExecutionReport(passed, total, runtime, status, stderr, runs)


# ---------- Judge0 ----------

def _run_judge0(*, language: str, code: str, tc: dict) -> TestRun:
    lang_id = LANGUAGE_IDS.get(language)
    if not lang_id:
        return TestRun(False, "", tc.get("expected_stdout", ""),
                       f"Unsupported language: {language}", None, "error")

    body = {
        "language_id": lang_id,
        "source_code": _b64(code),
        "stdin": _b64(tc.get("stdin", "")),
        "expected_output": _b64(tc.get("expected_stdout", "")),
    }
    headers = {
        "content-type": "application/json",
        "X-RapidAPI-Key": settings.judge0_api_key or "",
        "X-RapidAPI-Host": settings.judge0_host,
    }
    url = f"{settings.judge0_url.rstrip('/')}/submissions?base64_encoded=true&wait=true"

    try:
        with httpx.Client(timeout=20.0) as client:
            r = client.post(url, json=body, headers=headers)
            r.raise_for_status()
            data = r.json()
    except Exception as exc:  # network / rate limit / etc.
        logger.exception("Judge0 call failed")
        return TestRun(False, "", tc.get("expected_stdout", ""), str(exc), None, "error")

    actual = _b64decode(data.get("stdout"))
    stderr = _b64decode(data.get("stderr") or data.get("compile_output"))
    expected = tc.get("expected_stdout", "").rstrip()
    status_id = (data.get("status") or {}).get("id")

    # Judge0 status IDs: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compilation Error,
    # 7-12=runtime errors, 13/14=internal
    if status_id == 6:
        run_status = "compile_error"
    elif status_id == 5:
        run_status = "tle"
    elif status_id and status_id >= 7:
        run_status = "runtime_error"
    elif status_id == 3:
        run_status = "passed"
    else:
        run_status = "wrong_answer"

    runtime = float(data["time"]) * 1000 if data.get("time") else None
    passed = run_status == "passed" or actual.rstrip() == expected
    return TestRun(passed, actual, expected, stderr or "", runtime, run_status if not passed else "passed")


def _b64(s: str) -> str:
    return base64.b64encode(s.encode()).decode()


def _b64decode(s: str | None) -> str:
    if not s:
        return ""
    try:
        return base64.b64decode(s).decode(errors="replace")
    except Exception:
        return s


# ---------- Local Python fallback ----------

def _run_local_python(*, code: str, tc: dict) -> TestRun:
    """Run the user code locally with a strict timeout. Dev-only fallback."""
    expected = tc.get("expected_stdout", "").rstrip()
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "solution.py"
        path.write_text(code)
        try:
            proc = subprocess.run(
                [sys.executable, str(path)],
                input=tc.get("stdin", ""),
                capture_output=True,
                text=True,
                timeout=5,
            )
        except subprocess.TimeoutExpired:
            return TestRun(False, "", expected, "Time limit exceeded", 5000.0, "tle")
        except Exception as exc:
            return TestRun(False, "", expected, str(exc), None, "error")

        actual = proc.stdout.rstrip()
        if proc.returncode != 0:
            return TestRun(False, actual, expected, proc.stderr, None, "runtime_error")

        passed = actual == expected
        return TestRun(passed, actual, expected, proc.stderr or "", None,
                       "passed" if passed else "wrong_answer")
