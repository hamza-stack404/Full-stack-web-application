---

description: "Phase III AI Chatbot Implementation Tasks"
---

# Tasks: AI Chatbot for Todo Management

**Input**: Design documents from `specs/002-ai-chatbot/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/openapi.yml

**Organization**: Tasks are grouped by implementation phase to enable systematic development and testing.

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which implementation phase this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/app/`
- Paths shown below use monorepo structure from plan.md

---

## Phase 1: Setup & Dependencies

**Purpose**: Install required packages and verify environment

- [ ] T001 [P] [Setup] Install backend dependencies in backend/requirements.txt: openai>=1.10.0, openai-agents>=0.1.0, mcp>=0.1.0
- [ ] T002 [P] [Setup] Install frontend dependencies in frontend/package.json: @openai/chatkit>=0.1.0
- [ ] T003 [P] [Setup] Add OPENAI_API_KEY to backend/.env (manual configuration)
- [ ] T004 [P] [Setup] Verify Phase II backend running: uvicorn src.main:app --reload
- [ ] T005 [P] [Setup] Verify Phase II frontend running: npm run dev

**Checkpoint**: All dependencies installed, Phase II confirmed working

---

## Phase 2: Database Foundation (Blocking Prerequisites)

**Purpose**: Add database models and run migration - MUST complete before any other Phase III work

**⚠️ CRITICAL**: No Phase III features can work until database tables exist

- [ ] T006 [Database] Add Conversation model to backend/src/models.py with fields: id, user_id (FK), created_at, updated_at
- [ ] T007 [Database] Add Message model to backend/src/models.py with fields: id, conversation_id (FK), role, content, created_at (depends on T006)
- [ ] T008 [Database] Create Alembic migration: `cd backend && alembic revision --autogenerate -m "Add conversation and message tables"` (depends on T006, T007)
- [ ] T009 [Database] Run migration: `cd backend && alembic upgrade head` (depends on T008)
- [ ] T010 [Database] Verify tables created: `psql $DATABASE_URL -c "\dt"` should show conversations and messages tables (depends on T009)

**Checkpoint**: Database foundation ready - Phase III features can now be implemented

---

## Phase 3: User Story 1 & 2 - Create & View Tasks via Chat (Priority: P1) 🎯 MVP

**Goal**: Enable users to create and view tasks through natural language chat

**Independent Test**: User can type "Add buy groceries" and "What are my tasks?" and see results in both chat and Phase II UI

### Implementation for US1 & US2

- [ ] T011 [P] [US1,US2] Create backend/src/services/mcp_server.py with MCP tool decorators and imports
- [ ] T012 [P] [US1] Implement add_task MCP tool in backend/src/services/mcp_server.py that wraps existing Phase II create_task function, accepts (user_id, title, description?), returns {task_id, status, title}
- [ ] T013 [P] [US2] Implement list_tasks MCP tool in backend/src/services/mcp_server.py that wraps existing Phase II get_tasks function, accepts (user_id, status?), returns Task[]
- [ ] T014 [US1,US2] Create backend/src/services/agent_service.py with OpenAI agent configuration, system prompt, and run_agent function (depends on T011, T012, T013)
- [ ] T015 [US1,US2] Create backend/src/routes/chat.py with POST /api/chat endpoint: validate JWT, get/create conversation, load history, save user message, run agent, save assistant response, return response (depends on T014)
- [ ] T016 [US1,US2] Register chat router in backend/src/main.py: app.include_router(chat.router) (depends on T015)
- [ ] T017 [P] [US1,US2] Create frontend/lib/chat-api.ts with sendChatMessage function that POSTs to /api/chat with JWT header
- [ ] T018 [P] [US1,US2] Create frontend/components/ChatInterface.tsx using OpenAI ChatKit components
- [ ] T019 [US1,US2] Create frontend/app/chat/page.tsx that renders ChatInterface with authentication (depends on T017, T018)
- [ ] T020 [US1,US2] Add navigation link to chat page in frontend/app/layout.tsx (depends on T019)

**Checkpoint**: Users can create and view tasks via chat, visible in Phase II UI

---

## Phase 4: User Story 3 - Complete Tasks via Chat (Priority: P2)

**Goal**: Enable users to mark tasks complete through natural language

**Independent Test**: User can say "Mark task 3 as complete" and see status change in Phase II UI

### Implementation for US3

- [ ] T021 [US3] Implement complete_task MCP tool in backend/src/services/mcp_server.py that wraps existing Phase II update_task function, accepts (user_id, task_id), returns {task_id, status, title}
- [ ] T022 [US3] Register complete_task tool with agent in backend/src/services/agent_service.py (depends on T021)
- [ ] T023 [US3] Update agent system prompt in backend/src/services/agent_service.py to include complete_task usage guidance (depends on T022)

**Checkpoint**: Users can complete tasks via chat

---

## Phase 5: User Story 4 - Delete Tasks via Chat (Priority: P2)

**Goal**: Enable users to delete tasks through natural language

**Independent Test**: User can say "Delete task 2" and see task removed from Phase II UI

### Implementation for US4

