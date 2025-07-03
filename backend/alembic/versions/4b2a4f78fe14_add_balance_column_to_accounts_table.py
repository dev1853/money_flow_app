"""Add balance column to accounts table

Revision ID: 4b2a4f78fe14
Revises: 4eeabe677539  # <-- Убедитесь, что ID предыдущей миграции верный
Create Date: 2025-07-03 11:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b2a4f78fe14'
down_revision: Union[str, None] = '4eeabe677539' # <-- ID предыдущей миграции
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### ПРАВИЛЬНАЯ КОМАНДА ###
    # Добавляем колонку 'balance' в таблицу 'accounts'
    op.add_column(
        'accounts', 
        sa.Column('balance', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.0')
    )
    # ### КОНЕЦ КОМАНДЫ ###


def downgrade() -> None:
    # ### КОМАНДА ДЛЯ ОТКАТА ###
    # Удаляем колонку 'balance' из таблицы 'accounts'
    op.drop_column('accounts', 'balance')
    # ### КОНЕЦ КОМАНДЫ ###