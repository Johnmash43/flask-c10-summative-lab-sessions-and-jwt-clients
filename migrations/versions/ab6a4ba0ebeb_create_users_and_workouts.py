from alembic import op
import sqlalchemy as sa

revision = "ab6a4ba0ebeb"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=128), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_table(
        "workout",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("exercise", sa.String(length=120), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("workout")
    op.drop_table("user")
