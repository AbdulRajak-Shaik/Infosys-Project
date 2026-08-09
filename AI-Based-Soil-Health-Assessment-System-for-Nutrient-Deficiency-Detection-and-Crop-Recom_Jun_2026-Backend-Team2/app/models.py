from __future__ import annotations

import enum

from datetime import datetime
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class Language(Base):
    """
    SQLAlchemy model representing the languages table.
    Stores predefined languages used by users.
    """
    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    language_name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    language_code: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        nullable=False,
    )

    is_default: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Normalized relationship: users reference a language via language_id.
    users: Mapped[list["User"]] = relationship(back_populates="language")


class User(Base):
    """
    SQLAlchemy model representing the users table.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default=UserRole.FARMER.value, server_default="farmer", nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default=UserStatus.ACTIVE.value, server_default="active", nullable=False, index=True
    )
    region: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    language_id: Mapped[int | None] = mapped_column(ForeignKey("languages.id"), nullable=True, index=True)

    # Login/logout tracking fields for future logout support.
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_logout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Normalized relationship: each user belongs to exactly one language.
    language: Mapped[Language | None] = relationship(back_populates="users")

    # Audit timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    prediction_history: Mapped[list["PredictionHistory"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    chat_history: Mapped[list["ChatHistory"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class PredictionHistory(Base):
    """Stores a completed final recommendation for a user."""
    __tablename__ = "prediction_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    soil_image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    soil_type: Mapped[str] = mapped_column(String(100), nullable=False)
    soil_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    nitrogen: Mapped[float] = mapped_column(Float, nullable=False)
    phosphorus: Mapped[float] = mapped_column(Float, nullable=False)
    potassium: Mapped[float] = mapped_column(Float, nullable=False)
    ph: Mapped[float] = mapped_column(Float, nullable=False)
    organic_carbon: Mapped[float] = mapped_column(Float, nullable=False)
    electrical_conductivity: Mapped[float] = mapped_column(Float, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    humidity: Mapped[float] = mapped_column(Float, nullable=False)
    soil_health: Mapped[str] = mapped_column(String(100), nullable=False)
    soil_health_score: Mapped[float] = mapped_column(Float, nullable=False)
    soil_fertility_status: Mapped[str] = mapped_column(String(100), nullable=False)
    nutrient_deficiencies: Mapped[list] = mapped_column(JSON, nullable=False)
    recommended_crops: Mapped[list] = mapped_column(JSON, nullable=False)
    recommended_fertilizers: Mapped[list] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="prediction_history")


class ChatHistory(Base):
    """Stores chatbot conversations for an authenticated user."""
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    prediction_history_id: Mapped[int | None] = mapped_column(
        ForeignKey("prediction_history.id"),
        nullable=True,
        index=True,
    )
    user_message: Mapped[str] = mapped_column(String, nullable=False)
    question_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    assistant_response: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="chat_history")


class Feedback(Base):
    """Stores feedback submitted by users."""
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    rating: Mapped[int] = mapped_column(nullable=False)
    comment: Mapped[str] = mapped_column(String(500), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship()


class Multilingual(Base):
    """Stores multilingual text values across all 23 Indian & regional languages."""
    __tablename__ = "multilingual"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    english: Mapped[str] = mapped_column(String(500), nullable=False)
    hindi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    telugu: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tamil: Mapped[str | None] = mapped_column(String(500), nullable=True)
    kannada: Mapped[str | None] = mapped_column(String(500), nullable=True)
    malayalam: Mapped[str | None] = mapped_column(String(500), nullable=True)
    marathi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gujarati: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bengali: Mapped[str | None] = mapped_column(String(500), nullable=True)
    punjabi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    odia: Mapped[str | None] = mapped_column(String(500), nullable=True)
    assamese: Mapped[str | None] = mapped_column(String(500), nullable=True)
    urdu: Mapped[str | None] = mapped_column(String(500), nullable=True)
    maithili: Mapped[str | None] = mapped_column(String(500), nullable=True)
    manipuri: Mapped[str | None] = mapped_column(String(500), nullable=True)
    santali: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bodo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    dogri: Mapped[str | None] = mapped_column(String(500), nullable=True)
    kashmiri: Mapped[str | None] = mapped_column(String(500), nullable=True)
    konkani: Mapped[str | None] = mapped_column(String(500), nullable=True)
    nepali: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sanskrit: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sindhi: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
class TranslationKey(Base):
    """Stores master translation keys."""

    __tablename__ = "translation_keys"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    english: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    translations: Mapped[list["Translation"]] = relationship(
        back_populates="translation_key",
        cascade="all, delete-orphan",
    )


class Translation(Base):
    """Stores translated text for each language."""

    __tablename__ = "translations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    translation_key_id: Mapped[int] = mapped_column(
        ForeignKey("translation_keys.id"),
        nullable=False,
        index=True,
    )

    language_id: Mapped[int] = mapped_column(
        ForeignKey("languages.id"),
        nullable=False,
        index=True,
    )

    translated_text: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    translation_key: Mapped["TranslationKey"] = relationship(
        back_populates="translations",
    )

    language: Mapped["Language"] = relationship()