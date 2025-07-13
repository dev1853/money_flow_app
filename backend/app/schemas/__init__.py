# /backend/app/schemas/__init__.py

from typing import Optional, List 

from .token import Token, TokenData
from .user import User, UserCreate, UserUpdate
from .account import Account, AccountCreate, AccountUpdate
from .workspace import Workspace, WorkspaceCreate, WorkspaceUpdate
from .transaction import Transaction, TransactionCreate, TransactionUpdate, TransactionType, TransactionPage
from .dds_article import DdsArticle, DdsArticleCreate, DdsArticleUpdate
from .mapping_rule import MappingRule, MappingRuleCreate, MappingRuleUpdate, MappingRulePage
from .reports import DdsReportItem, DdsReport, ProfitLossReport
from .dashboard import SummaryItem, DashboardSummaryData, DashboardCashflowTrendData
from .statement import StatementUploadResponse
from .account_type import AccountType, AccountTypeBase, AccountTypeCreate, AccountTypeUpdate
from .planned_payment import PlannedPayment, PlannedPaymentCreate, PlannedPaymentUpdate

from .budget import Budget, BudgetCreate, BudgetUpdate, BudgetItem, BudgetItemCreate, BudgetItemUpdate
from .budget_status import BudgetStatus, BudgetItemStatus

from .contract import Contract, ContractCreate, ContractUpdate, ContractPage 
from .counterparty import Counterparty, CounterpartyCreate, CounterpartyUpdate, CounterpartyPage 

# Добавляем явные вызовы model_rebuild() для разрешения прямых ссылок
User.model_rebuild()
Workspace.model_rebuild()
Transaction.model_rebuild()