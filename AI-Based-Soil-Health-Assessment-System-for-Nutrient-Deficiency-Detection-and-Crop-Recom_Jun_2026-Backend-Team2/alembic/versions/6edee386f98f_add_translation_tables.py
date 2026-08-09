"""add_translation_tables

Revision ID: 6edee386f98f
Revises: 4e3b39a2715f
Create Date: 2026-07-31 14:08:22.890612

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6edee386f98f"
down_revision: Union[str, Sequence[str], None] = "4e3b39a2715f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "translation_keys",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("english", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_translation_keys_id"),
        "translation_keys",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_translation_keys_key"),
        "translation_keys",
        ["key"],
        unique=True,
    )

    op.create_table(
        "translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("translation_key_id", sa.Integer(), nullable=False),
        sa.Column("language_id", sa.Integer(), nullable=False),
        sa.Column("translated_text", sa.String(length=500), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["language_id"],
            ["languages.id"],
        ),
        sa.ForeignKeyConstraint(
            ["translation_key_id"],
            ["translation_keys.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_translations_id"),
        "translations",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_translations_language_id"),
        "translations",
        ["language_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_translations_translation_key_id"),
        "translations",
        ["translation_key_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_translations_translation_key_id"),
        table_name="translations",
    )

    op.drop_index(
        op.f("ix_translations_language_id"),
        table_name="translations",
    )

    op.drop_index(
        op.f("ix_translations_id"),
        table_name="translations",
    )

    op.drop_table("translations")

    op.drop_index(
        op.f("ix_translation_keys_key"),
        table_name="translation_keys",
    )

    op.drop_index(
        op.f("ix_translation_keys_id"),
        table_name="translation_keys",
    )

    op.drop_table("translation_keys")