- [ ] T024 [US4] Implement delete_task MCP tool in backend/src/services/mcp_server.py that wraps existing Phase II delete_task function, accepts (user_id, task_id), returns {task_id, status, title}
- [ ] T025 [US4] Register delete_task tool with agent in backend/src/services/agent_service.py (depends on T024)
- [ ] T026 [US4] Update agent system prompt in backend/src/services/agent_service.py to include delete_task usage guidance (depends on T025)

**Checkpoint**: Users can delete tasks via chat

---

## Phase 6: User Story 5 - Update Tasks via Chat (Priority: P3)

**Goal**: Enable users to modify task details through natural language

**Independent Test**: User can say "Change task 1 to 'Call mom tonight'" and see update in Phase II UI

### Implementation for US5

- [ ] T027 [US5] Implement update_task MCP tool in backend/src/services/mcp_server.py that wraps existing Phase II update_task function, accepts (user_id, task_id, title?, description?), returns {task_id, status, title}
- [ ] T028 [US5] Register update_task tool with agent in backend/src/services/agent_service.py (depends on T027)
- [ ] T029 [US5] Update agent system prompt in backend/src/services/agent_service.py to include update_task usage guidance (depends on T028)

**Checkpoint**: Users can update tasks via chat

---

## Phase 7: User Story 6 - Conversation Persistence (Priority: P1)

**Goal**: Ensure chat history persists across page refreshes and server restarts

**Independent Test**: User can refresh page and see previous conversation history

### Implementation for US6

- [ ] T030 [US6] Implement get_conversation_history function in backend/src/routes/chat.py that loads last 50 messages from database
- [ ] T031 [US6] Implement save_message function in backend/src/routes/chat.py that persists messages to database with conversation_id
- [ ] T032 [US6] Update chat endpoint in backend/src/routes/chat.py to load history before running agent (depends on T030)
- [ ] T033 [US6] Update chat endpoint in backend/src/routes/chat.py to save both user and assistant messages (depends on T031)
- [ ] T034 [US6] Add GET /api/conversations endpoint in backend/src/routes/chat.py to list user's conversations
- [ ] T035 [US6] Add GET /api/conversations/{id}/messages endpoint in backend/src/routes/chat.py to retrieve conversation history
- [ ] T036 [US6] Update ChatInterface in frontend/components/ChatInterface.tsx to load conversation history on mount (depends on T034, T035)

**Checkpoint**: Conversation history persists and can be resumed

---

## Phase 8: Error Handling & Edge Cases

**Purpose**: Handle errors gracefully and provide user-friendly messages

- [ ] T037 [P] [Error] Add error handling to all MCP tools in backend/src/services/mcp_server.py: catch exceptions, return {error, code} format
- [ ] T038 [P] [Error] Add timeout handling (5 seconds) to agent service in backend/src/services/agent_service.py
- [ ] T039 [P] [Error] Add error handling to chat endpoint in backend/src/routes/chat.py: handle OpenAI API errors, database errors, validation errors
- [ ] T040 [P] [Error] Add loading and error states to ChatInterface in frontend/components/ChatInterface.tsx
- [ ] T041 [Error] Update agent system prompt in backend/src/services/agent_service.py to translate tool errors into conversational messages

**Checkpoint**: All error scenarios handled gracefully

---

## Phase 9: Testing & Validation

**Purpose**: Verify all features work correctly and Phase II remains unchanged

### Unit Tests

- [ ] T042 [P] [Test] Write unit tests for add_task MCP tool in backend/tests/test_mcp_tools.py (mock Phase II functions)
- [ ] T043 [P] [Test] Write unit tests for list_tasks MCP tool in backend/tests/test_mcp_tools.py
- [ ] T044 [P] [Test] Write unit tests for complete_task MCP tool in backend/tests/test_mcp_tools.py
- [ ] T045 [P] [Test] Write unit tests for delete_task MCP tool in backend/tests/test_mcp_tools.py
- [ ] T046 [P] [Test] Write unit tests for update_task MCP tool in backend/tests/test_mcp_tools.py
- [ ] T047 [P] [Test] Write unit tests for agent service in backend/tests/test_agent_service.py (mock OpenAI API)

### Integration Tests

- [ ] T048 [Test] Write integration test for chat endpoint in backend/tests/test_chat_endpoint.py: test full flow with real database
- [ ] T049 [Test] Write integration test for conversation persistence in backend/tests/test_chat_endpoint.py: verify messages saved and loaded
- [ ] T050 [Test] Write integration test for user isolation in backend/tests/test_chat_endpoint.py: verify users cannot access other users' conversations

### End-to-End Tests

- [ ] T051 [Test] E2E test: Create task via chat, verify appears in Phase II UI at /tasks
- [ ] T052 [Test] E2E test: View tasks via chat, verify matches Phase II UI task list
- [ ] T053 [Test] E2E test: Complete task via chat, verify status changes in Phase II UI
- [ ] T054 [Test] E2E test: Delete task via chat, verify removed from Phase II UI
- [ ] T055 [Test] E2E test: Update task via chat, verify changes in Phase II UI
- [ ] T056 [Test] E2E test: Refresh page, verify conversation history persists
- [ ] T057 [Test] Verify Phase II endpoints unchanged: run existing Phase II tests, all should pass

