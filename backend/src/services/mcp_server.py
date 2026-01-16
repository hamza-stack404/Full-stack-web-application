# Task T011-T013: MCP Server for Phase III AI Chatbot
# Exposes task operations as standardized MCP tools for AI agent
import logging
from typing import Optional, Dict, Any, List
from sqlmodel import Session, select
from ..database import engine
from ..models import Task

logger = logging.getLogger(__name__)


class MCPTools:
    """
    MCP (Model Context Protocol) tools that expose task operations
    to the AI agent. All tools enforce user_id validation for security.
    """

    @staticmethod
    def add_task(
        user_id: int,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        category: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new task for the user.

        Args:
            user_id: ID of the user creating the task (required for isolation)
            title: Task title (required)
            description: Optional task description
            priority: Task priority - "low", "medium", or "high" (default: "medium")
            category: Optional task category
            tags: Optional list of tags for organizing tasks

        Returns:
            Dict with task_id, status, and title
        """
        try:
            with Session(engine) as session:
                task = Task(
                    title=title,
                    owner_id=user_id,
                    priority=priority,
                    category=category,
                    tags=tags,
                    is_completed=False
                )
                session.add(task)
                session.commit()
                session.refresh(task)

                logger.info(f"Created task {task.id} for user {user_id}")
                return {
                    "task_id": task.id,
                    "status": "success",
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags
                }
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to create task: {str(e)}"
            }

    @staticmethod
    def list_tasks(
        user_id: int,
        status: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        List all tasks for the user, optionally filtered by status.

        Args:
            user_id: ID of the user (required for isolation)
            status: Optional filter - "completed" or "pending"
            limit: Maximum number of tasks to return (default: 100)

        Returns:
            Dict with tasks array and count
        """
        try:
            with Session(engine) as session:
                query = select(Task).where(Task.owner_id == user_id)

                # Apply status filter if provided
                if status == "completed":
                    query = query.where(Task.is_completed == True)
                elif status == "pending":
                    query = query.where(Task.is_completed == False)

                # Apply limit
                query = query.limit(limit)

                tasks = session.exec(query).all()

                task_list = [
                    {
                        "id": task.id,
                        "title": task.title,
                        "is_completed": task.is_completed,
                        "priority": task.priority,
                        "category": task.category,
                        "tags": task.tags,
                        "created_at": task.created_at.isoformat() if task.created_at else None
                    }
                    for task in tasks
                ]

                logger.info(f"Listed {len(task_list)} tasks for user {user_id}")
                return {
                    "status": "success",
                    "tasks": task_list,
                    "count": len(task_list)
                }
        except Exception as e:
            logger.error(f"Error listing tasks: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to list tasks: {str(e)}"
            }

    @staticmethod
    def complete_task(user_id: int, task_id: int) -> Dict[str, Any]:
        """
        Mark a task as completed.

        Args:
            user_id: ID of the user (required for isolation)
            task_id: ID of the task to complete

        Returns:
            Dict with task_id, status, and title
        """
        try:
            with Session(engine) as session:
                task = session.get(Task, task_id)

                if not task:
                    return {
                        "status": "error",
                        "message": f"Task {task_id} not found"
                    }

                # Validate user ownership
                if task.owner_id != user_id:
                    return {
                        "status": "error",
                        "message": "You don't have permission to complete this task"
                    }

                task.is_completed = True
                session.add(task)
                session.commit()
                session.refresh(task)

                logger.info(f"Completed task {task_id} for user {user_id}")
                return {
                    "task_id": task.id,
                    "status": "success",
                    "title": task.title,
                    "is_completed": task.is_completed
                }
        except Exception as e:
            logger.error(f"Error completing task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to complete task: {str(e)}"
            }

    @staticmethod
    def delete_task(user_id: int, task_id: int) -> Dict[str, Any]:
        """
        Delete a task.

        Args:
            user_id: ID of the user (required for isolation)
            task_id: ID of the task to delete

        Returns:
            Dict with task_id and status
        """
        try:
            with Session(engine) as session:
                task = session.get(Task, task_id)

                if not task:
                    return {
                        "status": "error",
                        "message": f"Task {task_id} not found"
                    }

                # Validate user ownership
                if task.owner_id != user_id:
                    return {
                        "status": "error",
                        "message": "You don't have permission to delete this task"
                    }

                title = task.title
                session.delete(task)
                session.commit()

                logger.info(f"Deleted task {task_id} for user {user_id}")
                return {
                    "task_id": task_id,
                    "status": "success",
                    "title": title,
                    "message": f"Task '{title}' has been deleted"
                }
        except Exception as e:
            logger.error(f"Error deleting task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to delete task: {str(e)}"
            }

    @staticmethod
    def update_task(
        user_id: int,
        task_id: int,
        title: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Update task details.

        Args:
            user_id: ID of the user (required for isolation)
            task_id: ID of the task to update
            title: New task title (optional)
            priority: New task priority (optional)
            category: New task category (optional)
            tags: New list of tags (optional)

        Returns:
            Dict with task_id, status, and updated fields
        """
        try:
            with Session(engine) as session:
                task = session.get(Task, task_id)

                if not task:
                    return {
                        "status": "error",
                        "message": f"Task {task_id} not found"
                    }

                # Validate user ownership
                if task.owner_id != user_id:
                    return {
                        "status": "error",
                        "message": "You don't have permission to update this task"
                    }

                # Update fields if provided
                if title is not None:
                    task.title = title
                if priority is not None:
                    task.priority = priority
                if category is not None:
                    task.category = category
                if tags is not None:
                    task.tags = tags

                session.add(task)
                session.commit()
                session.refresh(task)

                logger.info(f"Updated task {task_id} for user {user_id}")
                return {
                    "task_id": task.id,
                    "status": "success",
                    "title": task.title,
                    "priority": task.priority,
                    "category": task.category,
                    "tags": task.tags
                }
        except Exception as e:
            logger.error(f"Error updating task: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to update task: {str(e)}"
            }
