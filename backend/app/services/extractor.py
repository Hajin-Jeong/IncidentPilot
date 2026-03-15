import re

# Patterns that indicate error lines in logs
ERROR_PATTERNS = [
    re.compile(r"(?i)(ERROR|FATAL|EXCEPTION|OOM|CRITICAL)\s.*"),
    re.compile(r"(?i)(caused by:|nested exception|stacktrace|stack trace).*"),
    re.compile(r"(?i)(connection.*timed? ?out|refused|unavailable|exhausted|not available).*"),
    re.compile(r"(?i)(out of memory|no space left|disk full|quota exceeded).*"),
    re.compile(r"(?i)(certificate.*expired?|ssl.*error|tls.*fail).*"),
    re.compile(r"(?i)(consumer.*lag|offset.*fail|partition.*error).*"),
]

MAX_ERRORS = 5
MAX_LINE_LENGTH = 120


def extract_errors(log_text: str) -> list[str]:
    lines = log_text.splitlines()
    seen: set[str] = set()
    results: list[str] = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        for pattern in ERROR_PATTERNS:
            if pattern.search(line):
                # Normalize: trim to max length
                normalized = line[:MAX_LINE_LENGTH]
                # Deduplicate similar lines (first 60 chars as key)
                key = normalized[:60]
                if key not in seen:
                    seen.add(key)
                    results.append(normalized)
                break

        if len(results) >= MAX_ERRORS:
            break

    return results
