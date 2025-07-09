# backend/app/crud/__init__.py

from .crud_user import user
from .crud_workspace import workspace
from .crud_account import account
from .crud_transaction import transaction
from .crud_dds_article import dds_article
from .crud_report import report_crud
from .crud_dashboard import dashboard_crud
from . import crud_onboarding as onboarding
from .crud_mapping_rule import mapping_rule
from .crud_budget import budget
from .crud_budget_item import budget_item
from .crud_account_type import account_type
from .crud_planned_payment import planned_payment

# Строка 'budget = budget_crud' была удалена, так как она была неверной и вызывала ошибку.
# Теперь все импорты настроены правильно.