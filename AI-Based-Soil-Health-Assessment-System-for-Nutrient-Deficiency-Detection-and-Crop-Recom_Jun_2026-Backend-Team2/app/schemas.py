import re
from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserRegisterRequest(BaseModel):
    """
    Schema for register request body validation.
    """
    username: str = Field(..., min_length=2, max_length=50, description="Full name or username of the registering user.")
    email: EmailStr
    password: str = Field(..., description="User password. Must meet complexity requirements.")
    confirm_password: str = Field(..., description="Confirm password. Must be identical to password.")
    language_id: int = Field(..., description="ID of the predefined language from the languages table.")
    region: str = Field(..., min_length=2, max_length=100, description="State, district, or region of the user.")
    role: Literal["farmer", "admin"] | None = Field(default="farmer", description="Role for the new account. Defaults to 'farmer'.")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_complexity(v)


def _validate_password_complexity(password: str) -> str:
    """Apply the password complexity rules used throughout the authentication API."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter (a-z).")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit (0-9).")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character (e.g., !@#$%^&*).")
    return password

class UserRegisterResponse(BaseModel):
    """
    Schema for register response.
    """
    message: str


class AdminCreateUserRequest(BaseModel):
    """Payload used by an administrator to create a user account."""

    username: str | None = Field(default=None, max_length=100)
    email: EmailStr
    password: str = Field(..., description="Password meeting the standard complexity requirements.")
    role: Literal["farmer", "admin"]
    status: Literal["active", "inactive", "suspended"]
    region: str | None = Field(default=None, max_length=100)
    language_id: int = Field(..., description="ID of an existing predefined language.")

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_complexity(value)


class AdminUpdateUserRequest(BaseModel):
    """Administrative user fields that may be changed after account creation."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["farmer", "admin"] | None = None
    status: Literal["active", "inactive", "suspended"] | None = None

    @model_validator(mode="after")
    def require_update_value(self) -> "AdminUpdateUserRequest":
        if self.role is None and self.status is None:
            raise ValueError("At least one of role or status must be provided.")
        return self


class AdminUserResponse(BaseModel):
    """Safe administrative representation of a user; never exposes password hashes."""

    id: int
    username: str | None
    email: EmailStr
    role: str
    status: str
    region: str | None
    language_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Standard message-only API response."""

    message: str


class ChangePasswordRequest(BaseModel):
    """Payload for an authenticated password change."""

    current_password: str
    new_password: str = Field(..., description="New password meeting the registration password rules.")
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_complexity(value)


class ForgotPasswordRequest(BaseModel):
    """Payload for resetting a password by email."""

    email: EmailStr
    new_password: str = Field(..., description="New password meeting the registration password rules.")
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_complexity(value)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class PasswordResetVerifyResponse(BaseModel):
    reset_token: str


class PasswordResetCompleteRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_complexity(value)


class PasswordManagementResponse(BaseModel):
    """Confirmation returned after a password change or reset."""

    message: str


class UserUpdateRequest(BaseModel):
    """Schema for updating the authenticated user's profile."""
    email: EmailStr
    language_id: int
    username: str | None = Field(default=None, min_length=2, max_length=50, description="Updated display name.")
    region: str | None = Field(default=None, max_length=100, description="Updated region or location.")
    mobile: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    district: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    profile_picture: str | None = Field(default=None)
    community: str | None = Field(default=None, max_length=50)



class UserLoginRequest(BaseModel):
    """
    Schema for login request.
    """
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    """
    Schema for successful login token payload.
    """
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

class UserResponse(BaseModel):
    """
    Schema representing user profile details returned by API.
    """
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "email": "user@example.com",
                "language_id": 1,
                "created_at": "2026-07-21T10:30:00Z",
                "last_login_at": "2026-07-21T10:30:00Z",
                "last_logout_at": "2026-07-21T12:00:00Z",
            }
        },
    )

    id: int
    username: str | None = None
    email: EmailStr
    role: str = "farmer"
    status: str = "active"
    region: str | None = None
    language_id: int | None
    created_at: datetime
    last_login_at: datetime | None
    last_logout_at: datetime | None
    mobile: str | None = None
    address: str | None = None
    district: str | None = None
    state: str | None = None
    profile_picture: str | None = None
    community: str | None = None
    followers_count: int = 0
    following_count: int = 0
