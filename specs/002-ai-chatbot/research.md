# Research: AI Chatbot for Todo Management

**Feature**: 002-ai-chatbot
**Date**: 2026-01-13
**Purpose**: Research technical decisions for Phase III AI chatbot integration

## Research Questions

### 1. MCP Server Integration Approach

**Question**: How should we integrate MCP (Model Context Protocol) server with the existing FastAPI backend?

**Options Considered**:

1. **Embedded MCP Server** (CHOSEN)
   - Run MCP server as part of the FastAPI application
   - Tools defined as Python functions within the backend
   - Direct access to existing Phase II task logic

2. **Standalone MCP Server**
   - Separate process communicating via HTTP/WebSocket
   - Requires inter-process communication
   - More complex deployment

3. **MCP SDK as Library**
   - Use MCP Python SDK as a library
   - Register tools programmatically
   - Integrate with OpenAI Agents SDK

**Decision**: Use MCP Python SDK as an embedded library within FastAPI

**Rationale**:
- Simplifies deployment (single process)
- Direct access to existing Phase II functions
- No network overhead between MCP and task logic
- Easier to maintain user_id validation
- Aligns with stateless architecture (no separate state management)

**Implementation Notes**:
- Install `mcp` Python package
- Define tools as decorated Python functions
- Tools will wrap existing Phase II CRUD operations
- Each tool receives user_id as first parameter

---

### 2. OpenAI Agent Integration

**Question**: Which OpenAI SDK and approach should we use for the AI agent?

**Options Considered**:

1. **OpenAI Agents SDK** (CHOSEN)
   - Official SDK for building agents with tool calling
   - Native MCP tool integration
   - Handles conversation context automatically

2. **Direct OpenAI API**
   - Lower-level control
   - Manual tool calling implementation
   - More boilerplate code

3. **LangChain**
   - Higher-level abstractions
   - Additional dependency
   - Overkill for our use case

**Decision**: Use OpenAI Agents SDK (openai-agents package)

**Rationale**:
- Native support for MCP tools
- Handles tool calling orchestration
- Manages conversation context
- Official OpenAI solution
- Simpler than direct API calls

**Implementation Notes**:
- Install `openai-agents` package
- Configure with OpenAI API key from environment
- System prompt: "You are a helpful todo assistant. Help users manage their tasks using the available tools. Be conversational and confirm actions."
- Model: GPT-4 Turbo (gpt-4-turbo-preview) for better tool calling

---

### 3. Conversation Storage Strategy

**Question**: How should we store and retrieve conversation history?

**Options Considered**:

1. **Database-Backed with On-Demand Loading** (CHOSEN)
   - Store all messages in PostgreSQL
   - Load conversation history on each request
   - No server-side state

2. **In-Memory Cache with DB Persistence**
   - Cache recent conversations in Redis
   - Fall back to database
   - Requires Redis deployment

3. **Session-Based Storage**
   - Store in server sessions
   - Violates stateless architecture
   - Not scalable

**Decision**: Database-backed with on-demand loading

**Rationale**:
- Maintains stateless architecture (Phase III requirement)
- No additional infrastructure (Redis)
- Simple to implement and debug
- Conversation history is durable
- Scales horizontally

**Implementation Notes**:
- Add Conversation and Message models to SQLModel
- Index on user_id and conversation_id for fast queries
- Load last N messages (e.g., 50) to limit context size
- Pagination for older messages if needed

---

### 4. Frontend Chat UI Approach

**Question**: Which chat UI library should we use for the Next.js frontend?

**Options Considered**:

1. **OpenAI ChatKit** (CHOSEN)
   - Official OpenAI React components
   - Pre-built chat interface
   - Handles message rendering, input, streaming

2. **Custom React Components**
   - Full control over UI
   - More development time
   - Need to handle edge cases

3. **Third-Party Chat Libraries** (react-chat-elements, etc.)
   - Generic chat components
   - Not optimized for AI interactions
   - May need customization

**Decision**: Use OpenAI ChatKit

**Rationale**:
- Official OpenAI solution
- Designed for AI chat interfaces
- Handles streaming responses
- Consistent with OpenAI ecosystem
- Reduces development time

**Implementation Notes**:
- Install `@openai/chatkit` package
- Create new `/chat` page in Next.js app directory
- Configure with chat API endpoint
- Reuse Phase II authentication (JWT in headers)

---

### 5. Authentication Flow

**Question**: How should chat requests be authenticated?

**Options Considered**:

1. **Reuse Phase II JWT Tokens** (CHOSEN)
   - Same authentication mechanism
   - No new auth infrastructure
   - Consistent user experience

2. **Separate Chat Authentication**
   - Different token system
   - Adds complexity
   - Inconsistent with Phase II

**Decision**: Reuse Phase II JWT tokens

**Rationale**:
- Backward compatibility requirement
- Single authentication system
- Users already authenticated
- Simpler implementation

**Implementation Notes**:
- Chat endpoint uses same JWT validation as Phase II
- Extract user_id from JWT claims
- Pass user_id to all MCP tools
- Return 401 for invalid/expired tokens

---

### 6. MCP Tool Design Pattern

**Question**: How should MCP tools be structured to ensure user isolation?

**Options Considered**:

1. **User ID as First Parameter** (CHOSEN)
   - Every tool receives user_id explicitly
   - Validation at tool boundary
   - Clear security contract

