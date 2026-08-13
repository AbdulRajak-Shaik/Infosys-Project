"""Business logic for administrator-managed user accounts."""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Feedback, Language, User
from app.schemas import AdminCreateUserRequest, AdminUpdateUserRequest
from app.security import get_password_hash


def create_user(db: Session, user_data: AdminCreateUserRequest) -> User:
    """Create a user after checking email uniqueness and language validity."""
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: A user with this email address already exists.",
        )

    if not db.query(Language).filter(Language.id == user_data.language_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language_id. Please provide a valid predefined language id.",
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        status=user_data.status,
        region=user_data.region,
        language_id=user_data.language_id,
    )
    db.add(user)
    _commit(db, "Unable to create user.")
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, user_data: AdminUpdateUserRequest) -> User:
    """Update only the role and status of an existing user."""
    user = _get_user_or_404(db, user_id)
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.status is not None:
        user.status = user_data.status

    _commit(db, "Unable to update user.")
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    """Permanently delete an existing user."""
    user = _get_user_or_404(db, user_id)
    # Feedback has a user foreign key but is not modeled with an ORM delete cascade.
    # Remove it explicitly so user deletion works on databases that enforce FKs.
    db.query(Feedback).filter(Feedback.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    _commit(db, "Unable to delete user.")


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def _commit(db: Session, error_detail: str) -> None:
    """Commit a unit of work while keeping the session usable on failures."""
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: A user with this email address already exists.",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail,
        ) from exc
