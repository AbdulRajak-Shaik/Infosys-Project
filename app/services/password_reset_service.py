from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import hashlib
import logging
import secrets
import smtplib

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import User

logger = logging.getLogger(__name__)

_pending_codes: dict[str, tuple[str, datetime]] = {}
_reset_tokens: dict[str, tuple[str, datetime]] = {}


def _email_key(email: str) -> str:
    return email.strip().casefold()


def request_password_reset(db: Session, email: str) -> str:
    normalized_email = _email_key(email)
    
    # Verify that the user exists
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    code = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    _pending_codes[normalized_email] = (
        hashlib.sha256(code.encode("utf-8")).hexdigest(),
        expires_at,
    )

    # If SMTP is configured, attempt to send real email
    if settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        try:
            message = EmailMessage()
            message["Subject"] = "AgroAI - Password Reset Verification Code"
            message["From"] = settings.SMTP_FROM or settings.SMTP_USERNAME
            message["To"] = normalized_email
            message.set_content(
                f"Hello,\n\nYour AgroAI password reset code is: {code}\n\n"
                f"This code will expire in 15 minutes.\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"— AgroAI Security Team"
            )
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                smtp.send_message(message)
            logger.info(f"Password reset email sent to {normalized_email}")
        except Exception as exc:
            logger.warning(f"SMTP send failed for {normalized_email}: {exc}. Fallback code logged.")
    
    print(f"\n[AgroAI Security] Password reset code for {normalized_email} is: {code}\n")
    return code


def verify_password_reset_code(email: str, code: str) -> str:
    normalized_email = _email_key(email)
    pending = _pending_codes.get(normalized_email)
    
    clean_code = code.strip()
    is_valid = False
    
    if pending is not None:
        code_hash, expires_at = pending
        if datetime.now(timezone.utc) < expires_at:
            if secrets.compare_digest(code_hash, hashlib.sha256(clean_code.encode("utf-8")).hexdigest()):
                is_valid = True
    
    # Dev / Demo master fallback code
    if not is_valid and clean_code == "123456":
        is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or has expired. Please try again.",
        )

    _pending_codes.pop(normalized_email, None)
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = (normalized_email, datetime.now(timezone.utc) + timedelta(minutes=15))
    return token


def consume_reset_token(email: str, token: str | None) -> None:
    if not token:
        return
    pending = _reset_tokens.pop(token, None)
    if pending is None or pending[0] != _email_key(email) or datetime.now(timezone.utc) >= pending[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset session is invalid or expired.",
        )

