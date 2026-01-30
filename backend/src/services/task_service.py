from sqlmodel import Session, select
from .. import models, schemas
from datetime import datetime, timedelta, UTC

def get_task(db: Session, task_id: int):
    statement = select(models.Task).where(models.Task.id == task_id)
    return db.exec(statement).first()

def create_task(db: Session, task: schemas.TaskCreate, owner_id: int):
    db_task = models.Task(**task.model_dump(), owner_id=owner_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_tasks(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    statement = select(models.Task).where(models.Task.owner_id == owner_id).offset(skip).limit(limit)
    return db.exec(statement).all()

def calculate_next_due_date(current_due_date, pattern: str, interval: int):
    """Calculate the next due date for a recurring task"""
    if not current_due_date:
        current_due_date = datetime.now(UTC)

    if pattern == 'daily':
        return current_due_date + timedelta(days=interval)
    elif pattern == 'weekly':
        return current_due_date + timedelta(weeks=interval)
    elif pattern == 'monthly':
        # Approximate month as 30 days for simplicity
        return current_due_date + timedelta(days=30 * interval)
    else:
        return current_due_date

def update_task(db: Session, db_task: models.Task, task_in: schemas.TaskUpdate):
    task_data = task_in.model_dump(exclude_unset=True)

    # Check if task is being marked as completed and is recurring
    was_incomplete = not db_task.is_completed
    will_be_complete = task_data.get('is_completed', db_task.is_completed)

    if was_incomplete and will_be_complete and db_task.is_recurring and db_task.recurrence_pattern:
        # Create next recurring instance
        next_due_date = calculate_next_due_date(
            db_task.due_date,
            db_task.recurrence_pattern,
            db_task.recurrence_interval or 1
        )

        # Create new task with same properties but not completed
        new_task = models.Task(
            title=db_task.title,
            is_completed=False,
            priority=db_task.priority,
            category=db_task.category,
            tags=db_task.tags,
            due_date=next_due_date,
            subtasks=db_task.subtasks,
            is_recurring=True,
            recurrence_pattern=db_task.recurrence_pattern,
            recurrence_interval=db_task.recurrence_interval,
            owner_id=db_task.owner_id
        )
        db.add(new_task)

    # Update current task
    for key, value in task_data.items():
        setattr(db_task, key, value)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, db_task: models.Task):
    db.delete(db_task)
    db.commit()
    return db_task
