from sqlmodel import Session, select
from .. import models, schemas

def get_task(db: Session, task_id: int):
    statement = select(models.Task).where(models.Task.id == task_id)
    return db.exec(statement).first()

def create_task(db: Session, task: schemas.TaskCreate, owner_id: int):
    db_task = models.Task(**task.dict(), owner_id=owner_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_tasks(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    statement = select(models.Task).where(models.Task.owner_id == owner_id).offset(skip).limit(limit)
    return db.exec(statement).all()

def update_task(db: Session, db_task: models.Task, task_in: schemas.TaskUpdate):
    task_data = task_in.dict(exclude_unset=True)
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
