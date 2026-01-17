# Task T011, T012, T013: MCP Server with Task Management Tools
# Phase III: AI Chatbot - MCP tools wrapping Phase II task operations
from typing import Optional, List, Dict, Any
from sqlmodel import Session
from .. import models, schemas
from ..services import task_service
from ..database import engine
import logging

logger = logging.getLogger(__name__)


class MCPTools:
    """
    MCP (Model Context Protocol) tools for task management.
    These tools wrap Phase II task operations for use by the AI agent.
    All operations are user-scoped for security.
    """

    @staticmethod
    def add_task(
        user_id: int,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        category: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new task for the user.

        Args:
            user_id: ID of the user creating the task
            title: Task title (required)
            description: Optional task description
            priority: Task priority (low, medium, high)
            category: Optional task category
            due_date: Optional due date (ISO format)

        Returns:
            Dict with task_id, status, title, and message
        """
        try:
            if engine is None:
                return {
                    "error": "Database not configured",
                    "code": "DB_ERROR"
                }

            with Session(engine) as db:
                # Create task using Phase II service
                task_data = schemas.TaskCreate(
                    title=title,
                    is_completed=False,
                    priority=priority,
                    category=category,
                    due_date=None  # TODO: Parse due_date string to datetime if provided
                )

                db_task = task_service.create_task(
                    db=db,
                    task=task_data,
                    owner_id=user_id
                )

                logger.info(f"Task created via MCP: task_id={db_task.id}, user_id={user_id}")

                return {
                    "task_id": db_task.id,
                    "status": "created",
                    "title": db_task.title,
                    "message": f"Task '{db_task.title}' created successfully"
                }

        except Exception as e:
            logger.error(f"Error creating task via MCP: {str(e)}", exc_info=True)
            return {
                "error": str(e),
                "code": "CREATE_ERROR"
            }

    @staticmethod
    def list_tasks(
        user_id: int,
        status: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        List tasks for the user.

        Args:
            user_id: ID of the user
            status: Optional filter by status (completed, pending)
            limit: Maximum number of tasks to return

        Returns:
            Dict with tasks array and count
        """
        try:
            if engine is None:
                return {
                    "error": "Database not configured",
                    "code": "DB_ERROR"
                }

            with Session(engine) as db:
                # Get tasks using Phase II service
                tasks = task_service.get_tasks(
                    db=db,
                    owner_id=user_id,
                    skip=0,
                    limit=limit
                )

                # Filter by status if provided
                if status == "completed":
                    tasks = [t for t in tasks if t.is_completed]
                elif status == "pending":
                    tasks = [t for t in tasks if not t.is_completed]

                # Convert to dict format
                task_list = [
                    {
                        "id": t.id,
                        "title": t.title,
                        "is_completed": t.is_completed,
                        "priority": t.priority,
                        "category": t.category,
                        "created_at": t.created_at.isoformat() if t.created_at else None
                    }
                    for t in tasks
                ]

                logger.info(f"Tasks listed via MCP: user_id={user_id}, count={len(task_list)}")

                return {
                    "tasks": task_list,
                    "count": len(task_list),
                    "message": f"Found {len(task_list)} task(s)"
                }

        except Exception as e:
            logger.error(f"Error listing tasks via MCP: {str(e)}", exc_info=True)
            return {
                "error": str(e),
                "code": "LIST_ERROR"
            }

    @staticmethod
    def complete_task(user_id: int, task_id: int) -> Dict[str, Any]:
        """
        Mark a task as completed.

        Args:
            user_id: ID of the user
            task_id: ID of the task to complete

        Returns:
            Dict with task_id, status, title, and message
        """
        try:
            if engine is None:
                return {
                    "error": "Database not configured",
                    "code": "DB_ERROR"
                }

            with Session(engine) as db:
                # Get task and verify ownership
                db_task = task_service.get_task(db, task_id=task_id)

                if not db_task:
                    return {
                        "error": "Task not found",
                        "code": "NOT_FOUND"
                    }

                if db_task.owner_id != user_id:
                    return {
                        "error": "Task not found",
                        "code": "NOT_FOUND"
                    }

                # Update task using Phase II service
                task_update = schemas.TaskUpdate(is_completed=True)
                updated_task = task_service.update_task(
                    db=db,
                    db_task=db_task,
                    task_in=task_update
                )

                logger.info(f"Task completed via MCP: task_id={task_id}, user_id={user_id}")

                return {
                    "task_id": updated_task.id,
                    "status": "completed",
                    "title": updated_task.title,
                    "message": f"Task '{updated_task.title}' marked as completed"
                }

        except Exception as e:
            logger.error(f"Error completing task via MCP: {str(e)}", exc_info=True)
            return {
                "error": str(e),
                "code": "COMPLETE_ERROR"
            }

    @staticmethod
    def delete_task(user_id: int, task_id: int) -> Dict[str, Any]:
        """
        Delete a task.

        Args:
            user_id: ID of the user
            task_id: ID of the task to delete

        Returns:
            Dict with task_id, status, and message
        """
        try:
            if engine is None:
                return {
                    "error": "Database not configured",
                    "code": "DB_ERROR"
                }

            with Session(engine) as db:
                # Get task and verify ownership
                db_task = task_service.get_task(db, task_id=task_id)

                if not db_task:
                    return {
                        "error": "Task not found",
                        "code": "NOT_FOUND"
                    }

                if db_task.owner_id != user_id:
                    return {
                        "error": "Task not found",
                        "code": "NOT_FOUND"
                    }

                task_title = db_task.title

                # Delete task using Phase II service
                task_service.delete_task(db=db, db_task=db_task)

                logger.info(f"Task deleted via MCP: task_id={task_id}, user_id={user_id}")

                return {
                    "task_id": task_id,
                    "status": "deleted",
                    "message": f"Task '{task_title}' deleted successfully"
                }

        except Exception as e:
            logger.error(f"Error deleting task via MCP: {str(e)}", exc_info=True)
            return {
                "error": str(e),
                "code": "DELETE_ERROR"
            }

    @staticmethod
    def update_task(
        user_id: int,
        task_id: int,
        title: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update task details.

        Args:
            user_id: ID of the user
            task_id: ID of the task to update
            title: Optional new title
            priority: Optional new priority
            category: Optional new category

        Returns:
            Dict with task_id, status, title, and message
        """
        try:
            if engine is None:
                return {
                    "error": "Database not configured",
                    "code": "DB_ERROR"
                }

            with Session(engine) as db:
                # Get task and verify ownership
                db_task = task_service.get_task(db, task_id=task_id)

                if not db_task:
                    return {
                        "error": "Task not found",
                        "code": "NOT_FOUND"
                    }

                if db_task.owner_id != user_id:
                    return {
                        "error": "Task not found",
                        "code": "NOT_FOUND"
                    }

                # Build update data
                update_data = {}
                if title is not None:
                    update_data["title"] = title
                if priority is not None:
                    update_data["priority"] = priority
                if category is not None:
                    update_data["category"] = category

                if not update_data:
                    return {
                        "error": "No fields to update",
                        "code": "NO_UPDATE"
                    }

                # Update task using Phase II service
                task_update = schemas.TaskUpdate(**update_data)
                updated_task = task_service.update_task(
                    db=db,
                    db_task=db_task,
                    task_in=task_update
                )

                logger.info(f"Task updated via MCP: task_id={task_id}, user_id={user_id}")

                return {
                    "task_id": updated_task.id,
                    "status": "updated",
                    "title": updated_task.title,
                    "message": f"Task '{updated_task.title}' updated successfully"
                }

        except Exception as e:
            logger.error(f"Error updating task via MCP: {str(e)}", exc_info=True)
            return {
                "error": str(e),
                "code": "UPDATE_ERROR"
            }