class LanguageResponse(BaseModel):
    """
    Schema representing a supported language.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    language_name: str
    language_code: str
    is_default: bool = False
    is_active: bool = True

class PredictionHistorySummaryResponse(BaseModel):
    """Lightweight prediction history response."""

    history_id: int
    id: int
    prediction_type: str = "soil"
    type: str = "Soil"
    prediction_date: Any = None
    created_at: Any = None
    date: str | None = None
    soil_type: str
    soil_health: str
    soil_health_score: float
    soil_fertility_status: str
    top_crop: str | None = None
    predicted_crop: str | None = None
    result: str | None = None
    confidence: float | int | None = None
    input: str | None = None
    status: str = "success"

    model_config = ConfigDict(extra="allow")


class PredictionHistoryDetailResponse(BaseModel):
    """Complete saved prediction history response."""

    history_id: int
    prediction_date: datetime
    soil_type: str
    soil_confidence: float | None
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    organic_carbon: float
    electrical_conductivity: float
    temperature: float
    humidity: float
    soil_health: str
    soil_health_score: float
    soil_fertility_status: str
    deficiencies: list[Any]
    recommended_crops: list[Any]
    recommended_fertilizers: list[Any]

    model_config = ConfigDict(extra="allow")


class AnalyticsResponse(BaseModel):
    """Analytics totals and prediction summary for the authenticated user."""

    total_predictions: int
    total_crop_recommendations: int
    total_image_uploads: int
    prediction_history: int
    last_prediction: datetime | None = Field(
        None,
        description="Timestamp of the user's most recent prediction, if any.",
    )
    most_predicted_soil: str | None = Field(
        None,
        description=(
            "The most frequent soil type in the user's prediction history, "
            "translated to the user's preferred language when available."
        ),
    )


class DashboardSummaryResponse(BaseModel):
    """Aggregate metrics displayed by the admin dashboard."""

    total_users: int
    active_today: int
    total_predictions: int
    farmer_count: int
    feedback_received: int


class UserGrowthResponse(BaseModel):
    """User registrations aggregated for a calendar month."""

    month: str
    users: int


class RecentUserResponse(BaseModel):
    """A recently registered user shown on the admin dashboard."""

    id: int
    username: str | None
    email: str
    role: str
    region: str | None
    status: str
    created_at: datetime


class ChatRequest(BaseModel):
    """Schema for an authenticated chatbot request."""
    question: str = Field(..., min_length=1)
    prediction_history_id: int | None = None


class ChatResponse(BaseModel):
    """Single-language or bilingual chatbot response."""
    response: str | None = None
    question_language: str | None = None
    preferred_language: str | None = None
    english_response: str | None = None
    telugu_response: str | None = None
    hindi_response: str | None = None
    tamil_response: str | None = None


class ChatHistoryResponse(BaseModel):
    """Schema for one saved chatbot conversation."""
    id: int
    user_message: str
    question_language: str | None
    preferred_language: str | None
    assistant_response: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskStatusResponse(BaseModel):
    """Task metadata returned by ``GET /tasks/{task_id}``."""

    task_id: str
    status: str = Field(description="Current Celery task state.")
    original_filename: str | None = Field(
        default=None,
        description="Name of the file supplied when the task was created.",
    )
    upload_time: datetime | None = Field(
        default=None,
        description="UTC timestamp when the task upload was accepted.",
    )


class WeatherResponse(BaseModel):
    """Current weather returned with a final recommendation."""

    location: str
    temperature: float
    humidity: int
    rainfall: float


class FinalRecommendationResponse(BaseModel):
    """Completed final recommendation returned by ``POST /final-recommendation``."""

    task_id: str
    soil_type: str
    soil_health: str
    soil_health_score: float
    soil_fertility_status: str
    deficiencies: list[Any]
    recommended_crops: list[Any]
    recommended_fertilizers: list[Any]
    weather: WeatherResponse
    probabilities: dict[str, float] | None = None


class FeedbackCreate(BaseModel):
    """Schema for submitting feedback."""

    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=500)
    category: str | None = None


class FeedbackReplyRequest(BaseModel):
    """Schema for admin replying to feedback."""

    admin_response: str = Field(..., min_length=1, max_length=500)


class FeedbackResponse(BaseModel):
    """Schema returned after feedback is saved."""

    id: int
    user_id: int
    rating: int
    comment: str
    category: str | None = None
    admin_response: str | None = None
    is_resolved: bool = False
    user_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CurrentWeatherResponse(BaseModel):
    """Schema for current weather endpoint response."""

    location: str
    current_temperature: float
    feels_like: float
    condition: str
    humidity: int
    wind_speed: float
    precipitation: float
    uv_index: float
    visibility: float
    icon: str
    icon_url: str


class DailyForecastItem(BaseModel):
    """Schema for one daily forecast entry."""

    date: str
    day_name: str
    min_temp: float
    max_temp: float
    condition: str
    icon: str
    icon_url: str


class WeatherForecastResponse(BaseModel):
    """Schema for 5-day weather forecast response."""

    location: str
    forecast: list[DailyForecastItem]


# ===========================
# Translation Schemas
# ===========================

class TranslationKeyCreate(BaseModel):
    """Request schema to create a translation key."""

    key: str = Field(..., max_length=100)
    english: str = Field(..., max_length=500)
    category: str | None = None
    description: str | None = None


class TranslationKeyUpdate(BaseModel):
    """Request schema to update a translation key."""

    key: str | None = None
    english: str | None = None
    category: str | None = None
    description: str | None = None


class TranslationResponse(BaseModel):
    """Translation returned for a selected language."""

    key: str
    value: str


class TranslationKeyResponse(BaseModel):
    """Translation key details."""

    id: int
    key: str
    english: str
    category: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class LanguageResponse(BaseModel):
    """Language details schema."""

    id: int
    language_code: str
    language_name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TranslateRequest(BaseModel):
    """Request schema for dynamic single text translation."""

    text: str = Field(..., min_length=1)
    target_language: str = Field("hi", description="ISO language code, e.g., hi, te, ta, kn, ml, etc.")


class TranslateResponse(BaseModel):
    """Response schema for dynamic translation."""

    original_text: str
    translated_text: str
    target_language: str


class TransliterateRequest(BaseModel):
    """Request schema for personal details & names transliteration."""

    text: str = Field(..., min_length=1)
    target_language: str = Field("hi", description="ISO language code, e.g., hi, te, ta, kn, ml, etc.")


class TransliterateResponse(BaseModel):
    """Response schema for dynamic transliteration."""

    original_text: str
    transliterated_text: str
    target_language: str


class BulkTranslateRequest(BaseModel):
    """Request schema for bulk text translation."""

    texts: list[str] = Field(..., min_length=1)
    target_language: str = Field("hi")


class BulkTranslateResponse(BaseModel):
    """Response schema for bulk text translation."""

    translations: dict[str, str]
    target_language: str


class TranslationItemRequest(BaseModel):
    """Request to insert or update a translation value."""

    key: str = Field(..., min_length=1)
    language_code: str = Field(..., min_length=2)
    translated_text: str = Field(..., min_length=1)


class GenerateMissingTranslationsRequest(BaseModel):
    """Request schema to trigger Sarvam AI auto-generation of missing translations."""

    language_codes: list[str] | None = Field(default=None, description="Optional list of language codes to populate.")


class AuthorResponse(BaseModel):
    id: int
    name: str
    avatar: str
    location: str
    followers: int


class CommunityPostResponse(BaseModel):
    id: int
    author: AuthorResponse
    time: str
    content: str
    image: str | None = None
    tags: list[str] = []
    likes: int = 0
    comments: int = 0
    isLiked: bool = False
    isSaved: bool = False


class CommunityPostCreate(BaseModel):
    content: str
    tags: list[str] = []
    image: str | None = None


class ConnectionUserResponse(BaseModel):
    id: int
    name: str
    avatar: str
    location: str
    role: str


class ConnectionsResponse(BaseModel):
    followers: list[ConnectionUserResponse]
    following: list[ConnectionUserResponse]

        
