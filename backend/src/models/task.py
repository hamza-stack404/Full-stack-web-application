from sqlmodel import Field, SQLModel

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    is_completed: bool = False
    owner_id: int | None = Field(default=None, foreign_key="users.id") # Corrected foreign key