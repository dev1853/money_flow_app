# backend/app/routers/statement.py

from __future__ import annotations
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form, Request 
from starlette.datastructures import UploadFile 
from sqlalchemy.orm import Session
import pandas as pd 
import io 
from datetime import date as date_type, datetime 
from pydantic import ValidationError 
import csv 
from sqlalchemy.exc import IntegrityError 

from app import crud, schemas, models, auth_utils 
from app.database import get_db
from app.schemas import TransactionType 

router = APIRouter(
    tags=["statement"],
    responses={404: {"description": "Not found"}},
)

@router.post("/upload", response_model=schemas.StatementUploadResponse)
async def upload_bank_statement(
    request: Request, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_active_user),
) -> Any:
    created_transactions_auto = 0
    failed_rows = 0
    skipped_duplicates_count = 0
    failed_row_details: List[schemas.FailedRowDetail] = []

    print(f"\n--- DEBUG(StatementUpload - API Start) ---")
    print(f"DEBUG(StatementUpload - API): Endpoint hit. Method: {request.method}, URL: {request.url}")
    print(f"DEBUG(StatementUpload - API): Request headers: {request.headers}")
    print(f"DEBUG(StatementUpload - API): current_user.id: {current_user.id}, active_workspace_id: {current_user.active_workspace_id}")
    
    file_obj_from_form: Optional[UploadFile] = None
    account_id_str_from_form: Optional[str] = None
    account_id: Optional[int] = None 

    try:
        form_data = await request.form() 
        
        file_obj_from_form = form_data.get("file") 
        account_id_str_from_form = form_data.get("account_id") 

        print(f"DEBUG(StatementUpload - API): Raw form_data received: {form_data}")
        print(f"DEBUG(StatementUpload - API): Extracted file_obj_from_form: {file_obj_from_form.filename if file_obj_from_form else 'None'}")
        print(f"DEBUG(StatementUpload - API): Extracted account_id_str_from_form: {account_id_str_from_form}")

        print(f"DEBUG(StatementUpload - API): Check: file_obj_from_form is None? {file_obj_from_form is None}")
        print(f"DEBUG(StatementUpload - API): Check: isinstance(file_obj_from_form, UploadFile)? {isinstance(file_obj_from_form, UploadFile)}")
        print(f"DEBUG(StatementUpload - API): Check: type(file_obj_from_form) is UploadFile? {type(file_obj_from_form) is UploadFile}")
        print(f"DEBUG(StatementUpload - API): Check: file_obj_from_form.__class__.__name__: {file_obj_from_form.__class__.__name__ if file_obj_from_form else 'None'}")
        print(f"DEBUG(StatementUpload - API): Check: UploadFile.__module__: {UploadFile.__module__}")
        print(f"DEBUG(StatementUpload - API): Check: file_obj_from_form.__module__: {file_obj_from_form.__module__ if file_obj_from_form else 'None'}")

        if not file_obj_from_form or not isinstance(file_obj_from_form, UploadFile):
            print("ERROR(StatementUpload - API): 'file' not found or not UploadFile in form_data.")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="body -> file: field required (from manual parse)"
            )
        if not account_id_str_from_form:
            print("ERROR(StatementUpload - API): 'account_id' not found in form_data.")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="body -> account_id: field required (from manual parse)"
            )
        
        try:
            account_id = int(account_id_str_from_form)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="account_id: value is not a valid integer (from manual parse)"
            )
        
        file = file_obj_from_form 

    except Exception as e:
        print(f"ERROR(StatementUpload - API): Failed to parse form data from request: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Не удалось разобрать данные формы: {e}"
        )


    if not current_user.active_workspace_id:
        print("ERROR(StatementUpload - API): No active workspace for user.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У пользователя не выбрано активное рабочее пространство. Невозможно импортировать транзакции."
        )
    
    active_workspace_obj = crud.workspace.get(db, id=current_user.active_workspace_id)
    if not active_workspace_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Активное рабочее пространство не найдено."
        )
    
    selected_account = None 
    if account_id: 
        selected_account = crud.account.get(db, id=account_id)
        if not selected_account or \
           selected_account.owner_id != current_user.id or \
           selected_account.workspace_id != active_workspace_obj.id or \
           selected_account.account_type != 'bank_account': 
            print(f"ERROR(StatementUpload - API): Selected account ID {account_id} invalid or not bank account type.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Выбранный счет не существует, не принадлежит вам, неактивен или не является банковским счетом."
            )

    if not file.filename.lower().endswith('.csv'):
        print(f"ERROR(StatementUpload - API): Invalid file extension: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поддерживаются только CSV файлы."
        )

    try:
        print(f"DEBUG(StatementUpload - API): Attempting to read file contents: {file.filename}")
        contents = await file.read()
        print(f"DEBUG(StatementUpload - API): File read. Size: {len(contents)} bytes.")
        
        try:
            decoded_contents = contents.decode('utf-8-sig')
            print("DEBUG(StatementUpload - API): Decoded with utf-8-sig.")
        except UnicodeDecodeError:
            try:
                decoded_contents = contents.decode('cp1251')
                print("DEBUG(StatementUpload - API): Decoded with cp1251.")
            except Exception as decode_err:
                print(f"ERROR(StatementUpload - API): Failed to decode file with utf-8-sig or cp1251: {decode_err}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось декодировать файл. Убедитесь, что это CSV в кодировке UTF-8-SIG или CP1251."
                )
        
        print("DEBUG(StatementUpload - API): File decoded. Starting CSV parsing.")
        
        lines = decoded_contents.splitlines() 
        if not lines:
            raise ValueError("Файл пуст или содержит только заголовки.")
        
        raw_header_line = lines[0]
        fieldnames = [h.strip() for h in raw_header_line.split(';')] 
        
        print(f"DEBUG(StatementUpload - API): Raw header line: '{raw_header_line}'")
        print(f"DEBUG(StatementUpload - API): Manually parsed fieldnames: {fieldnames}")

        csv_file_data = io.StringIO('\n'.join(lines[1:]), newline='') 
        reader = csv.DictReader(csv_file_data, delimiter=';', fieldnames=fieldnames) 
        
        print(f"DEBUG(StatementUpload - API): DictReader's fieldnames: {reader.fieldnames}")

        DATE_HEADERS = ['Дата проведения', 'Дата'] 
        AMOUNT_HEADERS = ['Сумма в валюте счёта', 'Сумма'] 
        DESCRIPTION_HEADERS = ['Описание операции', 'Назначение платежа'] 
        TYPE_HEADERS = ['Тип операции (пополнение/списание)', 'Тип'] 
        ACCOUNT_ID_HEADERS = ['Номер счёта', 'Счет контрагента', 'ID Счета', 'Account ID', 'Номер счета'] 
        
        def find_csv_column(row_dict, possible_headers):
            for header in possible_headers:
                if header in row_dict:
                    return row_dict[header]
            return None

        for i, row_dict in enumerate(reader):
            print(f"DEBUG (Statement Upload): Processing row {i+1}: {row_dict}")
            csv_date_str = None
            csv_amount_str = None
            csv_description = None
            csv_type_str = None
            csv_file_account_id = None
            transaction_date = None
            transaction_amount = 0.0 
            transaction_type = None

            try:
                csv_date_str = find_csv_column(row_dict, DATE_HEADERS)
                csv_amount_str = find_csv_column(row_dict, AMOUNT_HEADERS)
                csv_description = find_csv_column(row_dict, DESCRIPTION_HEADERS)
                if not csv_description: 
                    csv_description = find_csv_column(row_dict, ['Назначение платежа'])
                csv_type_str = find_csv_column(row_dict, TYPE_HEADERS) 
                csv_file_account_id = find_csv_column(row_dict, ACCOUNT_ID_HEADERS) 

                print(f"DEBUG (Statement Upload - Row): Parsed CSV data - Date: '{csv_date_str}', Amount: '{csv_amount_str}', Desc: '{csv_description}', Type: '{csv_type_str}', AccountID: '{csv_file_account_id}'")

                if csv_date_str:
                    try:
                        parsed_date = None
                        date_formats = ['%d.%m.%Y', '%Y-%m-%d', '%d.%m.%y'] 
                        for fmt in date_formats:
                            try:
                                parsed_date = datetime.strptime(csv_date_str, fmt).date()
                                break
                            except ValueError:
                                continue
                        if parsed_date:
                            transaction_date = parsed_date
                        else:
                            raise ValueError(f"Некорректный формат даты: '{csv_date_str}'. Ожидается ДД.ММ.ГГГГ, ГГГГ-ММ-ДД или ДД.ММ.ГГ.")
                    except ValueError:
                        raise ValueError(f"Некорректный формат даты: '{csv_date_str}'. Ожидается ДД.ММ.ГГГГ, ГГГГ-ММ-ДД или ДД.ММ.ГГ.")
                
                if csv_amount_str:
                    try:
                        cleaned_amount_str = csv_amount_str.replace(',', '.').replace('\u00A0', '').strip() 
                        transaction_amount = float(cleaned_amount_str)
                    except ValueError:
                        raise ValueError(f"Некорректный формат суммы: '{csv_amount_str}'")

                if csv_type_str:
                    csv_type_lower = csv_type_str.lower()
                    if any(s in csv_type_lower for s in ['кредит', 'пополнение', 'доход', 'income', 'поступление']):
                        transaction_type = 'income'
                    elif any(s in csv_type_lower for s in ['дебет', 'списание', 'расход', 'expense', 'выплата']):
                        transaction_type = 'expense'
                
                final_account_id = account_id 
                
                if not final_account_id:
                    raise ValueError("Не удалось определить счет для транзакции. Укажите его в форме или файле.")

                target_account = crud.account.get(db, id=final_account_id)
                if not target_account or \
                   target_account.owner_id != current_user.id or \
                   target_account.workspace_id != active_workspace_obj.id or \
                   target_account.account_type != 'bank_account': 
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Выбранный счет не существует, не принадлежит вам, неактивен или не является банковским счетом."
                    )
                
                if not transaction_date or transaction_amount == 0.0 or not transaction_type: 
                    raise ValueError("Недостаточно данных (Дата, Сумма, Тип обязательны) или некорректный формат.")


                existing_transaction = db.query(models.Transaction).filter(
                    models.Transaction.date == transaction_date,
                    models.Transaction.amount == transaction_amount,
                    models.Transaction.transaction_type == transaction_type,
                    models.Transaction.description == csv_description,
                    models.Transaction.account_id == final_account_id,
                    models.Transaction.owner_id == current_user.id,
                    models.Transaction.workspace_id == active_workspace_obj.id
                ).first()

                if existing_transaction:
                    skipped_duplicates_count += 1
                    print(f"DEBUG (Statement Upload): Skipped duplicate transaction: {row_dict}") 
                    continue

                transaction_in_data = {
                    "date": transaction_date,
                    "amount": transaction_amount,
                    "description": csv_description,
                    "account_id": final_account_id,
                    "transaction_type": transaction_type,
                    "workspace_id": active_workspace_obj.id,
                    "owner_id": current_user.id,
                    "dds_article_id": None 
                }
                
                matched_dds_article_id = crud.mapping_rule.find_matching_dds_article_id(
                    db=db,
                    workspace_id=active_workspace_obj.id,
                    description=transaction_in_data["description"],
                    transaction_type=transaction_in_data["transaction_type"]
                )
                if matched_dds_article_id:
                    transaction_in_data["dds_article_id"] = matched_dds_article_id
                    print(f"DEBUG (Statement Upload): Auto-categorized '{csv_description}' to DDS Article ID: {matched_dds_article_id}")
                
                transaction_create_schema = schemas.TransactionCreate(**transaction_in_data)
                created_db_transaction = crud.transaction.create_with_owner_and_workspace(
                    db=db,
                    obj_in=transaction_create_schema,
                    owner_id=current_user.id,
                    workspace_id=active_workspace_obj.id
                )
                
                crud.account.recalculate_balance(db=db, account_id=created_db_transaction.account.id)

                created_transactions_auto += 1

            except (ValueError, KeyError, ValidationError, HTTPException) as e:
                failed_rows += 1
                error_msg = str(e.detail) if isinstance(e, HTTPException) else str(e)
                failed_row_details.append(schemas.FailedRowDetail(
                    row=row_dict, 
                    error=f"Ошибка обработки строки: {error_msg}"
                ))
                print(f"ERROR (Statement Upload): Failed to process row: {row_dict}. Error: {e}")
                db.rollback() 
            except IntegrityError as e:
                db.rollback() 
                failed_rows += 1
                error_msg = str(e.orig) if e.orig else str(e)
                failed_row_details.append(schemas.FailedRowDetail(
                    row=row_dict, 
                    error=f"Ошибка целостности данных: {error_msg}"
                ))
                print(f"ERROR (Statement Upload): IntegrityError for row: {row_dict}. Error: {e}")
            except Exception as e:
                db.rollback() 
                failed_rows += 1
                failed_row_details.append(schemas.FailedRowDetail(
                    row=row_dict, 
                    error=f"Неизвестная ошибка: {e}"
                ))
                print(f"ERROR (Statement Upload): Unknown error for row: {row_dict}. Error: {e}")

    except Exception as e:
        print(f"ERROR (Statement Upload - Main Block): Unhandled error during file processing: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обработки файла выписки: {e}"
        )

    print(f"\n--- DEBUG(StatementUpload - API End) ---")
    print(f"DEBUG(StatementUpload - API): Upload summary: Created={created_transactions_auto}, Skipped={skipped_duplicates_count}, Failed={failed_rows}.")
    print(f"DEBUG(StatementUpload - API): Failed rows details: {failed_row_details}")
    
    return schemas.StatementUploadResponse(
        created_transactions_auto=created_transactions_auto,
        failed_rows=failed_rows,
        skipped_duplicates_count=skipped_duplicates_count,
        failed_row_details=failed_row_details
    )