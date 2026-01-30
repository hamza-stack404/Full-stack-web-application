# Task T014: Gemini Agent Service for Phase III AI Chatbot
# Orchestrates AI agent with MCP tools for task management using Google Gemini
import os
import json
import logging
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from .mcp_server import MCPTools

logger = logging.getLogger(__name__)

# Validate and configure Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable is not set")
    client = None
else:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {type(e).__name__}")
        client = None

# System prompt for the AI agent
SYSTEM_PROMPT = """You are TaskBot, a friendly and helpful AI assistant specialized in task management. Your purpose is to help users organize and manage their todo tasks efficiently through natural conversation.

🎯 YOUR ROLE:
You are a task management expert who helps users stay organized and productive. Always be warm, encouraging, and supportive.

🛠️ YOUR CAPABILITIES:
You have access to these powerful tools:
- add_task: Create new tasks with title, description, priority (low/medium/high), category, and tags
- list_tasks: View all tasks, filtered by status (completed/pending) if needed
- complete_task: Mark tasks as done by their ID
- delete_task: Remove tasks by their ID
- update_task: Modify task details (title, priority, category, tags) by ID

📋 GREETING & GUIDANCE:
When users first interact with you or say "hi/hello":
- Greet them warmly and introduce yourself
- Briefly explain what you can help with
- Give 2-3 examples of what they can ask:
  * "Add a task to buy groceries"
  * "Show me my pending tasks"
  * "Mark task 5 as complete"
  * "Update task 3 to high priority"

🚫 HANDLING OFF-TOPIC QUESTIONS:
If users ask questions unrelated to task management (weather, general knowledge, jokes, etc.):
- Politely acknowledge their question
- Gently remind them you're specialized in task management
- Redirect them back to tasks: "I'm here to help you manage your tasks! Would you like to create a task, view your tasks, or update something?"
- Stay friendly and don't be dismissive

✅ BEST PRACTICES:
- Be conversational and encouraging
- When creating tasks, confirm what was created including tags
- Format task lists clearly with IDs, titles, priorities, and tags
- If users reference tasks by name, list their tasks first to find the ID
- Validate operations succeeded before confirming
- Explain errors in user-friendly language
- Ask for clarification when requests are ambiguous
- Keep responses concise but helpful
- Extract tags from user messages (like #urgent, #work) and suggest using them
- Celebrate completions: "Great job completing that task! 🎉"

💡 PROACTIVE SUGGESTIONS:
- Suggest organizing tasks with tags and categories
- Recommend setting priorities for important tasks
- Encourage users when they complete tasks

Remember: All operations are automatically scoped to the current user's account. You can only see and manage their tasks."""


