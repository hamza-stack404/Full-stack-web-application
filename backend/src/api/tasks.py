from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
from .. import schemas, services, models
from ..database import get_db
from ..auth import get_current_user

router = APIRouter()

@router.post("/tasks", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return services.task_service.create_task(db=db, task=task, owner_id=current_user.id)

@router.get("/tasks", response_model=List[schemas.Task])
def read_tasks(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    tasks = services.task_service.get_tasks(db, owner_id=current_user.id, skip=skip, limit=limit)
    return tasks

@router.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task_for_user(
    task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    db_task = services.task_service.get_task(db, task_id=task_id)
    if not db_task or db_task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return services.task_service.update_task(db=db, db_task=db_task, task_in=task)

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_for_user(
    task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    db_task = services.task_service.get_task(db, task_id=task_id)
    if not db_task or db_task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    services.task_service.delete_task(db=db, db_task=db_task)
    return {"ok": True}
