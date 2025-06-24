# backend/app/crud/report_generators/dds_report.py

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, case, and_ # <--- ДОБАВЛЕН 'case'
from datetime import date

# Импорты моделей и схем, необходимые для этой функции
from app import models, schemas
from app import crud # Для crud.workspace и crud.dds_article, если они нужны внутри


def get_dds_report(
    db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
) -> List[Dict[str, Any]]:
    """
    Формирует отчет о движении денежных средств (ДДС) в иерархическом виде.
    Возвращает статьи ДДС с агрегированными суммами транзакций за период.
    Фильтрует статьи с нулевым итоговым потоком.
    """
    # Получаем все статьи ДДС для данного рабочего пространства
    all_dds_articles = db.query(models.DdsArticle).filter(
        models.DdsArticle.workspace_id == workspace_id,
        models.DdsArticle.owner_id == owner_id
    ).all()

    # Создаем словарь для быстрого доступа к агрегированным данным по ID статьи
    article_map = {article.id: article for article in all_dds_articles}

    # Агрегируем суммы транзакций по каждой ЛИСТОВОЙ статье за период
    results = db.query(
        models.DdsArticle.id,
        models.DdsArticle.type,
        func.sum(models.Transaction.amount * case( # <--- ИСПОЛЬЗУЕМ case здесь
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
        models.DdsArticle.id,
        models.DdsArticle.type
    ).all()

    # Инициализируем узлы дерева с нулевыми суммами
    nodes = {
        article.id: {
            "article_id": article.id,
            "article_name": article.name,
            "article_type": article.type,
            "parent_id": article.parent_id,
            "income": 0.0,
            "expense": 0.0,
            "initial_balance": 0.0, 
            "final_balance": 0.0,
            "children": [],
            "has_actual_flow": False 
        }
        for article in all_dds_articles
    }

    # Заполняем узлы фактическими суммами транзакций для ЛИСТОВЫХ статей
    for dds_id, type, total_amount in results:
        if dds_id in nodes:
            nodes[dds_id]["income"] = total_amount if total_amount >= 0 and type == 'income' else 0
            nodes[dds_id]["expense"] = -total_amount if total_amount < 0 and type == 'expense' else 0
            if total_amount != 0:
                nodes[dds_id]["has_actual_flow"] = True 


    # Рекурсивная функция для построения дерева, агрегации сумм и фильтрации
    def build_tree_and_aggregate_filter(node_id):
        node = nodes[node_id]
        
        children_with_flow = []
        for child_article in [a for a in all_dds_articles if a.parent_id == node_id]:
            child_node_processed = build_tree_and_aggregate_filter(child_article.id)
            if child_node_processed: 
                node["children"].append(child_node_processed)
                node["has_actual_flow"] = True

        node["children"].sort(key=lambda x: (x["article_type"] != "group", x["article_name"]))

        if node["article_type"] == "group":
            group_income = sum(child["income"] for child in node["children"])
            group_expense = sum(child["expense"] for child in node["children"])
            
            group_income += nodes[node_id]["income"] 
            group_expense += nodes[node_id]["expense"]
            
            node["income"] = group_income
            node["expense"] = group_expense
            if group_income != 0 or group_expense != 0:
                node["has_actual_flow"] = True 

        if node["has_actual_flow"] or node["income"] != 0 or node["expense"] != 0:
            return node
        else:
            return None 

    final_report_tree = []
    for article in all_dds_articles:
        if article.parent_id is None: 
            processed_root = build_tree_and_aggregate_filter(article.id)
            if processed_root:
                final_report_tree.append(processed_root)
    
    final_report_tree.sort(key=lambda x: (x["article_type"] != "group", x["article_name"]))

    return final_report_tree