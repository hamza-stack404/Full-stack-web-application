# Data Model: Todo Application MVP

## Entities

### User
Represents a user of the application. This table will be managed by the Better Auth library.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | integer | PRIMARY KEY | Unique identifier for the user. |
| email | string | UNIQUE, NOT NULL | User's email address. |
| hashed_password | string | NOT NULL | Hashed password for the user. |

### Task
Represents a single to-do item.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | integer | PRIMARY KEY | Unique identifier for the task. |
| title | string | NOT NULL | The content of the task. |
| is_completed | boolean | NOT NULL, DEFAULT false | Whether the task is completed. |
| owner_id | integer | FOREIGN KEY (User.id), NOT NULL | The ID of the user who owns the task. |

## Relationships
- A **User** can have many **Tasks**.
- A **Task** belongs to one **User**.
