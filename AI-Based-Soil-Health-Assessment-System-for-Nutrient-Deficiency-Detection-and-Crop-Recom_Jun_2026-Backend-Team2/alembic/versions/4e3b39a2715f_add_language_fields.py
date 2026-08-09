"""add language fields

Revision ID: 4e3b39a2715f
Revises: f6a7b8c9d0e1
Create Date: 2026-07-30

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4e3b39a2715f"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "languages",
        sa.Column("language_code", sa.String(length=10), nullable=True),
    )

    op.add_column(
        "languages",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.add_column(
        "languages",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.create_unique_constraint(
        "uq_languages_language_code",
        "languages",
        ["language_code"],
    )

    op.execute("""
        UPDATE languages
        SET language_code = CASE language_name
            WHEN 'English' THEN 'en'
            WHEN 'Hindi' THEN 'hi'
            WHEN 'Telugu' THEN 'te'
            WHEN 'Tamil' THEN 'ta'
        END
    """)

    op.execute("""
        UPDATE languages
        SET is_default = TRUE
        WHERE language_name = 'English'
    """)

    op.alter_column("languages", "language_code", nullable=False)


def downgrade() -> None:
    op.drop_constraint(
        "uq_languages_language_code",
        "languages",
        type_="unique",
    )

    op.drop_column("languages", "is_active")
    op.drop_column("languages", "is_default")
    op.drop_column("languages", "language_code")