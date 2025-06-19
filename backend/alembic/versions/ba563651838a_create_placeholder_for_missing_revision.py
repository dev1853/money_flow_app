"""Create placeholder for missing revision

Revision ID: ba563651838a
Revises: 2735f2d464ca
Create Date: 2025-06-18 15:07:31.493419

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba563651838a'
down_revision: Union[str, None] = '2735f2d464ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
