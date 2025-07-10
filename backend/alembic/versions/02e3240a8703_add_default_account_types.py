"""add default account types

Revision ID: <NEW_REVISION_ID_ЗДЕСЬ>
Revises: 9abbd5311ec3
Create Date: <ТЕКУЩАЯ_ДАТА_ВРЕМЯ>

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '<NEW_REVISION_ID_ЗДЕСЬ>' # Убедитесь, что это ID, сгенерированный Alembic
down_revision = '9abbd5311ec3' # Это должно совпадать с 'Revises' из вашей новой миграции
branch_labels = None
depends_on = None


def upgrade():
    # Добавляем начальные типы счетов
    op.bulk_insert(
        sa.Table(
            'account_types',
            sa.MetaData(),
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String, nullable=False, unique=True),
            sa.Column('code', sa.String, nullable=False, unique=True),
            sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        ),
        [
            {'id': 1, 'name': 'Наличные', 'code': 'cash'},
            {'id': 2, 'name': 'Банковский счет', 'code': 'bank_account'},
        ]
    )


def downgrade():
    # Откат: удаляем добавленные типы счетов
    op.execute("DELETE FROM account_types WHERE id IN (1, 2);")