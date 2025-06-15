from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session

from .. import crud, models, schemas, auth_utils
from ..database import get_db

router = APIRouter(
    prefix="/api", # Обратите внимание, префикс здесь /api, а не /api/statement
    tags=["Statement Upload"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)

@router.post("/upload-statement", response_model=schemas.StatementUploadResponse)
async def upload_statement(
    workspace_id: int = Form(...),
    account_id: int = Form(...),
    default_income_article_id: int = Form(...),
    default_expense_article_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Загружает и обрабатывает банковскую выписку в формате CSV.
    """
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Неверный формат файла. Пожалуйста, загрузите CSV файл.")

    try:
        contents = await file.read()
        file_data_str = contents.decode('utf-8') 
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось прочитать файл: {e}")
    finally:
        await file.close()

    crud.validate_workspace_ownership_for_ids(
        db,
        workspace_id=workspace_id,
        account_ids=[account_id],
        dds_article_ids=[default_income_article_id, default_expense_article_id]
    )

    processed_info = crud.process_tinkoff_statement(
        db=db, 
        csv_data_str=file_data_str, 
        account_id=account_id, 
        default_income_article_id=default_income_article_id,
        default_expense_article_id=default_expense_article_id,
        created_by_user_id=current_user.id,
        workspace_id=workspace_id
    )
    
    return schemas.StatementUploadResponse(
        message="Выписка обработана.",
        created_transactions=processed_info.get("created_count", 0),
        failed_rows=processed_info.get("failed_rows", 0),
        skipped_duplicates_count=processed_info.get("skipped_duplicates", 0),
        failed_row_details=processed_info.get("failed_row_details", [])
    )