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

# Configure Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# System prompt for the AI agent
SYSTEM_PROMPT = """You are a helpful task management assistant. You help users manage their todo tasks through natural conversation.

You have access to the following tools:
- add_task: Create a new task with title, optional description, priority, category, and due date
- list_tasks: List all tasks or filter by status (completed/pending)
- complete_task: Mark a task as completed
- delete_task: Delete a task
- update_task: Update task details like title, priority, or category

Guidelines:
1. Be conversational and friendly
2. When users ask to create tasks, extract the task title and any additional details
3. When users ask about their tasks, use list_tasks to show them
4. When users want to complete/delete/update tasks, confirm the task ID first
5. Always provide clear feedback about what action was taken
6. If a tool returns an error, explain it in a user-friendly way
7. Keep responses concise and actionable

Examples:
- User: "Add buy groceries" → Use add_task with title="buy groceries"
- User: "What are my tasks?" → Use list_tasks to show all tasks
- User: "Mark task 3 as done" → Use complete_task with task_id=3
- User: "Delete task 5" → Use delete_task with task_id=5
- User: "Change task 2 to 'Call mom tonight'" → Use update_task with task_id=2, title="Call mom tonight"
"""


def run_agent(user_id: int, message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Run the AI agent to process user message and execute task operations.

    Args:
        user_id: ID of the authenticated user
        message: User's message
        conversation_history: Optional list of previous messages [{"role": "user"|"assistant", "content": "..."}]

    Returns:
        Assistant's response as a string
    """
    try:
        # Define tool functions that will be called by Gemini
        def add_task_impl(title: str, description: str = "", priority: str = "medium", category: str = "") -> dict:
            """Implementation of add_task tool"""
            return MCPTools.add_task(user_id=user_id, title=title, description=description or None,
                                    priority=priority, category=category or None)

        def list_tasks_impl(status: str = "", limit: int = 100) -> dict:
            """Implementation of list_tasks tool"""
            return MCPTools.list_tasks(user_id=user_id, status=status or None, limit=limit)

        def complete_task_impl(task_id: int) -> dict:
            """Implementation of complete_task tool"""
            return MCPTools.complete_task(user_id=user_id, task_id=task_id)

        def delete_task_impl(task_id: int) -> dict:
            """Implementation of delete_task tool"""
            return MCPTools.delete_task(user_id=user_id, task_id=task_id)

        def update_task_impl(task_id: int, title: str = "", priority: str = "", category: str = "") -> dict:
            """Implementation of update_task tool"""
            return MCPTools.update_task(user_id=user_id, task_id=task_id,
                                       title=title or None, priority=priority or None,
                                       category=category or None)

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

        # Generate response with automatic function calling
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=False
                )
            )
        )

        # Process function calls if any
        while response.candidates[0].content.parts:
            part = response.candidates[0].content.parts[0]

            # Check if this is a function call
            if hasattr(part, 'function_call') and part.function_call:
                func_call = part.function_call
                func_name = func_call.name
                func_args = dict(func_call.args) if func_call.args else {}

                # Execute the function
                if func_name in tool_functions:
                    result = tool_functions[func_name](**func_args)

                    # Add function response to conversation
                    contents.append(response.candidates[0].content)
                    contents.append(types.Content(
                        role="function",
                        parts=[types.Part(
                            function_response=types.FunctionResponse(
                                name=func_name,
                                response={"result": result}
                            )
                        )]
                    ))

                    # Generate next response
                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            tools=tools
                        )
                    )
                else:
                    logger.error(f"Unknown function called: {func_name}")
                    break
            else:
                # No more function calls, extract text response
                break

        # Extract final text response
        if response.text:
            return response.text
        else:
            return "I processed your request successfully!"

    except Exception as e:
        logger.error(f"Error running agent: {str(e)}", exc_info=True)
        return f"I'm sorry, I encountered an error: {str(e)}. Please try again."
