from datetime import datetime, timezone
from typing import Any
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Language, User, UserRole, UserStatus
from app.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserUpdateRequest,
)
from app.security import get_password_hash, verify_password

def register_user(db: Session, user_data: UserRegisterRequest) -> User:
    """
    Registers a new user in the database.
    Checks for email conflict first. Hashes password using bcrypt.
    """
    # 0. Validate password match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )

    # 1. Check if user already exists
    normalized_email = str(user_data.email).strip().casefold()
    existing_user = (
        db.query(User)
        .filter(func.lower(func.trim(User.email)) == normalized_email)
        .first()
    )
    if existing_user:
        # Return 409 Conflict as requested
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: A user with this email address already exists."
        )
    
    # 2. Validate that the provided language exists before creating the user.
    language = db.query(Language).filter(Language.id == user_data.language_id).first()
    if not language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language_id. Please provide a valid predefined language id."
        )

    # 3. Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # 4. Create user entity
    print("User Data:", user_data.model_dump())
    print("Username:", user_data.username)
    print("Region:", user_data.region)
    # Resolve role from request payload, defaulting to FARMER
    requested_role = (user_data.role or "farmer").lower()
    if requested_role == "admin":
        assigned_role = UserRole.ADMIN.value
    else:
        assigned_role = UserRole.FARMER.value
    db_user = User(
        username=user_data.username,
        email=normalized_email,
        hashed_password=hashed_password,
        role=assigned_role,
        status=UserStatus.ACTIVE.value,
        region=user_data.region,
        language_id=user_data.language_id,
    )
    
    # 4. Save to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, login_data: UserLoginRequest) -> User:
    """
    Authenticates a user with email and password.
    Returns the user model if valid, raises HTTP 401 otherwise.
    """
    # 1. Fetch user by email
    normalized_email = str(login_data.email).strip().casefold()
    user = (
        db.query(User)
        .filter(func.lower(func.trim(User.email)) == normalized_email)
        .first()
    )
    if not user:
        # Return 401 Unauthorized as requested
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 2. Verify hashed password matches
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active. Please contact an administrator.",
        )

    # Track the current UTC login time and commit it before returning the user.
    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_admin_user(db: Session, login_data: UserLoginRequest) -> User:
    """
    Authenticates an administrator user for the Admin Portal.
    Verifies credentials and strictly enforces role == 'admin'.
    Raises 401 for bad credentials and 403 Forbidden for non-admin accounts.
    """
    user = authenticate_user(db, login_data)
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have administrator privileges to access the Admin Portal.",
        )
    return user


