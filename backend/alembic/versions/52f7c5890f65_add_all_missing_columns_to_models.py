# backend/alembic/versions/52f7c5890f65_add_all_missing_columns_to_models.py

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision: str = '52f7c5890f65' 
down_revision: Union[str, None] = 'b5d52f4efb13' 
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    # --- ACCOUNTS TABLE OPERATIONS ---
    table_name = 'accounts'
    columns = inspector.get_columns(table_name)
    column_names = [col['name'] for col in columns]

    # initial_balance
    if 'initial_balance' not in column_names:
        op.add_column(table_name, sa.Column('initial_balance', sa.Float(), nullable=True, server_default=sa.text('0.0')))
        print(f"Added 'initial_balance' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET initial_balance = 0.0 WHERE initial_balance IS NULL")
    op.alter_column(table_name, 'initial_balance', existing_type=sa.Float(), nullable=False, existing_nullable=True, server_default=None) 
    print(f"Set {table_name}.initial_balance to NOT NULL.")

    # current_balance
    if 'current_balance' not in column_names:
        op.add_column(table_name, sa.Column('current_balance', sa.Float(), nullable=True, server_default=sa.text('0.0')))
        print(f"Added 'current_balance' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET current_balance = 0.0 WHERE current_balance IS NULL")
    op.alter_column(table_name, 'current_balance', existing_type=sa.Float(), nullable=False, existing_nullable=True, server_default=None)
    print(f"Set {table_name}.current_balance to NOT NULL.")
    
    # currency (for accounts)
    if 'currency' not in column_names:
        op.add_column(table_name, sa.Column('currency', sa.String(), nullable=True, server_default=sa.text("'USD'")))
        print(f"Added 'currency' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET currency = 'USD' WHERE currency IS NULL")
    op.alter_column(table_name, 'currency', existing_type=sa.String(), nullable=False, existing_nullable=True, server_default=None)
    print(f"Set {table_name}.currency to NOT NULL.")

    # owner_id (for accounts) - ВРЕМЕННО ДЕЛАЕМ NULLABLE
    if 'owner_id' not in column_names:
        op.add_column(table_name, sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True)) # Убран server_default и сделано nullable=True
        print(f"Added 'owner_id' (nullable) to {table_name}.")
    # op.execute(f"UPDATE {table_name} SET owner_id = 1 WHERE owner_id IS NULL") # <--- ЗАКОММЕНТИРОВАНО
    # op.alter_column(table_name, 'owner_id', existing_type=sa.Integer(), nullable=False, existing_nullable=True, server_default=None) # <--- ЗАКОММЕНТИРОВАНО
    # print(f"Set {table_name}.owner_id to NOT NULL (TEMPORARILY SKIPPED).")


    # --- WORKSPACES TABLE OPERATIONS ---
    table_name = 'workspaces'
    columns = inspector.get_columns(table_name)
    column_names = [col['name'] for col in columns]

    if 'currency' not in column_names:
        op.add_column(table_name, sa.Column('currency', sa.String(), nullable=True, server_default=sa.text("'USD'")))
        print(f"Added 'currency' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET currency = 'USD' WHERE currency IS NULL")
    op.alter_column(table_name, 'currency', existing_type=sa.String(), nullable=False, existing_nullable=True, server_default=None)
    print(f"Set {table_name}.currency to NOT NULL.")

    # owner_id (for workspaces) - ВРЕМЕННО ДЕЛАЕМ NULLABLE
    if 'owner_id' not in column_names:
        op.add_column(table_name, sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True)) # Убран server_default и сделано nullable=True
        print(f"Added 'owner_id' (nullable) to {table_name}.")
    # op.execute(f"UPDATE {table_name} SET owner_id = 1 WHERE owner_id IS NULL") # <--- ЗАКОММЕНТИРОВАНО
    # op.alter_column(table_name, 'owner_id', existing_type=sa.Integer(), nullable=False, existing_nullable=True, server_default=None) # <--- ЗАКОММЕНТИРОВАНО
    # print(f"Set {table_name}.owner_id to NOT NULL (TEMPORARILY SKIPPED).")


    # --- DDS_ARTICLES TABLE OPERATIONS ---
    table_name = 'dds_articles'
    columns = inspector.get_columns(table_name)
    column_names = [col['name'] for col in columns]

    # owner_id (for dds_articles) - ВРЕМЕННО ДЕЛАЕМ NULLABLE
    if 'owner_id' not in column_names:
        op.add_column(table_name, sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True)) # Убран server_default и сделано nullable=True
        print(f"Added 'owner_id' (nullable) to {table_name}.")
    # op.execute(f"UPDATE {table_name} SET owner_id = 1 WHERE owner_id IS NULL") # <--- ЗАКОММЕНТИРОВАНО
    # op.alter_column(table_name, 'owner_id', existing_type=sa.Integer(), nullable=False, existing_nullable=True, server_default=None) # <--- ЗАКОММЕНТИРОВАНО
    # print(f"Set {table_name}.owner_id to NOT NULL (TEMPORARILY SKIPPED).")
    
    # type (for dds_articles)
    if 'type' not in column_names:
        op.add_column(table_name, sa.Column('type', sa.String(), nullable=True, server_default=sa.text("'expense'")))
        print(f"Added 'type' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET type = 'expense' WHERE type IS NULL")
    op.alter_column(table_name, 'type', existing_type=sa.String(), nullable=False, existing_nullable=True, server_default=None)
    print(f"Set {table_name}.type to NOT NULL.")


    # --- TRANSACTIONS TABLE OPERATIONS ---
    table_name = 'transactions'
    columns = inspector.get_columns(table_name)
    column_names = [col['name'] for col in columns]

    # owner_id (for transactions) - ВРЕМЕННО ДЕЛАЕМ NULLABLE
    if 'owner_id' not in column_names:
        op.add_column(table_name, sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True)) # Убран server_default и сделано nullable=True
        print(f"Added 'owner_id' (nullable) to {table_name}.")
    # op.execute(f"UPDATE {table_name} SET owner_id = 1 WHERE owner_id IS NULL") # <--- ЗАКОММЕНТИРОВАНО
    # op.alter_column(table_name, 'owner_id', existing_type=sa.Integer(), nullable=False, existing_nullable=True, server_default=None) # <--- ЗАКОММЕНТИРОВАНО
    # print(f"Set {table_name}.owner_id to NOT NULL (TEMPORARILY SKIPPED).")
    
    # transaction_type
    if 'transaction_type' not in column_names:
        op.add_column(table_name, sa.Column('transaction_type', sa.String(), nullable=True, server_default=sa.text("'expense'")))
        print(f"Added 'transaction_type' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET transaction_type = 'expense' WHERE transaction_type IS NULL")
    op.alter_column(table_name, 'transaction_type', existing_type=sa.String(), nullable=False, existing_nullable=True, server_default=None)
    print(f"Set {table_name}.transaction_type to NOT NULL.")

    # created_at
    if 'created_at' not in column_names:
        op.add_column(table_name, sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
        print(f"Added 'created_at' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET created_at = NOW() WHERE created_at IS NULL")
    op.alter_column(table_name, 'created_at', existing_type=sa.DateTime(), nullable=False, existing_nullable=True, server_default=None) 
    print(f"Set {table_name}.created_at to NOT NULL.")
    
    # updated_at
    if 'updated_at' not in column_names:
        op.add_column(table_name, sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
        print(f"Added 'updated_at' to {table_name}.")
    op.execute(f"UPDATE {table_name} SET updated_at = NOW() WHERE updated_at IS NULL")
    op.alter_column(table_name, 'updated_at', existing_type=sa.DateTime(), nullable=False, existing_nullable=True, server_default=None) 
    print(f"Set {table_name}.updated_at to NOT NULL.")
    
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Обратная операция для всех измененных столбцов
    # Здесь нужно делать drop_column или alter_column(nullable=True)
    with op.batch_alter_table('accounts', schema=None) as batch_op:
        batch_op.drop_column('initial_balance')
        batch_op.drop_column('current_balance')
        batch_op.drop_column('currency')
        batch_op.drop_column('owner_id')

    with op.batch_alter_table('workspaces', schema=None) as batch_op:
        batch_op.drop_column('currency')
        batch_op.drop_column('owner_id')

    with op.batch_alter_table('dds_articles', schema=None) as batch_op:
        batch_op.drop_column('owner_id')
        batch_op.drop_column('type')

    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_column('owner_id')
        batch_op.drop_column('transaction_type')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_at')
    # ### end Alembic commands ###