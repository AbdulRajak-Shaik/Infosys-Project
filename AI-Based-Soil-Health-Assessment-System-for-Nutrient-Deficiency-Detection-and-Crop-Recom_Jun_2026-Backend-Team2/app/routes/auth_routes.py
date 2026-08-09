from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.schemas import (
    UserRegisterRequest,
    UserRegisterResponse,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    PasswordResetRequest,
    PasswordResetVerifyRequest,
    PasswordResetVerifyResponse,
    PasswordResetCompleteRequest,
    PasswordManagementResponse,
)
from app.dependencies import get_db, get_current_user
from app.models import User
from app.auth import (
    authenticate_admin_user,
    authenticate_user,
    change_user_password,
    register_user,
    reset_user_password,
    update_user_profile,
)
from app.utils import create_access_token, create_refresh_token
from app.services.password_reset_service import (
    consume_reset_token,
    request_password_reset,
    verify_password_reset_code,
)

# Create the router for authentication
router = APIRouter(tags=["Authentication"])

@router.post(
    "/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a user and stores a securely-hashed password. Supports English, Hindi, Telugu, Tamil."
)
def register(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    register_user(db, user_data)
    return {"message": "User registered successfully"}

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Log in and retrieve tokens",
    description="Authenticates credentials and returns a Bearer access token (30m) and refresh token (7d)."
)
def login(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    # Business logic layer authentication
    user = authenticate_user(db, login_data)
    
    # Standard payload structure: user_id, email, language_id
    payload = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "language_id": user.language_id
    }
    
    # Generate tokens using respective secret keys
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer"
    }

@router.post(
    "/admin/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin Portal Login",
    description="Authenticates Administrator credentials for Admin Portal access. Non-admin accounts receive HTTP 403 Forbidden."
)
def admin_login(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """Admin portal login endpoint enforcing strict administrator role check."""
    user = authenticate_admin_user(db, login_data)
    
    payload = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "language_id": user.language_id
    }
    
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer"
    }
@router.post(
    "/token",
    response_model=TokenResponse,
    summary="OAuth2 Token Endpoint"
)
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    login_data = UserLoginRequest(
        email=form_data.username,
        password=form_data.password
    )

    user = authenticate_user(db, login_data)

    payload = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "language_id": user.language_id
    }

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer"
    }

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user details",
    description="Protected endpoint. Decodes access token and retrieves current user profile data."
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user details",
    description="Updates the authenticated user's email and preferred language."
)
def update_me(
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_user_profile(db, current_user, user_data)


@router.put(
    "/change-password",
    response_model=PasswordManagementResponse,
    status_code=status.HTTP_200_OK,
    summary="Change the current user's password",
    description="Requires a Bearer access token and the user's current password.",
)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the authenticated user's password."""
    change_user_password(db, current_user, password_data)
    return {"message": "Password updated successfully."}


@router.post(
    "/forgot-password/request",
    response_model=PasswordManagementResponse,
    status_code=status.HTTP_200_OK,
)
def request_forgot_password(
    password_data: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    normalized_email = str(password_data.email).strip().casefold()
    user = db.query(User).filter(func.lower(func.trim(User.email)) == normalized_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    request_password_reset(str(password_data.email))
    return {"message": "A password reset code was sent to your email."}


@router.post(
    "/forgot-password/verify",
    response_model=PasswordResetVerifyResponse,
    status_code=status.HTTP_200_OK,
)
def verify_forgot_password(
    password_data: PasswordResetVerifyRequest,
):
    return {"reset_token": verify_password_reset_code(str(password_data.email), password_data.code)}


@router.post(
    "/forgot-password",
    response_model=PasswordManagementResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset a password by email",
    description="Resets an existing user's password without OTP, email verification, or reset tokens.",
)
def forgot_password(
    password_data: PasswordResetCompleteRequest,
    db: Session = Depends(get_db),
):
    consume_reset_token(str(password_data.email), password_data.reset_token)
    reset_user_password(
        db,
        ForgotPasswordRequest(
            email=password_data.email,
            new_password=password_data.new_password,
            confirm_password=password_data.confirm_password,
        ),
    )
    return {"message": "Password reset successfully."}


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out the current user",
    description="Records the current UTC logout time for the authenticated user."
)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a successful logout for the authenticated user."""
    current_user.last_logout_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"message": "Logged out successfully"}
