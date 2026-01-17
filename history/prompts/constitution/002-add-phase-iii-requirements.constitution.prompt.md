---
id: 002
title: Add Phase III Requirements
stage: constitution
date: 2026-01-13
surface: agent
model: claude-sonnet-4-5
feature: none
branch: main
user: unspecified
command: /sp.constitution
labels: ["constitution", "phase-iii", "ai-chatbot", "mcp"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
- .specify/memory/constitution.md
- .specify/templates/plan-template.md
tests:
- none
---

## Prompt

/sp.constitution

Update the existing constitution to add Phase III requirements.

Append these sections to the existing constitution (keep all Phase II content):

---ADD TO CONSTITUTION---

## Phase III: AI Chatbot Extension

### AI Architecture Principles
- **Stateless Backend**: Server holds NO conversation state in memory
- **MCP-Native**: Task operations exposed as standardized MCP tools
- **AI-Orchestrated**: OpenAI Agents SDK handles tool invocation
- **Conversation Persistence**: All chat history in database

### Phase III Tech Stack Additions
- **AI Framework**: OpenAI Agents SDK
- **MCP Server**: Official MCP Python SDK
- **Chat UI**: OpenAI ChatKit
- **New Models**: Conversation, Message

### MCP Tool Standards
- Every tool receives user_id parameter
- All tools return structured JSON
- Tools reuse existing Phase II task logic
- Stateless tool execution

### AI Agent Behavior
- Conversational and friendly responses
- Always confirm task operations
- Handle errors gracefully
- Use conversation history for context

### Phase III Non-Negotiables
1. ❌ NEVER store conversation state in memory
2. ❌ NEVER skip user_id validation in MCP tools
3. ❌ ALL chat endpoints require JWT authentication
4. ✅ MUST maintain Phase II backward compatibility
5. ✅ MCP tools MUST wrap existing Phase II functions

---END ADDITIONS---

## Response snapshot

I have successfully updated the project constitution to version 1.1.0 with Phase III requirements.

**Changes Made:**
1. **Constitution File** (.specify/memory/constitution.md):
   - Filled all template placeholders with concrete Phase II content
   - Added complete Phase III: AI Chatbot Extension section
   - Included AI Architecture Principles, Tech Stack Additions, MCP Tool Standards, AI Agent Behavior, and Phase III Non-Negotiables
   - Added comprehensive governance section with amendment process and versioning policy
   - Version bumped from 1.0.0 → 1.1.0 (MINOR bump - additive changes)

2. **Plan Template** (.specify/templates/plan-template.md):
   - Updated Constitution Check section with detailed Phase II checks
   - Added Phase III checks section for AI Chatbot Extension features
   - Includes 10 Phase III compliance checkboxes

3. **Template Reviews**:
   - Spec template: No changes needed (Phase III is additive)
   - Tasks template: No changes needed (Phase III is additive)
   - Command files: None found in .specify/templates/commands/

**Sync Impact Report** (embedded in constitution file):
- Version Change: 1.0.0 → 1.1.0
- Bump Rationale: MINOR - Added Phase III sections without breaking Phase II principles
- Modified Principles: None (Phase II principles preserved)
- Added Sections: Phase III: AI Chatbot Extension
- Removed Sections: None
- All dependent templates reviewed and updated as needed

## Outcome

- ✅ Impact: High. Constitution now covers both Phase II (full-stack web app) and Phase III (AI chatbot extension) with clear principles and non-negotiables.
- 🧪 Tests: n/a (documentation update)
- 📁 Files: 2 files updated (.specify/memory/constitution.md, .specify/templates/plan-template.md)
- 🔁 Next prompts: /sp.specify (for Phase III feature specification) or /sp.plan (for Phase III implementation planning)
- 🧠 Reflection: The constitution update maintains backward compatibility while establishing clear guardrails for Phase III AI integration. The stateless architecture principle is consistently enforced across both phases. MCP tool standards ensure proper user isolation and security.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual validation - PASS (all placeholders filled, version incremented correctly, templates updated)
- Prompt variant (if applicable): Standard constitution update workflow
- Next experiment (smallest change to try): Consider adding specific MCP tool naming conventions or error handling standards in future iterations