2. **Context-Based User ID**
   - Extract user_id from request context
   - Implicit passing
   - Risk of missing validation

**Decision**: User ID as first parameter for all tools

**Rationale**:
- Explicit is better than implicit (Python principle)
- Enforces user isolation at tool level
- Easy to audit and test
- Aligns with Phase III constitution

**Implementation Notes**:
- Tool signature: `def add_task(user_id: str, title: str, description: str | None = None)`
- Validate user_id exists before any database operation
- Return structured JSON: `{"task_id": int, "status": str, "title": str}`
- Tools wrap existing Phase II functions

---

### 7. Error Handling Strategy

**Question**: How should errors be handled in the chat flow?

**Options Considered**:

1. **AI-Translated Error Messages** (CHOSEN)
   - Tool returns error in structured format
   - AI translates to conversational message
   - User-friendly experience

2. **Direct Error Messages**
   - Return raw error messages
   - Less friendly
   - Breaks conversational flow

**Decision**: AI-translated error messages

**Rationale**:
- Maintains conversational tone
- AI can provide helpful suggestions
- Better user experience
- Aligns with "conversational and friendly" requirement

**Implementation Notes**:
- Tools return errors as: `{"error": str, "code": str}`
- AI system prompt includes error handling guidance
- Examples: "Task not found" → "I couldn't find that task. Could you check the task ID or name?"

---

### 8. Performance Optimization

**Question**: How can we meet the <3 second response time requirement?

**Strategies Identified**:

1. **Async I/O**
   - Use async/await for all database operations
   - Non-blocking OpenAI API calls
   - FastAPI native async support

2. **Database Indexing**
   - Index on user_id, conversation_id, created_at
   - Fast conversation history retrieval
   - Efficient task lookups

3. **Conversation History Limits**
   - Load only last 50 messages
   - Prevents large context windows
   - Reduces OpenAI API latency

4. **Connection Pooling**
   - Reuse database connections
   - Already configured in Phase II

**Implementation Notes**:
- All endpoints use `async def`
- Database queries use SQLModel async session
- Monitor OpenAI API response times
- Add timeout handling (5 second timeout)

---

## Technology Stack Summary

### Backend Additions
- **MCP Server**: `mcp` Python SDK (embedded)
- **AI Agent**: `openai-agents` package
- **OpenAI Client**: `openai` Python SDK (latest)
- **Models**: SQLModel (existing) + Conversation/Message models

### Frontend Additions
- **Chat UI**: `@openai/chatkit` React components
- **API Client**: Fetch API with JWT headers (existing pattern)

### Database Additions
- **Tables**: conversations, messages
- **Indexes**: user_id, conversation_id, created_at

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API key for agent
- `OPENAI_MODEL`: Model name (default: gpt-4-turbo-preview)

---

## Architecture Decisions

### Decision 1: Stateless Chat Architecture

**Context**: Phase III constitution requires stateless backend

**Decision**: Store all conversation state in database, load on-demand

**Consequences**:
- ✅ Horizontally scalable
- ✅ No session management complexity
- ✅ Conversation survives server restarts
- ⚠️ Database query on every request (mitigated by indexing)

---

### Decision 2: MCP Tools Wrap Phase II Logic

**Context**: Phase III constitution requires backward compatibility

**Decision**: MCP tools call existing Phase II task CRUD functions

**Consequences**:
- ✅ No code duplication
- ✅ Consistent behavior between REST and chat
- ✅ Single source of truth for task operations
- ✅ Easier to maintain

---

### Decision 3: Single Chat Endpoint

**Context**: Need to handle all chat interactions

**Decision**: Single POST /api/chat endpoint handles all messages

**Consequences**:
- ✅ Simple API surface
- ✅ Easy to secure (one auth point)
- ✅ Conversation context managed by agent
- ⚠️ Endpoint does more work (mitigated by async)

---

## Best Practices Applied

1. **User Isolation**: Every MCP tool validates user_id
2. **Stateless Design**: No server memory for conversations
3. **Backward Compatibility**: Phase II unchanged
4. **Error Handling**: Graceful degradation with user-friendly messages
5. **Performance**: Async I/O, indexing, connection pooling
6. **Security**: JWT authentication, user_id validation
7. **Observability**: Structured logging for debugging

---

## Dependencies to Add

### Backend (requirements.txt)
```
openai>=1.10.0
openai-agents>=0.1.0
mcp>=0.1.0
```

### Frontend (package.json)
```json
{
  "@openai/chatkit": "^0.1.0"
}
```

---

## Risks and Mitigations

### Risk 1: OpenAI API Latency
- **Impact**: May exceed 3 second target
- **Mitigation**: Use GPT-4 Turbo (faster), limit conversation history, implement timeout

### Risk 2: OpenAI API Costs
- **Impact**: Each chat request costs money
- **Mitigation**: Monitor usage, implement rate limiting, use efficient prompts

### Risk 3: Tool Calling Errors
- **Impact**: AI may call tools incorrectly
- **Mitigation**: Clear tool descriptions, validation in tools, error handling

### Risk 4: Conversation Context Growth
- **Impact**: Large conversations slow down responses
- **Mitigation**: Limit to last 50 messages, implement conversation archiving

---

## Next Steps

1. Create data-model.md with Conversation/Message schemas
2. Create API contracts in contracts/
3. Create quickstart.md for development setup
4. Proceed to /sp.tasks for implementation breakdown