### Performance Tests

- [ ] T058 [Test] Performance test: Measure chat response time with 10 concurrent users, verify <3 seconds
- [ ] T059 [Test] Performance test: Load test with 100 concurrent users, verify no degradation
- [ ] T060 [Test] Performance test: Measure database query time for conversation history, verify <100ms

**Checkpoint**: All tests passing, Phase II unchanged

---

## Phase 10: Deployment & Documentation

**Purpose**: Deploy Phase III and update documentation

- [ ] T061 [Deploy] Update backend/.env with OPENAI_API_KEY (manual configuration)
- [ ] T062 [Deploy] Run database migration on production: `alembic upgrade head`
- [ ] T063 [Deploy] Deploy backend with new chat endpoints
- [ ] T064 [Deploy] Deploy frontend with chat page
- [ ] T065 [Deploy] Configure OpenAI domain allowlist: add production domain to OpenAI platform
- [ ] T066 [Deploy] Set NEXT_PUBLIC_OPENAI_DOMAIN_KEY in frontend environment
- [ ] T067 [P] [Docs] Update README.md with Phase III features and setup instructions
- [ ] T068 [P] [Docs] Create API documentation for chat endpoints in docs/api.md
- [ ] T069 [Deploy] Smoke test: Verify chat works in production, create task visible in Phase II UI

**Checkpoint**: Phase III deployed and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Database Foundation (Phase 2)**: Depends on Setup - BLOCKS all Phase III features
- **User Stories (Phases 3-7)**: All depend on Database Foundation completion
  - US1 & US2 (Phase 3): Can start after Database Foundation - No dependencies on other stories
  - US3 (Phase 4): Can start after Phase 3 (needs MCP server and agent infrastructure)
  - US4 (Phase 5): Can start after Phase 3 (needs MCP server and agent infrastructure)
  - US5 (Phase 6): Can start after Phase 3 (needs MCP server and agent infrastructure)
  - US6 (Phase 7): Can start after Phase 3 (needs chat endpoint infrastructure)
- **Error Handling (Phase 8)**: Depends on Phases 3-7 completion
- **Testing (Phase 9)**: Depends on all implementation phases
- **Deployment (Phase 10)**: Depends on all testing passing

### Critical Path

1. Setup (T001-T005)
2. Database Foundation (T006-T010) ← BLOCKING
3. US1 & US2 Core Implementation (T011-T020) ← MVP
4. US3-US5 Additional Tools (T021-T029)
5. US6 Persistence (T030-T036)
6. Error Handling (T037-T041)
7. Testing (T042-T060)
8. Deployment (T061-T069)

### Parallel Opportunities

- **Setup Phase**: All 5 tasks can run in parallel
- **Database Phase**: T006 and T007 can run in parallel (both add models)
- **US1 & US2 Implementation**: T011, T012, T013 (MCP tools) can run in parallel; T017, T018 (frontend) can run in parallel
- **US3-US5**: Each user story's MCP tool implementation can run in parallel
- **Unit Tests**: All unit tests (T042-T047) can run in parallel
- **Documentation**: T067, T068 can run in parallel

---

## Implementation Strategy

### MVP First (US1 & US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Database Foundation (CRITICAL - blocks all features)
3. Complete Phase 3: US1 & US2 (Create and View tasks via chat)
4. **STOP and VALIDATE**: Test chat creates task visible in Phase II UI
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Database Foundation → Foundation ready
2. Add US1 & US2 → Test independently → Deploy/Demo (MVP!)
3. Add US3 (Complete) → Test independently → Deploy/Demo
4. Add US4 (Delete) → Test independently → Deploy/Demo
5. Add US5 (Update) → Test independently → Deploy/Demo
6. Add US6 (Persistence) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Database Foundation together
2. Once Database Foundation is done:
   - Developer A: US1 & US2 (Create/View) - Core MVP
   - Developer B: US3 & US4 (Complete/Delete) - Additional operations
   - Developer C: US5 & US6 (Update/Persistence) - Advanced features
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Phase] label maps task to implementation phase for traceability
- Each user story should be independently completable and testable
- Database Foundation (Phase 2) is BLOCKING - nothing else can proceed until complete
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Database Foundation)**: 5 tasks ← BLOCKING
- **Phase 3 (US1 & US2 - MVP)**: 10 tasks
- **Phase 4 (US3)**: 3 tasks
- **Phase 5 (US4)**: 3 tasks
- **Phase 6 (US5)**: 3 tasks
- **Phase 7 (US6)**: 7 tasks
- **Phase 8 (Error Handling)**: 5 tasks
- **Phase 9 (Testing)**: 19 tasks
- **Phase 10 (Deployment)**: 9 tasks

**Total**: 69 tasks

**Critical Path**: Setup → Database Foundation → US1 & US2 MVP → Additional Features → Testing → Deployment

**Estimated Effort**:
- MVP (Phases 1-3): ~20 tasks
- Full Feature Set (Phases 1-7): ~41 tasks
- Production Ready (All Phases): 69 tasks
