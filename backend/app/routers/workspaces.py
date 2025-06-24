from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_workspace_for_user

router = APIRouter(tags=["workspaces"], dependencies=[Depends(get_current_active_user)])

@router.get("/", response_model=List[schemas.Workspace])
def read_workspaces(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.workspace.get_multi_by_owner(db, owner_id=current_user.id)

@router.post("/", response_model=schemas.Workspace)
def create_workspace(workspace_in: schemas.WorkspaceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.workspace.create_with_owner(db=db, obj_in=workspace_in, owner_id=current_user.id)

@router.get("/{workspace_id}", response_model=schemas.Workspace)
def read_workspace(*, workspace: models.Workspace = Depends(get_workspace_for_user)):
    return workspace

@router.put("/{workspace_id}", response_model=schemas.Workspace)
def update_workspace(*, db: Session = Depends(get_db), workspace_in: schemas.WorkspaceUpdate, workspace: models.Workspace = Depends(get_workspace_for_user)):
    return crud.workspace.update(db=db, db_obj=workspace, obj_in=workspace_in)

@router.delete("/{workspace_id}", response_model=schemas.Workspace)
def delete_workspace(*, db: Session = Depends(get_db), workspace: models.Workspace = Depends(get_workspace_for_user)):
    return crud.workspace.remove(db=db, id=workspace.id)