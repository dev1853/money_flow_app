"""Resolve ambiguous foreign key for User.workspaces relationship

Revision ID: 31c23b4f741f
Revises: 6cb13333af45
Create Date: 2025-06-21 23:11:09.616269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31c23b4f741f'
down_revision: Union[str, None] = '6cb13333af45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
