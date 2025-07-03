"""Add transaction_type to Transaction model

Revision ID: 4eeabe677539
Revises: 06d47e30adc3 
Create Date: 2025-06-26 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
# ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА ТЕ, ЧТО БЫЛИ В ВАШЕМ ФАЙЛЕ
revision = '4eeabe677539'
down_revision = '06d47e30adc3' 
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем новый ENUM тип в PostgreSQL
    transaction_type = sa.Enum('income', 'expense', name='transactiontype')
    transaction_type.create(op.get_bind(), checkfirst=True)
    
    # Добавляем новую колонку в таблицу 'transactions', которая использует этот тип
    # server_default='expense' нужен, чтобы заполнить существующие строки значением по умолчанию
    op.add_column(
        'transactions', 
        sa.Column('transaction_type', transaction_type, nullable=False, server_default='expense')
    )
    # Устанавливаем server_default в None после добавления, чтобы новые строки требовали явного указания типа
    op.alter_column('transactions', 'transaction_type', server_default=None)


def downgrade() -> None:
    # Удаляем колонку
    op.drop_column('transactions', 'transaction_type')
    
    # Удаляем ENUM тип
    transaction_type = sa.Enum('income', 'expense', name='transactiontype')
    transaction_type.drop(op.get_bind())