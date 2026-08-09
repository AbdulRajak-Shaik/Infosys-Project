"""Administrator routes for managing user accounts."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User, UserRole
from app.schemas import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AdminUserResponse,
    MessageResponse,
)
from app.services.admin_user_service import create_user, delete_user, update_user


router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Allow access only to authenticated administrators."""
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required.",
        )
    return current_user


@router.post(
    "",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
    description="Creates a user with an administrator-selected role and account status.",
)
def create_admin_user(
    user_data: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    """Create a user account after validating its email and preferred language."""
    return create_user(db, user_data)


@router.put(
    "/{user_id}",
    response_model=AdminUserResponse,
    summary="Update a user's role or status",
    description="Updates only role and status. Username and email cannot be changed through this endpoint.",
)
def update_admin_user(
    user_id: int,
    user_data: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    """Update the permitted administrative fields for a user."""
    return update_user(db, user_id, user_data)


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Delete a user",
    description="Permanently removes a user account when it exists.",
)
def delete_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> MessageResponse:
    """Delete a user account and return a confirmation message."""
    delete_user(db, user_id)
    return MessageResponse(message="User deleted successfully")
