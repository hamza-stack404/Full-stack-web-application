# Tasks: Todo Application MVP

**Input**: Design documents from `specs/001-todo-app-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create backend directory structure: `backend/src/models`, `backend/src/services`, `backend/src/api`, `backend/tests`
- [X] T002 Create frontend directory structure: `frontend/src/components`, `frontend/src/pages`, `frontend/src/services`, `frontend/tests`
- [X] T003 [P] Initialize backend FastAPI project in `backend/`
- [X] T004 [P] Initialize frontend Next.js project in `frontend/`
- [X] T005 [P] Configure backend dependencies: `fastapi`, `uvicorn`, `sqlmodel`, `psycopg2-binary`, `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart`
- [X] T006 [P] Configure frontend dependencies: `tailwindcss`, `axios`
- [X] T007 [P] Create `.env` file in `backend/` and `frontend/` with `BETTER_AUTH_SECRET` and `DATABASE_URL`

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T008 Setup database connection in `backend/src/database.py`
- [X] T009 Implement JWT authentication middleware in `backend/src/auth.py`
- [X] T010 Configure API router in `backend/src/main.py`

## Phase 3: User Story 1 - User Authentication (Priority: P1)

**Goal**: Allow users to sign up and log in.
**Independent Test**: A user can create an account and then log in to receive a JWT.

### Implementation for User Story 1

- [X] T011 [US1] Create User model in `backend/src/models/user.py`
- [X] T012 [US1] Create User schemas (UserCreate, User) in `backend/src/schemas.py`
- [X] T013 [US1] Implement user service for creating users in `backend/src/services/user_service.py`
- [X] T014 [US1] Implement signup endpoint in `backend/src/api/auth.py`
- [X] T015 [US1] Implement login endpoint in `backend/src/api/auth.py`
- [X] T016 [P] [US1] Create Signup page in `frontend/src/pages/signup.tsx`
- [X] T017 [P] [US1] Create Login page in `frontend/src/pages/login.tsx`
- [X] T018 [US1] Implement auth service for signup and login in `frontend/src/services/auth_service.ts`

## Phase 4: User Story 2 - Task Management (Priority: P1)

**Goal**: Allow authenticated users to manage their tasks.
**Independent Test**: A logged-in user can create, view, update, and delete their own tasks.

### Implementation for User Story 2

- [X] T019 [US2] Create Task model in `backend/src/models/task.py`
- [X] T020 [US2] Create Task schemas (TaskCreate, TaskUpdate, Task) in `backend/src/schemas.py`
- [X] T021 [US2] Implement task service for CRUD operations in `backend/src/services/task_service.py`
- [X] T022 [US2] Implement create task endpoint in `backend/src/api/tasks.py`
- [X] T023 [US2] Implement get tasks endpoint in `backend/src/api/tasks.py`
- [X] T024 [US2] Implement update task endpoint in `backend/src/api/tasks.py`
- [X] T025 [US2] Implement delete task endpoint in `backend/src/api/tasks.py`
- [X] T026 [P] [US2] Create Task component in `frontend/src/components/Task.tsx`
- [X] T027 [P] [US2] Create TaskList component in `frontend/src/components/TaskList.tsx`
- [X] T028 [P] [US2] Create AddTaskForm component in `frontend/src/components/AddTaskForm.tsx`
- [X] T029 [US2] Create main tasks page in `frontend/src/pages/tasks.tsx`
- [X] T030 [US2] Implement task service for CRUD operations in `frontend/src/services/task_service.ts`

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T031 [P] Add basic styling with Tailwind CSS to all frontend components.
- [X] T032 [P] Implement global error handling in the frontend.
- [X] T033 [P] Implement global error handling in the backend.

## Dependencies & Execution Order

- **Phase 1** must be completed before **Phase 2**.
- **Phase 2** must be completed before **Phase 3 and 4**.
- **Phase 3 and 4** can be worked on in parallel after Phase 2 is complete.
- **Phase 5** can be worked on after Phase 3 and 4 are complete.
