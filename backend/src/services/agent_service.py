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
- add_task: Create a new task with title, optional description, priority (low/medium/high), and category
- list_tasks: List all tasks, optionally filtered by status (completed/pending)
- complete_task: Mark a task as completed by its ID
- delete_task: Delete a task by its ID
- update_task: Update task details (title, priority, category) by its ID

Guidelines:
- Be conversational and friendly in your responses
- When users create tasks, confirm what was created
- When listing tasks, format them in a clear, readable way
- If a user references a task by name instead of ID, list their tasks first to find the ID
- Always validate that operations succeeded before confirming to the user
- If an operation fails, explain the error in user-friendly language
- Ask for clarification if the user's request is ambiguous
- Keep responses concise but helpful

Remember: You can only access tasks for the current user. All operations are automatically scoped to their account."""


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
        return f"I'm sorry, I encountered an error while processing your request. Please try again later."
