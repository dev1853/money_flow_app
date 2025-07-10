"""add initial roles (user, admin)

Revision ID: 9abbd5311ec3
Revises: b88eecc3bf55
Create Date: 2025-07-10 14:04:27.705811

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# from sqlalchemy.dialects import postgresql # Эту строку можно удалить, если postgresql не используется напрямую в upgrade/downgrade

# revision identifiers, used by Alembic.
revision: str = '9abbd5311ec3' # Ваш сгенерированный ID
down_revision: Union[str, None] = 'b88eecc3bf55' # Ваш предыдущий ID
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### КОМАНДЫ ДЛЯ ДОБАВЛЕНИЯ РОЛЕЙ ###
    op.bulk_insert(
        sa.Table(
            'roles',
            sa.MetaData(),
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String, nullable=False),
        ),
        [
            {'id': 1, 'name': 'admin'},
            {'id': 2, 'name': 'user'}, # Эта роль с id=2, которая вызывала ошибку
        ]
    )
    # ### конец команд ###


def downgrade() -> None:
    # ### КОМАНДЫ ДЛЯ ОТКАТА РОЛЕЙ ###
    op.execute("DELETE FROM roles WHERE id IN (1, 2);")
    # ### конец команд ###