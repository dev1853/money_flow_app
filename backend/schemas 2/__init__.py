# /backend/app/schemas/__init__.py

# Импортируем самые важные схемы из их новых модулей,
# чтобы они были доступны напрямую из пакета `schemas`.

from .token import Token, TokenData
from .user import User, UserCreate, UserUpdate
from .account import Account, AccountCreate, AccountUpdate
from .workspace import Workspace, WorkspaceCreate, WorkspaceUpdate
from .transaction import Transaction, TransactionCreate, TransactionUpdate, TransactionType
from .dds_article import DdsArticle, DdsArticleCreate, DdsArticleUpdate

# --- УБЕДИТЕСЬ, ЧТО ЭТА СТРОКА ПРИСУТСТВУЕТ ---
from .budget import Budget, BudgetCreate, BudgetUpdate, BudgetItem, BudgetItemCreate

from .mapping_rule import MappingRule, MappingRuleCreate, MappingRuleUpdate, MappingRulePage
from .reports import DdsReportItem, ProfitLossReport, AccountBalance
from .dashboard import DashboardSummaryData, DashboardCashflowTrendData

# Таким образом, в роутерах мы все еще сможем писать:
# from app import schemas
# response_model=schemas.Budget
# ... и это будет работать.