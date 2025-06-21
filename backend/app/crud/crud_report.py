from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date
from typing import List
from app import models, schemas, crud

# Создаем класс для всей логики, связанной с отчетами
class CRUDReport:
    def get_dds_report_data(self, db: Session, *, workspace_id: int, start_date: date, end_date: date) -> List[schemas.DdsReportItem]:
        # Шаг 1: Получаем агрегированные данные по транзакциям за период
        transactions_agg_query = (
            db.query(
                models.Transaction.dds_article_id,
                func.sum(case((models.Transaction.transaction_type == 'income', models.Transaction.amount), else_=0)).label('income'),
                func.sum(case((models.Transaction.transaction_type == 'expense', models.Transaction.amount), else_=0)).label('expense')
            )
            .join(models.Account)
            .filter(
                models.Account.workspace_id == workspace_id,
                models.Transaction.date.between(start_date, end_date),
                models.Transaction.dds_article_id.isnot(None)
            )
            .group_by(models.Transaction.dds_article_id)
        )
        
        transactions_map = {
            row.dds_article_id: {"income": row.income or 0, "expense": row.expense or 0}
            for row in transactions_agg_query.all()
        }

        # Шаг 2: Получаем все статьи ДДС для построения полного дерева
        all_articles = crud.dds_article.get_multi_by_workspace(db, workspace_id=workspace_id, limit=1000)
        
        article_nodes = {
            article.id: schemas.DdsReportItem(
                article_id=article.id,
                article_name=article.name,
                parent_id=article.parent_id,
                income=transactions_map.get(article.id, {}).get("income", 0.0),
                expense=transactions_map.get(article.id, {}).get("expense", 0.0),
                initial_balance=0.0,
                final_balance=0.0
            )
            for article in all_articles
        }

        # Шаг 3: Рекурсивно строим дерево и рассчитываем итоги
        def build_and_sum_tree(node: schemas.DdsReportItem):
            children = [article_nodes[child.id] for child in all_articles if child.parent_id == node.article_id]
            node.children = children
            
            for child_node in node.children:
                build_and_sum_tree(child_node)
                node.income += child_node.income
                node.expense += child_node.expense
            
            node.final_balance = node.initial_balance + node.income - node.expense

        root_nodes = [node for node in article_nodes.values() if node.parent_id is None]
        for root_node in root_nodes:
            build_and_sum_tree(root_node)
            
        return root_nodes

    # Здесь в будущем можно будет добавить другие методы для отчетов
    # def get_pnl_report_data(...)

# Создаем единый экземпляр класса для использования в роутерах
report = CRUDReport()