def update_user_profile(
    db: Session,
    current_user: User,
    user_data: UserUpdateRequest,
) -> User:
    """Update the authenticated user's email and preferred language, logging changes to general_history."""
    existing_user = (
        db.query(User)
        .filter(
            func.lower(func.trim(User.email)) == str(user_data.email).strip().casefold(),
            User.id != current_user.id,
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: A user with this email address already exists."
        )

    language = db.query(Language).filter(Language.id == user_data.language_id).first()
    if not language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language_id. Please provide a valid predefined language id."
        )

    from app.services.history_service import create_general_history
    import uuid

    def log_change(field: str, old_val: Any, new_val: Any, pred_type: str = "profile"):
        try:
            create_general_history(
                db=db,
                user_id=current_user.id,
                module_name="Profile Update" if pred_type == "profile" else "Community",
                prediction_type=pred_type,
                input_parameters={"field": field, "previous_value": str(old_val) if old_val is not None else ""},
                prediction_result={"updated_value": str(new_val) if new_val is not None else ""},
                confidence=100.0,
                processing_time=0.01
            )
        except Exception as e:
            print(f"[ERROR] Failed to save history edit: {e}")

    # Track updates
    if current_user.email != str(user_data.email).strip().casefold():
        log_change("Email", current_user.email, str(user_data.email).strip().casefold())
    if current_user.language_id != user_data.language_id:
        log_change("Language", current_user.language_id, user_data.language_id)
    if user_data.username is not None and user_data.username.strip() and current_user.username != user_data.username.strip():
        log_change("Name", current_user.username, user_data.username.strip())
    if user_data.region is not None and user_data.region.strip() and current_user.region != user_data.region.strip():
        log_change("Region", current_user.region, user_data.region.strip())
    if user_data.mobile is not None and current_user.mobile != user_data.mobile.strip():
        log_change("Phone", current_user.mobile, user_data.mobile.strip())
    if user_data.address is not None and current_user.address != user_data.address.strip():
        log_change("Address", current_user.address, user_data.address.strip())
    if user_data.district is not None and current_user.district != user_data.district.strip():
        log_change("District", current_user.district, user_data.district.strip())
    if user_data.state is not None and current_user.state != user_data.state.strip():
        log_change("State", current_user.state, user_data.state.strip())
    if user_data.profile_picture is not None and current_user.profile_picture != user_data.profile_picture:
        log_change("Profile Image", "Uploaded picture", "New picture")
    if user_data.community is not None and current_user.community != user_data.community.strip():
        action = "Joined Community" if user_data.community.strip() else "Left Community"
        log_change("Community", current_user.community, user_data.community.strip(), pred_type="community")
        # Save community notification
        try:
            create_general_history(
                db=db,
                user_id=current_user.id,
                module_name="Notification",
                prediction_type="notification",
                input_parameters={
                    "id": f"notif-{uuid.uuid4().hex[:12]}",
                    "title": f"Community Update",
                    "desc": f"You joined/changed community to {user_data.community.strip()}." if user_data.community.strip() else "You left the community.",
                    "type": "community"
                },
                prediction_result={"read": False}
            )
        except Exception:
            pass

    current_user.email = str(user_data.email).strip().casefold()
    current_user.language_id = user_data.language_id
    if user_data.username is not None and user_data.username.strip():
        current_user.username = user_data.username.strip()
    if user_data.region is not None:
        current_user.region = user_data.region.strip() or current_user.region
    if user_data.mobile is not None:
        current_user.mobile = user_data.mobile.strip()
    if user_data.address is not None:
        current_user.address = user_data.address.strip()
    if user_data.district is not None:
        current_user.district = user_data.district.strip()
    if user_data.state is not None:
        current_user.state = user_data.state.strip()
    if user_data.profile_picture is not None:
        current_user.profile_picture = user_data.profile_picture
    if user_data.community is not None:
        current_user.community = user_data.community.strip()

    # Save general profile update notification
    try:
        create_general_history(
            db=db,
            user_id=current_user.id,
            module_name="Notification",
            prediction_type="notification",
            input_parameters={
                "id": f"notif-{uuid.uuid4().hex[:12]}",
                "title": "Profile Updated",
                "desc": "Your profile details have been updated successfully.",
                "type": "system"
            },
            prediction_result={"read": False}
        )
    except Exception:
        pass

    db.commit()
    db.refresh(current_user)
    return current_user



def _ensure_password_confirmation(new_password: str, confirm_password: str) -> None:
    """Raise a client error when a submitted password confirmation does not match."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match.",
        )


def _commit_password_update(db: Session) -> None:
    """Commit a password update and leave the session usable if persistence fails."""
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update password.",
        ) from exc

def change_user_password(
    db: Session,
    current_user: User,
    password_data: ChangePasswordRequest,
) -> None:
    """Verify and replace the authenticated user's password."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    _ensure_password_confirmation(
        password_data.new_password,
        password_data.confirm_password,
    )

    if verify_password(password_data.new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    user.hashed_password = get_password_hash(password_data.new_password)
    _commit_password_update(db)

    # Save to history & notify
    try:
        from app.services.history_service import create_general_history
        create_general_history(
            db=db,
            user_id=user.id,
            module_name="Profile Update",
            prediction_type="profile",
            input_parameters={"field": "Password", "previous_value": "********"},
            prediction_result={"updated_value": "********"},
            confidence=100.0,
            processing_time=0.01
        )
    except Exception:
        pass


def reset_user_password(
    db: Session,
    password_data: ForgotPasswordRequest,
) -> None:
    """Replace a user's password after locating the account by email."""
    normalized_email = str(password_data.email).strip().casefold()
    user = (
        db.query(User)
        .filter(func.lower(func.trim(User.email)) == normalized_email)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    _ensure_password_confirmation(
        password_data.new_password,
        password_data.confirm_password,
    )

    user.hashed_password = get_password_hash(password_data.new_password)
    _commit_password_update(db)

    # Save to history & notify
    try:
        from app.services.history_service import create_general_history
        create_general_history(
            db=db,
            user_id=user.id,
            module_name="Profile Update",
            prediction_type="profile",
            input_parameters={"field": "Password", "previous_value": "********"},
            prediction_result={"updated_value": "********"},
            confidence=100.0,
            processing_time=0.01
        )
    except Exception:
        pass
