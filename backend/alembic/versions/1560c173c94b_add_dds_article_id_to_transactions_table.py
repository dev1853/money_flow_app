"""Add dds_article_id to transactions table

Revision ID: 1560c173c94b
Revises: 256d63e564c6
Create Date: 2025-07-04 14:02:54.483344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1560c173c94b'
down_revision: Union[str, None] = '256d63e564c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('transactions', sa.Column('dds_article_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_transactions_dds_article_id', # Имя ограничения
        'transactions', 'dds_articles',
        ['dds_article_id'], ['id']
    )

def downgrade() -> None:
    op.drop_constraint('fk_transactions_dds_article_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'dds_article_id')
    # ### end Alembic commands ###
