# Task T014: OpenAI Agent Service for Phase III AI Chatbot
# Orchestrates AI agent with MCP tools for task management
import os
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from .mcp_server import MCPTools

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        # Build messages array with conversation history
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": message})

        # Define tools for OpenAI function calling
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "add_task",
                    "description": "Create a new task for the user",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The task title"
                            },
                            "description": {
                                "type": "string",
                                "description": "Optional task description"
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high"],
                                "description": "Task priority (default: medium)"
                            },
                            "category": {
                                "type": "string",
                                "description": "Optional task category"
                            }
                        },
                        "required": ["title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_tasks",
                    "description": "List all tasks for the user, optionally filtered by status",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["completed", "pending"],
                                "description": "Optional filter by task status"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of tasks to return (default: 100)"
                            }
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as completed",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "The ID of the task to complete"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_task",
                    "description": "Delete a task",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "The ID of the task to delete"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_task",
                    "description": "Update task details",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "The ID of the task to update"
                            },
                            "title": {
                                "type": "string",
                                "description": "New task title"
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high"],
                                "description": "New task priority"
                            },
                            "category": {
                                "type": "string",
                                "description": "New task category"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            }
        ]

        # Call OpenAI API with function calling
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        # If the model wants to call tools
        if tool_calls:
            # Add assistant's response to messages
            messages.append(response_message)

            # Execute each tool call
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                logger.info(f"Agent calling tool: {function_name} with args: {function_args}")

                # Call the appropriate MCP tool
                if function_name == "add_task":
                    function_response = MCPTools.add_task(user_id=user_id, **function_args)
                elif function_name == "list_tasks":
                    function_response = MCPTools.list_tasks(user_id=user_id, **function_args)
                elif function_name == "complete_task":
                    function_response = MCPTools.complete_task(user_id=user_id, **function_args)
                elif function_name == "delete_task":
                    function_response = MCPTools.delete_task(user_id=user_id, **function_args)
                elif function_name == "update_task":
                    function_response = MCPTools.update_task(user_id=user_id, **function_args)
                else:
                    function_response = {"error": f"Unknown function: {function_name}"}

                # Add tool response to messages
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": str(function_response)
                })

            # Get final response from the model
            second_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )

            return second_response.choices[0].message.content

        # If no tool calls, return the direct response
        return response_message.content

    except Exception as e:
        logger.error(f"Error running agent: {str(e)}", exc_info=True)
        return f"I'm sorry, I encountered an error while processing your request. Please try again later."
