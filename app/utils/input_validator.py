"""
Input sanitization and prompt-injection prevention.
"""
import re


# Patterns that indicate prompt injection attempts
_INJECTION_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+instructions",
    r"forget\s+(everything|all|instructions)",
    r"pretend\s+you\s+are",
    r"act\s+as\s+(if|though|a)",
    r"you\s+are\s+now\s+a",
    r"jailbreak",
    r"DAN\s*mode",
    r"<\s*script",
    r"<\s*img",
    r"javascript\s*:",
    r"eval\s*\(",
    r"exec\s*\(",
    r"\bsystem\b.*\bprompt\b",
]
_INJECTION_RE = [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS]


def sanitize_query(text: str, max_length: int = 500) -> str:
    """Clean and validate user input."""
    if not text or not isinstance(text, str):
        return ""
    # Trim & enforce max length
    text = text.strip()[:max_length]
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Strip null bytes
    text = text.replace("\x00", "")
    return text


def contains_injection(text: str) -> bool:
    """Return True if the text appears to be a prompt injection attempt."""
    for pattern in _INJECTION_RE:
        if pattern.search(text):
            return True
    return False


def validate_chat_message(message: str) -> tuple[bool, str]:
    """
    Validate a chat message.
    Returns (is_valid, reason).
    """
    clean = sanitize_query(message)
    if not clean:
        return False, "Empty message"
    if len(clean) < 2:
        return False, "Message too short"
    if contains_injection(clean):
        return False, "Message flagged as potentially malicious"
    return True, clean
