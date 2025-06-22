# backend/app/crud/crud_report.py

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date

from app.crud.base import CRUDBase
from app import models, schemas

class CRUDReport(CRUDBase[models.User, schemas.UserCreate, schemas.UserUpdate]):
    # ... (другие методы, например, get_multi_paginated_transactions_for_report) ...

    def get_dds_report(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Формирует отчет о движении денежных средств (ДДС) в иерархическом виде.
        Возвращает статьи ДДС с агрегированными суммами транзакций за период.
        """
        # Сначала получаем плоский список статей с суммами транзакций
        # ИЗМЕНЕНО: Добавлен models.DdsArticle.id в запрос!
        results = db.query(
            models.DdsArticle.id, # <--- ДОБАВЛЕНО: ID статьи ДДС
            models.DdsArticle.name,
            models.DdsArticle.type,
            models.DdsArticle.parent_id,
            func.sum(models.Transaction.amount * case(
                (models.Transaction.transaction_type == 'income', 1), 
                (models.Transaction.transaction_type == 'expense', -1)
            )).label("total_amount")
        ).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.owner_id == owner_id,
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        ).join(
            models.DdsArticle, models.Transaction.dds_article_id == models.DdsArticle.id
        ).group_by(
            models.DdsArticle.id, # <--- ДОБАВЛЕНО: Группируем по ID
            models.DdsArticle.name,
            models.DdsArticle.type,
            models.DdsArticle.parent_id
        ).all()

        # Создаем словарь для быстрого доступа к агрегированным данным по ID статьи
        article_data_map = {}
        for dds_id, name, type, parent_id, total_amount in results:
            article_data_map[dds_id] = {
                "article_id": dds_id,
                "article_name": name,
                "article_type": type,
                "parent_id": parent_id,
                "total_amount": total_amount,
                "income": total_amount if total_amount >= 0 and type == 'income' else 0,
                "expense": -total_amount if total_amount < 0 and type == 'expense' else 0,
                "children": [] # Будет заполнено позже
            }
            # Также инициализируем доход/расход для статей, по которым не было транзакций,
            # но они нужны для структуры дерева. (Это обрабатывает DDSReportPage).
        
        # Добавляем все статьи (включая те, по которым не было транзакций), 
        # чтобы построить полное дерево.
        # ИСПРАВЛЕНИЕ: Получаем все статьи, чтобы учесть и те, по которым нет транзакций
        all_dds_articles = db.query(models.DdsArticle).filter(
            models.DdsArticle.workspace_id == workspace_id,
            models.DdsArticle.owner_id == owner_id
        ).all()

        # Создаем узлы дерева
        nodes = {
            article.id: {
                "article_id": article.id,
                "article_name": article.name,
                "article_type": article.type,
                "parent_id": article.parent_id,
                "income": 0.0,
                "expense": 0.0,
                "initial_balance": 0.0, # DDS report doesn't usually have initial/final balance per article
                "final_balance": 0.0,
                "children": []
            }
            for article in all_dds_articles
        }

        # Обновляем узлы с фактическими данными по транзакциям
        for article_id, data in article_data_map.items():
            if article_id in nodes:
                nodes[article_id]["income"] = data["income"]
                nodes[article_id]["expense"] = data["expense"]
                # Для group-статей income/expense могут быть не 0 на бэкенде, 
                # но мы их вычисляем на фронтенде для DDSReportItem.
                # Здесь мы просто берем тотал_амаунт для листовых статей.
                # Для групп income/expense будут 0, пока мы не реализуем агрегацию по дереву здесь.

        # Построение иерархии
        root_nodes = []
        for node_id, node in nodes.items():
            if node["parent_id"] is None:
                root_nodes.append(node)
            else:
                parent_node = nodes.get(node["parent_id"])
                if parent_node:
                    parent_node["children"].append(node)
        
        # Функция для сортировки детей и рекурсивного расчета балансов для групп
        def sort_and_calculate_group_balances(node):
            if node["children"]:
                # Сортируем детей: сначала группы, потом по имени
                node["children"].sort(key=lambda x: (x["article_type"] != "group", x["article_name"]))
                
                group_income = 0.0
                group_expense = 0.0
                for child in node["children"]:
                    sort_and_calculate_group_balances(child) # Рекурсивный вызов
                    # Агрегируем суммы детей в родительскую группу
                    # Только если родитель - группа, и дети - тоже статьи, а не другие группы.
                    # Это сложная логика, которую лучше добавить позже или упростить.
                    # Для DDS отчета, обычно агрегируют только для финального отображения.

                    # Пока просто берем суммы детей для агрегации в родительскую группу
                    if node["article_type"] == "group":
                        group_income += child["income"]
                        group_expense += child["expense"]
                
                # Обновляем income/expense для групповых статей
                if node["article_type"] == "group":
                    node["income"] = group_income
                    node["expense"] = group_expense
            
            # initial_balance и final_balance не являются частью DDS-статьи как таковой,
            # это показатели для счета. Мы вычисляем их в DdsReportTable.jsx.

            return node # Возвращаем узел после обработки детей
        
        # Применяем сортировку и агрегацию к корневым узлам
        for node in root_nodes:
            sort_and_calculate_group_balances(node)

        # Сортировка корневых узлов: сначала группы, затем по имени
        root_nodes.sort(key=lambda x: (x["article_type"] != "group", x["article_name"]))

        return root_nodes


report_crud = CRUDReport(models.User) # Assuming this is correct from your context