def run_agent(user_id: int, message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Run the AI agent with the user's message and conversation history.

    Args:
        user_id: ID of the authenticated user
        message: User's message
        conversation_history: Previous messages in the conversation (list of {role, content} dicts)

    Returns:
        Assistant's response as a string
    """
    # Check if Gemini client is initialized
    if client is None:
        logger.error("Gemini client not initialized - API key may be missing or invalid")
        return "I'm sorry, the AI service is not properly configured. Please contact the administrator."

    try:
        # Define tool functions that will be called by Gemini
        def add_task_impl(title: str, description: str = "", priority: str = "medium", category: str = "", tags: list = None) -> dict:
            """Implementation of add_task tool"""
            return MCPTools.add_task(user_id=user_id, title=title, description=description or None,
                                    priority=priority, category=category or None, tags=tags)

        def list_tasks_impl(status: str = "", limit: int = 100) -> dict:
            """Implementation of list_tasks tool"""
            return MCPTools.list_tasks(user_id=user_id, status=status or None, limit=limit)

        def complete_task_impl(task_id: int) -> dict:
            """Implementation of complete_task tool"""
            return MCPTools.complete_task(user_id=user_id, task_id=task_id)

        def delete_task_impl(task_id: int) -> dict:
            """Implementation of delete_task tool"""
            return MCPTools.delete_task(user_id=user_id, task_id=task_id)

        def update_task_impl(task_id: int, title: str = "", priority: str = "", category: str = "", tags: list = None) -> dict:
            """Implementation of update_task tool"""
            return MCPTools.update_task(user_id=user_id, task_id=task_id,
                                       title=title or None, priority=priority or None,
                                       category=category or None, tags=tags)

        # Map function names to implementations
        tool_functions = {
            "add_task": add_task_impl,
            "list_tasks": list_tasks_impl,
            "complete_task": complete_task_impl,
            "delete_task": delete_task_impl,
            "update_task": update_task_impl
        }

        # Define tools for Gemini using the new API
        tools = [
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name="add_task",
                        description="Create a new task for the user",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "title": {
                                    "type": "STRING",
                                    "description": "The task title (required)"
                                },
                                "description": {
                                    "type": "STRING",
                                    "description": "Optional task description"
                                },
                                "priority": {
                                    "type": "STRING",
                                    "description": "Task priority - must be 'low', 'medium', or 'high'",
                                    "enum": ["low", "medium", "high"]
                                },
                                "category": {
                                    "type": "STRING",
                                    "description": "Optional task category"
                                },
                                "tags": {
                                    "type": "ARRAY",
                                    "description": "Optional list of tags for organizing tasks (e.g., ['urgent', 'work', 'personal'])",
                                    "items": {
                                        "type": "STRING"
                                    }
                                }
                            },
                            "required": ["title"]
                        }
                    ),
                    types.FunctionDeclaration(
                        name="list_tasks",
                        description="List all tasks for the user, optionally filtered by status",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "status": {
                                    "type": "STRING",
                                    "description": "Optional filter - 'completed' or 'pending'. Leave empty to show all tasks.",
                                    "enum": ["completed", "pending"]
                                },
                                "limit": {
                                    "type": "INTEGER",
                                    "description": "Maximum number of tasks to return (default: 100)"
                                }
                            }
                        }
                    ),
                    types.FunctionDeclaration(
                        name="complete_task",
                        description="Mark a task as completed",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "task_id": {
                                    "type": "INTEGER",
                                    "description": "The ID of the task to complete"
                                }
                            },
                            "required": ["task_id"]
                        }
                    ),
                    types.FunctionDeclaration(
                        name="delete_task",
                        description="Delete a task",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "task_id": {
                                    "type": "INTEGER",
                                    "description": "The ID of the task to delete"
                                }
                            },
                            "required": ["task_id"]
                        }
                    ),
                    types.FunctionDeclaration(
                        name="update_task",
                        description="Update task details",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "task_id": {
                                    "type": "INTEGER",
                                    "description": "The ID of the task to update (required)"
                                },
                                "title": {
                                    "type": "STRING",
                                    "description": "New task title"
                                },
                                "priority": {
                                    "type": "STRING",
                                    "description": "New task priority - must be 'low', 'medium', or 'high'",
                                    "enum": ["low", "medium", "high"]
                                },
                                "category": {
                                    "type": "STRING",
                                    "description": "New task category"
                                },
                                "tags": {
                                    "type": "ARRAY",
                                    "description": "New list of tags for the task",
                                    "items": {
                                        "type": "STRING"
                                    }
                                }
                            },
                            "required": ["task_id"]
                        }
                    )
                ]
            )
        ]

        # Build conversation history
        contents = []
        if conversation_history:
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

        # Add current user message
        contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

        # Generate response with function calling
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=tools
            )
        )

        # Process function calls if any
        max_iterations = 5  # Prevent infinite loops
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Check if response has function calls
            if not response.candidates or not response.candidates[0].content.parts:
                break

            has_function_call = False
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'function_call') and part.function_call:
                    has_function_call = True
                    func_call = part.function_call
                    func_name = func_call.name
                    func_args = dict(func_call.args) if func_call.args else {}

                    logger.info(f"Agent calling tool: {func_name} with args: {func_args}")

                    # Execute the function
                    if func_name in tool_functions:
                        result = tool_functions[func_name](**func_args)

                        # Add function response to conversation
                        contents.append(response.candidates[0].content)
                        contents.append(types.Content(
                            parts=[types.Part(
                                function_response=types.FunctionResponse(
                                    name=func_name,
                                    response={"result": result}
                                )
                            )]
                        ))

                        # Generate next response
                        response = client.models.generate_content(
                            model="models/gemini-2.5-flash",
                            contents=contents,
                            config=types.GenerateContentConfig(
                                system_instruction=SYSTEM_PROMPT,
                                tools=tools
                            )
                        )
                    else:
                        logger.error(f"Unknown function called: {func_name}")
                        break

            if not has_function_call:
                break

        # Extract final text response
        if response.text:
            return response.text
        else:
            return "I processed your request successfully!"

    except Exception as e:
        logger.error(f"Error running agent: {str(e)}", exc_info=True)

        # Check for quota limit errors (429 RESOURCE_EXHAUSTED)
        error_str = str(e)
        if "429" in error_str and "RESOURCE_EXHAUSTED" in error_str:
            return (
                "⚠️ I've reached my daily API quota limit. "
                "The free tier allows 20 requests per day. "
                "Please try again tomorrow, or contact your administrator to upgrade the API plan. "
                "Learn more at: https://ai.google.dev/gemini-api/docs/rate-limits"
            )

        # Check for authentication errors
        if "403" in error_str and "PERMISSION_DENIED" in error_str:
            if "leaked" in error_str.lower():
                return (
                    "🔒 The API key has been reported as leaked and blocked for security. "
                    "Please contact your administrator to configure a new API key."
                )
            return (
                "🔒 Authentication failed. The API key may be invalid or expired. "
                "Please contact your administrator to check the API configuration."
            )

        # Generic error message for other errors
        return "I'm sorry, I encountered an error while processing your request. Please try again later."
