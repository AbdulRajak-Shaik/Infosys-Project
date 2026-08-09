from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import hashlib
import secrets
import smtplib

from fastapi import HTTPException, status

from app.config import settings


_pending_codes: dict[str, tuple[str, datetime]] = {}
_reset_tokens: dict[str, tuple[str, datetime]] = {}


def _email_key(email: str) -> str:
    return email.strip().casefold()


def request_password_reset(email: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset email is not configured. Set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD.",
        )

    normalized_email = _email_key(email)
    code = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    _pending_codes[normalized_email] = (
        hashlib.sha256(code.encode("utf-8")).hexdigest(),
        expires_at,
    )

    message = EmailMessage()
    message["Subject"] = "AgroAI password reset code"
    message["From"] = settings.SMTP_FROM or settings.SMTP_USERNAME
    message["To"] = normalized_email
    message.set_content(
        f"Your AgroAI password reset code is {code}. It expires in 10 minutes."
    )

    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError) as exc:
        _pending_codes.pop(normalized_email, None)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The password reset email could not be sent. Check the SMTP settings.",
        ) from exc


def verify_password_reset_code(email: str, code: str) -> str:
    normalized_email = _email_key(email)
    pending = _pending_codes.get(normalized_email)
    if pending is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request a new password reset code.",
        )

    code_hash, expires_at = pending
    if datetime.now(timezone.utc) >= expires_at or not secrets.compare_digest(
        code_hash, hashlib.sha256(code.encode("utf-8")).hexdigest()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset code is invalid or expired.",
        )

    _pending_codes.pop(normalized_email, None)
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = (normalized_email, datetime.now(timezone.utc) + timedelta(minutes=10))
    return token


def consume_reset_token(email: str, token: str) -> None:
    pending = _reset_tokens.pop(token, None)
    if pending is None or pending[0] != _email_key(email) or datetime.now(timezone.utc) >= pending[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset session is invalid or expired.",
        )
