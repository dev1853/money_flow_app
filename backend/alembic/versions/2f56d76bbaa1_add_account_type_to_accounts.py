"""Add account_type to accounts

Revision ID: 2f56d76bbaa1
Revises: 4b2a4f78fe14
Create Date: 2025-07-03 13:40:49.740628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f56d76bbaa1'
down_revision: Union[str, None] = '4b2a4f78fe14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### Команда написана вручную для безопасности ###
    # Добавляем колонку 'account_type' в таблицу 'accounts'
    op.add_column(
        'accounts', 
        sa.Column('account_type', sa.String(length=50), nullable=False, server_default='cash')
    )
    # ### Конец команд ###


def downgrade() -> None:
    # ### Команда для отката, написана вручную ###
    # Удаляем колонку 'account_type' из таблицы 'accounts'
    op.drop_column('accounts', 'account_type')
    # ### Конец команд ###