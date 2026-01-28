from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from typing import List
from .. import schemas, services, models
from ..database import get_db
from ..auth import get_current_user
from ..sanitization import sanitize_task_title, sanitize_plain_text
import math

router = APIRouter()

@router.post("/tasks", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    # Sanitize task fields before storage
    sanitized_task = task.model_copy()
    sanitized_task.title = sanitize_task_title(task.title)

    if task.category:
        sanitized_task.category = sanitize_plain_text(task.category, max_length=100)

    if task.tags:
        sanitized_task.tags = [sanitize_plain_text(tag, max_length=50) for tag in task.tags]

    if task.subtasks:
        for subtask in sanitized_task.subtasks:
            subtask.title = sanitize_plain_text(subtask.title, max_length=500)

    return services.task_service.create_task(db=db, task=sanitized_task, owner_id=current_user.id)

@router.get("/tasks")
def read_tasks(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    is_completed: bool = Query(None, description="Filter by completion status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get tasks with pagination metadata"""
    # Build query
    query = select(models.Task).where(models.Task.owner_id == current_user.id)

    # Apply filters
    if is_completed is not None:
        query = query.where(models.Task.is_completed == is_completed)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = db.exec(count_query).one()

    # Get paginated items
    query = query.offset(skip).limit(limit).order_by(models.Task.created_at.desc())
    tasks = db.exec(query).all()

    # Calculate pagination metadata
    page = (skip // limit) + 1
    total_pages = math.ceil(total / limit) if total > 0 else 1

    return {
        "items": tasks,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": limit,
            "total_pages": total_pages,
            "has_next": skip + limit < total,
            "has_prev": skip > 0
        }
    }

@router.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task_for_user(
    task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    db_task = services.task_service.get_task(db, task_id=task_id)
    if not db_task or db_task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    # Sanitize task fields before update
    sanitized_task = task.model_copy()
    if task.title is not None:
        sanitized_task.title = sanitize_task_title(task.title)

    if task.category is not None:
        sanitized_task.category = sanitize_plain_text(task.category, max_length=100)

    if task.tags is not None:
        sanitized_task.tags = [sanitize_plain_text(tag, max_length=50) for tag in task.tags]

    if task.subtasks is not None:
        for subtask in sanitized_task.subtasks:
            subtask.title = sanitize_plain_text(subtask.title, max_length=500)

    return services.task_service.update_task(db=db, db_task=db_task, task_in=sanitized_task)

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_for_user(
    task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    db_task = services.task_service.get_task(db, task_id=task_id)
    if not db_task or db_task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    services.task_service.delete_task(db=db, db_task=db_task)
    return {"ok": True}
