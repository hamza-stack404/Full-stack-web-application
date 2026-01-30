# OpenRouter Agent Service for AI Chatbot
# Orchestrates AI agent with MCP tools for task management using OpenRouter API
import os
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from .mcp_server import MCPTools

logger = logging.getLogger(__name__)

# Validate and configure OpenRouter client
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

if not OPENROUTER_API_KEY:
    logger.error("OPENROUTER_API_KEY environment variable is not set")
    client = None
else:
    try:
        # OpenRouter uses OpenAI-compatible API
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        logger.info(f"OpenRouter client initialized successfully with model: {OPENROUTER_MODEL}")
    except Exception as e:
        logger.error(f"Failed to initialize OpenRouter client: {type(e).__name__}")
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
If users ask about topics unrelated to task management:
- Politely acknowledge their question
- Gently redirect them back to task management
- Example: "I appreciate your question, but I'm specifically designed to help with task management. Is there anything I can help you organize or track?"

💡 BEST PRACTICES:
1. Always confirm actions: "I've added 'Buy groceries' to your tasks with high priority"
2. Be proactive: Suggest organizing tasks by priority or category when appropriate
3. Use emojis sparingly to keep responses friendly but professional
4. When listing tasks, format them clearly with IDs, titles, and status
5. If a task operation fails, explain why and suggest alternatives

🎯 TASK MANAGEMENT TIPS:
- Encourage users to set priorities for better organization
- Suggest breaking large tasks into smaller ones
- Remind users to review completed tasks periodically
- Help users categorize tasks for better tracking

Remember: You're here to make task management easy and stress-free!"""


def run_agent(user_id: int, message: str, conversation_history: List[Dict[str, str]] = None) -> str:
    """
    Run the AI agent with MCP tools to process user messages and manage tasks.

    Args:
        user_id: The ID of the user making the request
        message: The user's message
        conversation_history: Previous messages in the conversation

    Returns:
        The agent's response as a string
    """
    # Check if OpenRouter client is initialized
    if not client:
        logger.error("OpenRouter client not initialized - API key may be missing or invalid")
        return "I'm sorry, but I'm currently unable to process your request. The AI service is not properly configured. Please contact support."

    try:
        # Define tool functions that will be called by the AI
        # MCPTools uses static methods, so we call them directly with user_id
        def add_task(title: str, description: str = "", priority: str = "medium",
                    category: str = None, tags: List[str] = None) -> Dict[str, Any]:
            """Add a new task for the user"""
            return MCPTools.add_task(user_id, title, description, priority, category, tags)

        def list_tasks(status: str = None) -> Dict[str, Any]:
            """List all tasks, optionally filtered by status (completed/pending)"""
            return MCPTools.list_tasks(user_id, status)

        def complete_task(task_id: int) -> Dict[str, Any]:
            """Mark a task as completed"""
            return MCPTools.complete_task(user_id, task_id)

        def delete_task(task_id: int) -> Dict[str, Any]:
            """Delete a task"""
            return MCPTools.delete_task(user_id, task_id)

        def update_task(task_id: int, title: str = None, priority: str = None,
                       category: str = None, tags: List[str] = None) -> Dict[str, Any]:
            """Update task details"""
            return MCPTools.update_task(user_id, task_id, title, priority, category, tags)

        # Define tools for OpenRouter using OpenAI function calling format
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "add_task",
                    "description": "Create a new task with title, optional description, priority, category, and tags",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "The task title (required)"
                            },
                            "description": {
                                "type": "string",
                                "description": "Optional task description"
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high"],
                                "description": "Task priority level"
                            },
                            "category": {
                                "type": "string",
                                "description": "Optional task category"
                            },
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Optional list of tags"
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
                    "description": "List all tasks, optionally filtered by completion status",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["completed", "pending"],
                                "description": "Filter tasks by status (optional)"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as completed by its ID",
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
                    "description": "Delete a task by its ID",
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
                    "description": "Update task details by ID",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {
                                "type": "integer",
                                "description": "The ID of the task to update"
                            },
                            "title": {
                                "type": "string",
                                "description": "New task title (optional)"
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["low", "medium", "high"],
                                "description": "New priority level (optional)"
                            },
                            "category": {
                                "type": "string",
                                "description": "New category (optional)"
                            },
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "New list of tags (optional)"
                            }
                        },
                        "required": ["task_id"]
                    }
                }
            }
        ]

        # Build conversation messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)

        # Add current user message
        messages.append({"role": "user", "content": message})

        # Call OpenRouter API with function calling
        logger.info(f"Calling OpenRouter API with model: {OPENROUTER_MODEL}")
        response = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )

        # Process response and handle function calls
        assistant_message = response.choices[0].message

        # Check if the model wants to call functions
        if assistant_message.tool_calls:
            # Execute function calls
            messages.append(assistant_message)

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                logger.info(f"Executing function: {function_name} with args: {function_args}")

                # Call the appropriate function
                if function_name == "add_task":
                    function_response = add_task(**function_args)
                elif function_name == "list_tasks":
                    function_response = list_tasks(**function_args)
                elif function_name == "complete_task":
                    function_response = complete_task(**function_args)
                elif function_name == "delete_task":
                    function_response = delete_task(**function_args)
                elif function_name == "update_task":
                    function_response = update_task(**function_args)
                else:
                    function_response = {"error": f"Unknown function: {function_name}"}

                # Add function response to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(function_response)
                })

            # Get final response from the model
            second_response = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages
            )

            return second_response.choices[0].message.content

        # No function calls, return the response directly
        return assistant_message.content

    except Exception as e:
        logger.error(f"Error in agent execution: {str(e)}", exc_info=True)
        return "I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists."
